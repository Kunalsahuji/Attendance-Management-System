const mongoose = require('mongoose');

const overtimeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  attendance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendance',
    default: null
  },
  date: {
    type: String,
    required: true,
    index: true // YYYY-MM-DD
  },
  requestedHours: {
    type: Number,
    required: [true, 'Please provide requested overtime hours'],
    min: [0.5, 'Minimum overtime request is 0.5 hours'],
    max: [12, 'Maximum overtime request is 12 hours']
  },
  reason: {
    type: String,
    required: [true, 'Please provide a reason for overtime'],
    trim: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
    index: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewerNotes: {
    type: String,
    default: ''
  },
  reviewedAt: {
    type: Date
  }
}, {
  timestamps: true
});

const Overtime = mongoose.model('Overtime', overtimeSchema);
module.exports = Overtime;
