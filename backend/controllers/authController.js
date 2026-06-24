const jwt = require('jsonwebtoken');
const School = require('../models/School');
const Class = require('../models/Class');
const AcademicYear = require('../models/AcademicYear');
const Subject = require('../models/Subject');
const { getAcademicYear } = require('../utils/academicYear');

const generateToken = (school) => {
  return jwt.sign(
    { id: school._id, email: school.email },
    process.env.JWT_SECRET || 'fallback_secret_key_123',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new school
// @route   POST /api/auth/register
// @access  Public
const registerSchool = async (req, res) => {
  try {
    const { schoolName, schoolType, headmasterName, mobile, email, password } = req.body;

    // Check if school already exists
    const schoolExists = await School.findOne({ email });
    if (schoolExists) {
      return res.status(400).json({ message: 'School with this email already exists' });
    }

    // Create school
    const school = await School.create({
      schoolName,
      schoolType,
      headmasterName,
      mobile,
      email,
      passwordHash: password // Model pre-save hashes it
    });

    if (school) {
      // 1. Seed classes based on School Type
      const defaultClasses = [];
      if (schoolType === 'Primary School') {
        defaultClasses.push('Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5');
      } else {
        defaultClasses.push('Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10');
      }

      // Create each class with a default section 'A'
      for (const className of defaultClasses) {
        await Class.create({
          schoolId: school._id,
          className,
          section: 'A'
        });
      }

      // 2. Seed predefined subjects
      const defaultSubjects = [
        { subjectName: 'Telugu', subjectCode: 'TEL', weeklyPeriods: 6 },
        { subjectName: 'Hindi', subjectCode: 'HIN', weeklyPeriods: 6 },
        { subjectName: 'English', subjectCode: 'ENG', weeklyPeriods: 6 },
        { subjectName: 'Math', subjectCode: 'MAT', weeklyPeriods: 7 },
        { subjectName: 'Social', subjectCode: 'SOC', weeklyPeriods: 6 },
        { subjectName: 'Craft', subjectCode: 'CRA', weeklyPeriods: 3 },
        { subjectName: 'Physical Department(PD)', subjectCode: 'PD', weeklyPeriods: 3 },
        { subjectName: 'General Science', subjectCode: 'GSCI', weeklyPeriods: 6 }
      ];

      // High School has classes 8-10, so seed Physics and Biology
      if (schoolType === 'High School') {
        defaultSubjects.push(
          { subjectName: 'Physics', subjectCode: 'PHY', weeklyPeriods: 4 },
          { subjectName: 'Biology', subjectCode: 'BIO', weeklyPeriods: 4 }
        );
      }

      for (const sub of defaultSubjects) {
        await Subject.create({
          schoolId: school._id,
          subjectName: sub.subjectName,
          subjectCode: sub.subjectCode,
          weeklyPeriods: sub.weeklyPeriods
        });
      }

      // 3. Create the current Academic Year
      const currentYear = getAcademicYear();
      await AcademicYear.create({
        schoolId: school._id,
        academicYear: currentYear
      });

      res.status(201).json({
        _id: school._id,
        schoolName: school.schoolName,
        schoolType: school.schoolType,
        headmasterName: school.headmasterName,
        mobile: school.mobile,
        email: school.email,
        token: generateToken(school)
      });
    } else {
      res.status(400).json({ message: 'Invalid school data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login school admin
// @route   POST /api/auth/login
// @access  Public
const loginSchool = async (req, res) => {
  try {
    const { email, password } = req.body;

    const school = await School.findOne({ email });

    if (school && (await school.matchPassword(password))) {
      res.json({
        _id: school._id,
        schoolName: school.schoolName,
        schoolType: school.schoolType,
        headmasterName: school.headmasterName,
        mobile: school.mobile,
        email: school.email,
        token: generateToken(school)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Simulate Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email, mobile } = req.body;
    const school = await School.findOne({ email, mobile });

    if (!school) {
      return res.status(404).json({ message: 'Invalid email or mobile number match.' });
    }

    // Generate a temporary verification code to simulate the email reset flow
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In a real app, send it via SMS/Email. Here we return it to let the client perform reset easily.
    res.json({
      message: 'Reset verification code generated.',
      resetCode, // Return code so frontend can auto-fill or user can see it
      email
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const school = await School.findOne({ email });

    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    school.passwordHash = newPassword; // Pre-save hooks will hash it
    await school.save();

    res.json({ message: 'Password reset successful. Please login.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerSchool,
  loginSchool,
  forgotPassword,
  resetPassword
};
