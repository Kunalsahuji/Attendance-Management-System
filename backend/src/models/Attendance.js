const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: String,
    required: true,
    index: true // YYYY-MM-DD
  },
  punchInTime: {
    type: Date,
    required: true
  },
  punchInLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: { type: Number, default: 0 }
  },
  punchInSelfie: {
    type: String,
    required: true
  },
  punchOutTime: {
    type: Date
  },
  punchOutLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    accuracy: { type: Number, default: 0 }
  },
  punchOutSelfie: {
    type: String
  },
  totalHours: {
    type: Number,
    default: 0
  },
  totalMinutes: {
    type: Number,
    default: 0
  },
  workStatus: {
    type: String,
    enum: ['IN_PROGRESS', 'COMPLETED', 'INCOMPLETE'],
    default: 'IN_PROGRESS'
  },
  verificationStatus: {
    type: String,
    enum: ['PENDING', 'VALID', 'INVALID'],
    default: 'PENDING'
  },
  verificationRemarks: {
    type: String,
    default: ''
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index to help query single open session per employee
attendanceSchema.index({ user: 1, workStatus: 1 });
attendanceSchema.index({ user: 1, date: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;
