const express = require('express');
const router = express.Router();
const {
  getSchoolProfile,
  updateSchoolProfile,
  getAcademicYears,
  createAcademicYear
} = require('../controllers/schoolController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/profile')
  .get(getSchoolProfile)
  .put(updateSchoolProfile);

router.route('/academic-years')
  .get(getAcademicYears)
  .post(createAcademicYear);

module.exports = router;
