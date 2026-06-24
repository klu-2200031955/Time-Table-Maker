const Subject = require('../models/Subject');
const SubjectAllocation = require('../models/SubjectAllocation');

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ schoolId: req.school.id }).sort({ subjectName: 1 });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a subject
// @route   POST /api/subjects
// @access  Private
const createSubject = async (req, res) => {
  try {
    const { subjectName, subjectCode, weeklyPeriods } = req.body;

    if (!subjectName || !subjectCode || !weeklyPeriods) {
      return res.status(400).json({ message: 'Subject name, code, and weekly periods are required' });
    }

    // Check if subjectCode is unique within the school
    const subjectExists = await Subject.findOne({
      schoolId: req.school.id,
      subjectCode: { $regex: `^${subjectCode}$`, $options: 'i' }
    });

    if (subjectExists) {
      return res.status(400).json({ message: 'Subject code must be unique' });
    }

    const subject = await Subject.create({
      schoolId: req.school.id,
      subjectName,
      subjectCode: subjectCode.toUpperCase(),
      weeklyPeriods: Number(weeklyPeriods)
    });

    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a subject
// @route   PUT /api/subjects/:id
// @access  Private
const updateSubject = async (req, res) => {
  try {
    const { subjectName, subjectCode, weeklyPeriods } = req.body;
    const subject = await Subject.findOne({ _id: req.params.id, schoolId: req.school.id });

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Check if subjectCode is unique if changed
    if (subjectCode && subjectCode.toUpperCase() !== subject.subjectCode) {
      const subjectExists = await Subject.findOne({
        schoolId: req.school.id,
        subjectCode: { $regex: `^${subjectCode}$`, $options: 'i' },
        _id: { $ne: req.params.id }
      });

      if (subjectExists) {
        return res.status(400).json({ message: 'Subject code must be unique' });
      }
      subject.subjectCode = subjectCode.toUpperCase();
    }

    subject.subjectName = subjectName || subject.subjectName;
    subject.weeklyPeriods = weeklyPeriods !== undefined ? Number(weeklyPeriods) : subject.weeklyPeriods;

    const updatedSubject = await subject.save();
    res.json(updatedSubject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a subject
// @route   DELETE /api/subjects/:id
// @access  Private
const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findOneAndDelete({ _id: req.params.id, schoolId: req.school.id });

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Remove subject allocations linked to this subject
    await SubjectAllocation.deleteMany({ schoolId: req.school.id, subjectId: req.params.id });

    res.json({ message: 'Subject deleted and related allocations cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject
};
