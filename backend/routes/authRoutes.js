const express = require('express');
const router = express.Router();
const {
  registerSchool,
  loginSchool,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

router.post('/register', registerSchool);
router.post('/login', loginSchool);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
