const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  clubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  posterImage: {
    type: String,
    default: ''
  },
  contactPerson: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  venue: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed'],
    default: 'upcoming'
  },
  registeredStudents: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    attendanceStatus: {
      type: String,
      enum: ['pending', 'present', 'absent'],
      default: 'pending'
    },
    qrCode: {
      type: String,
      default: ''
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
