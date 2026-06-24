const SubjectAllocation = require('../models/SubjectAllocation');
const Subject = require('../models/Subject');
const Class = require('../models/Class');

// Helper to validate class restrictions by subject code
const validateAllocationConstraints = async (subjectId, classesArray, schoolId) => {
  const subject = await Subject.findOne({ _id: subjectId, schoolId });
  if (!subject) {
    throw new Error('Subject not found.');
  }

  const classesList = await Class.find({ _id: { $in: classesArray }, schoolId });
  for (const c of classesList) {
    const classNum = parseInt(c.className.replace(/\D/g, '')) || 0;
    if (subject.subjectCode === 'GSCI' && classNum > 7) {
      throw new Error('General Science can only be allocated to classes from Class 1 to 7.');
    }
    if ((subject.subjectCode === 'PHY' || subject.subjectCode === 'BIO') && classNum < 8) {
      throw new Error(`${subject.subjectName} can only be allocated to classes from Class 8 to 10.`);
    }
  }
};

// @desc    Get all subject allocations
// @route   GET /api/allocations
// @access  Private
const getAllocations = async (req, res) => {
  try {
    const allocations = await SubjectAllocation.find({ schoolId: req.school.id })
      .populate('teacherId', 'fullName shortName subject')
      .populate('subjectId', 'subjectName subjectCode weeklyPeriods')
      .populate('classes', 'className section');

    res.json(allocations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a subject allocation
// @route   POST /api/allocations
// @access  Private
const createAllocation = async (req, res) => {
  try {
    const { teacherId, subjectId, classes } = req.body;

    if (!teacherId || !subjectId || !classes || !Array.isArray(classes) || classes.length === 0) {
      return res.status(400).json({ message: 'Teacher, Subject, and at least one Class are required' });
    }

    // Validate Constraints
    try {
      await validateAllocationConstraints(subjectId, classes, req.school.id);
    } catch (validationErr) {
      return res.status(400).json({ message: validationErr.message });
    }

    // Check if an allocation with this teacher and subject already exists
    let allocation = await SubjectAllocation.findOne({
      schoolId: req.school.id,
      teacherId,
      subjectId
    });

    if (allocation) {
      // If it exists, append the new classes, avoiding duplicates
      const existingClassIds = allocation.classes.map(c => c.toString());
      classes.forEach(classId => {
        if (!existingClassIds.includes(classId)) {
          allocation.classes.push(classId);
        }
      });
      await allocation.save();
    } else {
      // Create new allocation
      allocation = await SubjectAllocation.create({
        schoolId: req.school.id,
        teacherId,
        subjectId,
        classes
      });
    }

    const populatedAllocation = await SubjectAllocation.findById(allocation._id)
      .populate('teacherId', 'fullName shortName subject')
      .populate('subjectId', 'subjectName subjectCode weeklyPeriods')
      .populate('classes', 'className section');

    res.status(201).json(populatedAllocation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a subject allocation
// @route   PUT /api/allocations/:id
// @access  Private
const updateAllocation = async (req, res) => {
  try {
    const { teacherId, subjectId, classes } = req.body;

    if (!teacherId || !subjectId || !classes || !Array.isArray(classes) || classes.length === 0) {
      return res.status(400).json({ message: 'Teacher, Subject, and at least one Class are required' });
    }

    // Validate Constraints
    try {
      await validateAllocationConstraints(subjectId, classes, req.school.id);
    } catch (validationErr) {
      return res.status(400).json({ message: validationErr.message });
    }

    const allocation = await SubjectAllocation.findOne({ _id: req.params.id, schoolId: req.school.id });

    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    allocation.teacherId = teacherId;
    allocation.subjectId = subjectId;
    allocation.classes = classes;

    await allocation.save();

    const populatedAllocation = await SubjectAllocation.findById(allocation._id)
      .populate('teacherId', 'fullName shortName subject')
      .populate('subjectId', 'subjectName subjectCode weeklyPeriods')
      .populate('classes', 'className section');

    res.json(populatedAllocation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a subject allocation
// @route   DELETE /api/allocations/:id
// @access  Private
const deleteAllocation = async (req, res) => {
  try {
    const allocation = await SubjectAllocation.findOneAndDelete({
      _id: req.params.id,
      schoolId: req.school.id
    });

    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    res.json({ message: 'Allocation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllocations,
  createAllocation,
  updateAllocation,
  deleteAllocation
};
