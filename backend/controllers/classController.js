const Class = require('../models/Class');
const SubjectAllocation = require('../models/SubjectAllocation');

// @desc    Get all classes & sections
// @route   GET /api/classes
// @access  Private
const getClasses = async (req, res) => {
  try {
    // Sort class name and section naturally (e.g. Class 1, Class 2, then A, B)
    const classes = await Class.find({ schoolId: req.school.id });
    
    // Sort logic to handle numeric and alphabetical ordering nicely
    classes.sort((a, b) => {
      const numA = parseInt(a.className.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.className.replace(/\D/g, '')) || 0;
      if (numA !== numB) return numA - numB;
      return a.section.localeCompare(b.section);
    });

    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a class section
// @route   POST /api/classes
// @access  Private
const createClass = async (req, res) => {
  try {
    const { className, section } = req.body;

    if (!className || !section) {
      return res.status(400).json({ message: 'Class name and section are required' });
    }

    // Check uniqueness
    const classExists = await Class.findOne({
      schoolId: req.school.id,
      className: className.trim(),
      section: section.trim().toUpperCase()
    });

    if (classExists) {
      return res.status(400).json({ message: 'This class section already exists' });
    }

    const newClass = await Class.create({
      schoolId: req.school.id,
      className: className.trim(),
      section: section.trim().toUpperCase()
    });

    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a class section
// @route   PUT /api/classes/:id
// @access  Private
const updateClass = async (req, res) => {
  try {
    const { className, section } = req.body;
    const classItem = await Class.findOne({ _id: req.params.id, schoolId: req.school.id });

    if (!classItem) {
      return res.status(404).json({ message: 'Class section not found' });
    }

    // Verify unique constraints if changing name/section
    if (className || section) {
      const newClassName = className ? className.trim() : classItem.className;
      const newSection = section ? section.trim().toUpperCase() : classItem.section;

      if (newClassName !== classItem.className || newSection !== classItem.section) {
        const classExists = await Class.findOne({
          schoolId: req.school.id,
          className: newClassName,
          section: newSection,
          _id: { $ne: req.params.id }
        });

        if (classExists) {
          return res.status(400).json({ message: 'This class section already exists' });
        }
      }

      classItem.className = newClassName;
      classItem.section = newSection;
    }

    const updatedClass = await classItem.save();
    res.json(updatedClass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a class section
// @route   DELETE /api/classes/:id
// @access  Private
const deleteClass = async (req, res) => {
  try {
    const classItem = await Class.findOneAndDelete({ _id: req.params.id, schoolId: req.school.id });

    if (!classItem) {
      return res.status(404).json({ message: 'Class section not found' });
    }

    // Pull this class from any subject allocations
    await SubjectAllocation.updateMany(
      { schoolId: req.school.id },
      { $pull: { classes: req.params.id } }
    );
    
    // Clean up empty allocations
    await SubjectAllocation.deleteMany({ schoolId: req.school.id, classes: { $size: 0 } });

    res.json({ message: 'Class section deleted and related allocations updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getClasses,
  createClass,
  updateClass,
  deleteClass
};
