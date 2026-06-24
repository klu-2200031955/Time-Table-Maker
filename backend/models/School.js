const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const schoolSchema = new mongoose.Schema({
  schoolName: {
    type: String,
    required: true,
    trim: true
  },
  schoolType: {
    type: String,
    required: true,
    enum: ['Primary School', 'High School']
  },
  headmasterName: {
    type: String,
    required: true,
    trim: true
  },
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  schoolTimings: {
    workingDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    periodsPerDay: {
      type: Number,
      default: 8
    },
    lunchAfterPeriod: {
      type: Number,
      default: 4
    },
    periodDuration: {
      type: Number,
      default: 45
    },
    assemblyStart: {
      type: String,
      default: '08:45 AM'
    },
    assemblyEnd: {
      type: String,
      default: '09:00 AM'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to check password validity
schoolSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Middleware to hash password before save
schoolSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

module.exports = mongoose.model('School', schoolSchema);
