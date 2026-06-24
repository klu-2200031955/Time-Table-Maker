const express = require('express');
const router = express.Router();
const {
  getTimetable,
  generateTimetable,
  updateSlot,
  bulkSave,
  toggleLockSlot
} = require('../controllers/timetableController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getTimetable);
router.post('/generate', generateTimetable);
router.post('/update-slot', updateSlot);
router.post('/bulk-save', bulkSave);
router.post('/toggle-lock', toggleLockSlot);

module.exports = router;
