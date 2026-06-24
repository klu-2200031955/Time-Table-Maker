const Timetable = require('../models/Timetable');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const SubjectAllocation = require('../models/SubjectAllocation');
const School = require('../models/School');
const { generateTimetableData } = require('../services/timetableEngine');
const { getAcademicYear } = require('../utils/academicYear');

// @desc    Get timetable entries (with options to filter by className, section, teacher, day)
// @route   GET /api/timetable
// @access  Private
const getTimetable = async (req, res) => {
  try {
    const { academicYear, className, section, teacherShortName, day } = req.query;
    const activeYear = academicYear || getAcademicYear();

    const query = { schoolId: req.school.id, academicYear: activeYear };

    if (className) query.className = className;
    if (section) query.section = section;
    if (teacherShortName) query.teacherShortName = teacherShortName;
    if (day) query.day = day;

    const entries = await Timetable.find(query);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate full timetable automatically
// @route   POST /api/timetable/generate
// @access  Private
const generateTimetable = async (req, res) => {
  try {
    const { academicYear } = req.body;
    const activeYear = academicYear || getAcademicYear();

    const school = await School.findById(req.school.id);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    // 1. Fetch teachers, subjects, classes, allocations
    const teachers = await Teacher.find({ schoolId: req.school.id });
    const subjects = await Subject.find({ schoolId: req.school.id });
    const classes = await Class.find({ schoolId: req.school.id });
    const allocations = await SubjectAllocation.find({ schoolId: req.school.id })
      .populate('teacherId')
      .populate('subjectId')
      .populate('classes');

    if (teachers.length === 0 || subjects.length === 0 || classes.length === 0) {
      return res.status(400).json({
        message: 'Setup incomplete. Make sure you have added teachers, subjects, and classes.'
      });
    }

    if (allocations.length === 0) {
      return res.status(400).json({
        message: 'No subjects have been allocated yet. Please allocate subjects to teachers first.'
      });
    }

    // 2. Validate total workloads to fail fast before running solver
    const maxPeriodsPerWeek = school.schoolTimings.workingDays.length * school.schoolTimings.periodsPerDay;

    // Check Class Over-allocation
    for (const cls of classes) {
      const classKey = `${cls.className}-${cls.section}`;
      let allocatedPeriods = 0;
      
      allocations.forEach(alloc => {
        const isAssigned = alloc.classes.some(c => c._id.toString() === cls._id.toString());
        if (isAssigned && alloc.subjectId) {
          allocatedPeriods += alloc.subjectId.weeklyPeriods;
        }
      });

      if (allocatedPeriods > maxPeriodsPerWeek) {
        return res.status(400).json({
          message: `Class ${classKey} is over-allocated. Required: ${allocatedPeriods} periods, but only ${maxPeriodsPerWeek} are available in the weekly schedule.`
        });
      }
    }

    // Check Teacher Over-allocation
    for (const teacher of teachers) {
      let teacherPeriods = 0;
      allocations.forEach(alloc => {
        if (alloc.teacherId && alloc.teacherId._id.toString() === teacher._id.toString() && alloc.subjectId) {
          teacherPeriods += alloc.subjectId.weeklyPeriods * alloc.classes.length;
        }
      });

      if (teacherPeriods > maxPeriodsPerWeek) {
        return res.status(400).json({
          message: `Teacher ${teacher.fullName} (${teacher.shortName}) is over-allocated. Assigned to teach ${teacherPeriods} periods, but maximum available periods in the weekly schedule is ${maxPeriodsPerWeek}.`
        });
      }
    }

    // 3. Generate Timetable entries using engine
    let records;
    try {
      records = await generateTimetableData(school, activeYear, teachers, subjects, classes, allocations);
    } catch (engineError) {
      return res.status(400).json({ message: engineError.message });
    }

    // 4. Save generated records: Delete all UNLOCKED entries first
    await Timetable.deleteMany({
      schoolId: req.school.id,
      academicYear: activeYear,
      isLocked: false
    });

    // 5. Insert new records (excluding locked ones which are already in db and not regenerated)
    const recordsToInsert = records.filter(r => !r.isLocked);
    await Timetable.insertMany(recordsToInsert);

    // 6. Return full timetable
    const finalTimetable = await Timetable.find({
      schoolId: req.school.id,
      academicYear: activeYear
    });

    res.status(201).json(finalTimetable);
  } catch (error) {
    console.error('Timetable Generation Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update single timetable slot or swap slots (used by manual editor)
// @route   POST /api/timetable/update-slot
// @access  Private
const updateSlot = async (req, res) => {
  try {
    const { academicYear, className, section, day, period, subject, teacherShortName, isLocked } = req.body;
    const activeYear = academicYear || getAcademicYear();

    if (!className || !section || !day || !period) {
      return res.status(400).json({ message: 'Class name, section, day, and period are required' });
    }

    // Upsert the specific slot
    const filter = {
      schoolId: req.school.id,
      academicYear: activeYear,
      className,
      section,
      day,
      period
    };

    // If subject and teacherShortName are empty/null, delete the slot (free period)
    if (!subject || !teacherShortName) {
      await Timetable.findOneAndDelete(filter);
      return res.json({ message: 'Period freed successfully' });
    }

    // Check teacher double-booking (excluding this class-section)
    const teacherConflict = await Timetable.findOne({
      schoolId: req.school.id,
      academicYear: activeYear,
      day,
      period,
      teacherShortName,
      $or: [
        { className: { $ne: className } },
        { section: { $ne: section } }
      ]
    });

    if (teacherConflict) {
      return res.status(400).json({
        message: `Conflict: Teacher ${teacherShortName} is already assigned to Class ${teacherConflict.className}-${teacherConflict.section} during Period ${period} on ${day}.`
      });
    }

    const update = {
      subject,
      teacherShortName,
      isLocked: isLocked !== undefined ? isLocked : false
    };

    const updatedDoc = await Timetable.findOneAndUpdate(
      filter,
      { $set: update },
      { new: true, upsert: true }
    );

    res.json(updatedDoc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk save updated timetable slots (used by drag and drop manual editor)
// @route   POST /api/timetable/bulk-save
// @access  Private
const bulkSave = async (req, res) => {
  try {
    const { academicYear, slots } = req.body;
    const activeYear = academicYear || getAcademicYear();

    if (!slots || !Array.isArray(slots)) {
      return res.status(400).json({ message: 'Slots array is required' });
    }

    // We can loop through each slot and update it
    for (const slot of slots) {
      const filter = {
        schoolId: req.school.id,
        academicYear: activeYear,
        className: slot.className,
        section: slot.section,
        day: slot.day,
        period: slot.period
      };

      if (!slot.subject || !slot.teacherShortName) {
        // Delete if empty
        await Timetable.findOneAndDelete(filter);
      } else {
        // Update/insert
        await Timetable.findOneAndUpdate(
          filter,
          {
            $set: {
              subject: slot.subject,
              teacherShortName: slot.teacherShortName,
              isLocked: slot.isLocked || false
            }
          },
          { upsert: true }
        );
      }
    }

    const updatedTimetable = await Timetable.find({
      schoolId: req.school.id,
      academicYear: activeYear
    });

    res.json(updatedTimetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle lock status of a slot
// @route   POST /api/timetable/toggle-lock
// @access  Private
const toggleLockSlot = async (req, res) => {
  try {
    const { academicYear, className, section, day, period } = req.body;
    const activeYear = academicYear || getAcademicYear();

    const slot = await Timetable.findOne({
      schoolId: req.school.id,
      academicYear: activeYear,
      className,
      section,
      day,
      period
    });

    if (!slot) {
      return res.status(404).json({ message: 'No assignment found at this slot to lock' });
    }

    slot.isLocked = !slot.isLocked;
    await slot.save();

    res.json(slot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTimetable,
  generateTimetable,
  updateSlot,
  bulkSave,
  toggleLockSlot
};
