const School = require('../models/School');
const AcademicYear = require('../models/AcademicYear');

// @desc    Get current school profile and settings
// @route   GET /api/school/profile
// @access  Private
const getSchoolProfile = async (req, res) => {
  try {
    const school = await School.findById(req.school.id).select('-passwordHash');
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    res.json(school);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update school profile / timings settings
// @route   PUT /api/school/profile
// @access  Private
const updateSchoolProfile = async (req, res) => {
  try {
    const school = await School.findById(req.school.id);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    const { schoolName, headmasterName, mobile, email, schoolTimings, currentPassword, newPassword } = req.body;

    // Handle Password Change Request
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to change password.' });
      }
      
      const isMatch = await school.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect.' });
      }

      school.passwordHash = newPassword; // Pre-save hook will hash it
    }

    if (email && email.toLowerCase() !== school.email) {
      const emailExists = await School.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use by another school' });
      }
      school.email = email.toLowerCase();
    }

    school.schoolName = schoolName || school.schoolName;
    school.headmasterName = headmasterName || school.headmasterName;
    school.mobile = mobile || school.mobile;
    
    if (schoolTimings) {
      school.schoolTimings = {
        workingDays: schoolTimings.workingDays || school.schoolTimings.workingDays,
        periodsPerDay: schoolTimings.periodsPerDay !== undefined ? Number(schoolTimings.periodsPerDay) : school.schoolTimings.periodsPerDay,
        lunchAfterPeriod: schoolTimings.lunchAfterPeriod !== undefined ? Number(schoolTimings.lunchAfterPeriod) : school.schoolTimings.lunchAfterPeriod,
        periodDuration: schoolTimings.periodDuration !== undefined ? Number(schoolTimings.periodDuration) : school.schoolTimings.periodDuration,
        assemblyStart: schoolTimings.assemblyStart || school.schoolTimings.assemblyStart,
        assemblyEnd: schoolTimings.assemblyEnd || school.schoolTimings.assemblyEnd
      };
    }

    const updatedSchool = await school.save();
    // Exclude password
    const schoolObj = updatedSchool.toObject();
    delete schoolObj.passwordHash;

    res.json(schoolObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all academic years for the school
// @route   GET /api/school/academic-years
// @access  Private
const getAcademicYears = async (req, res) => {
  try {
    const years = await AcademicYear.find({ schoolId: req.school.id }).sort({ academicYear: -1 });
    res.json(years);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new academic year
// @route   POST /api/school/academic-years
// @access  Private
const createAcademicYear = async (req, res) => {
  try {
    const { academicYear } = req.body;
    if (!academicYear) {
      return res.status(400).json({ message: 'Academic year string is required' });
    }

    // Check if it already exists
    const exists = await AcademicYear.findOne({
      schoolId: req.school.id,
      academicYear: academicYear.trim()
    });

    if (exists) {
      return res.status(400).json({ message: 'Academic year already exists' });
    }

    const newYear = await AcademicYear.create({
      schoolId: req.school.id,
      academicYear: academicYear.trim()
    });

    res.status(201).json(newYear);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSchoolProfile,
  updateSchoolProfile,
  getAcademicYears,
  createAcademicYear
};
