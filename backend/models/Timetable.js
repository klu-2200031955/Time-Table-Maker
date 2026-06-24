const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  academicYear: {
    type: String,
    required: true,
    trim: true
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
  },
  day: {
    type: String,
    required: true,
    trim: true // e.g. 'Monday', 'Tuesday', ...
  },
  period: {
    type: Number,
    required: true // 1, 2, 3, ...
  },
  subject: {
    type: String,
    required: true,
    trim: true // Subject Name or Code
  },
  teacherShortName: {
    type: String,
    required: true,
    trim: true // Teacher Short Name
  },
  isLocked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// A unique compound index to prevent scheduling overlap in the database
timetableSchema.index({ schoolId: 1, academicYear: 1, className: 1, section: 1, day: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', timetableSchema);
