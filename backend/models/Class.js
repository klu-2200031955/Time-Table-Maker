const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  className: {
    type: String,
    required: true,
    trim: true
  },
  section: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// A school can't have duplicate section for a class
classSchema.index({ schoolId: 1, className: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);
