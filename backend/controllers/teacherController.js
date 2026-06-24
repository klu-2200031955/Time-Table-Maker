const Teacher = require('../models/Teacher');
const SubjectAllocation = require('../models/SubjectAllocation');

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Private
const getTeachers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = { schoolId: req.school.id };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { shortName: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const teachers = await Teacher.find(query).sort({ fullName: 1 });
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a teacher
// @route   POST /api/teachers
// @access  Private
const createTeacher = async (req, res) => {
  try {
    const { fullName, shortName, subject, mobile } = req.body;

    if (!fullName || !shortName || !subject) {
      return res.status(400).json({ message: 'Full name, short name and subject are required' });
    }

    // Check if shortName is unique within the school
    const teacherExists = await Teacher.findOne({
      schoolId: req.school.id,
      shortName: { $regex: `^${shortName}$`, $options: 'i' }
    });

    if (teacherExists) {
      return res.status(400).json({ message: 'Teacher short name must be unique' });
    }

    const teacher = await Teacher.create({
      schoolId: req.school.id,
      fullName,
      shortName: shortName.toUpperCase(),
      subject,
      mobile: mobile || ''
    });

    res.status(201).json(teacher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a teacher
// @route   PUT /api/teachers/:id
// @access  Private
const updateTeacher = async (req, res) => {
  try {
    const { fullName, shortName, subject, mobile } = req.body;
    const teacher = await Teacher.findOne({ _id: req.params.id, schoolId: req.school.id });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Check if shortName is unique if changed
    if (shortName && shortName.toUpperCase() !== teacher.shortName) {
      const shortNameExists = await Teacher.findOne({
        schoolId: req.school.id,
        shortName: { $regex: `^${shortName}$`, $options: 'i' },
        _id: { $ne: req.params.id }
      });

      if (shortNameExists) {
        return res.status(400).json({ message: 'Teacher short name must be unique' });
      }
      teacher.shortName = shortName.toUpperCase();
    }

    teacher.fullName = fullName || teacher.fullName;
    teacher.subject = subject || teacher.subject;
    teacher.mobile = mobile !== undefined ? mobile : teacher.mobile;

    const updatedTeacher = await teacher.save();
    res.json(updatedTeacher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a teacher
// @route   DELETE /api/teachers/:id
// @access  Private
const deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findOneAndDelete({ _id: req.params.id, schoolId: req.school.id });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Remove subject allocations linked to this teacher
    await SubjectAllocation.deleteMany({ schoolId: req.school.id, teacherId: req.params.id });

    res.json({ message: 'Teacher deleted and related allocations cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher
};
