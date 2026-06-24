const mongoose = require('mongoose');

const academicYearSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  academicYear: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Ensure a school only has unique academic years
academicYearSchema.index({ schoolId: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('AcademicYear', academicYearSchema);
