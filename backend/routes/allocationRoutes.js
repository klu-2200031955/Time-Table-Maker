const express = require('express');
const router = express.Router();
const {
  getAllocations,
  createAllocation,
  updateAllocation,
  deleteAllocation
} = require('../controllers/allocationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getAllocations)
  .post(createAllocation);

router.route('/:id')
  .put(updateAllocation)
  .delete(deleteAllocation);

module.exports = router;
