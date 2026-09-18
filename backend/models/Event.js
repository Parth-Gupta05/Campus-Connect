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
  registrationDeadline: {
    type: Date
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
  audience: {
    type: String,
    enum: ['All', 'Members Only', 'Department Only'],
    default: 'All'
  },
  targetAudienceBranch: {
    type: String,
    default: ''
  },
  durationHours: {
    type: Number,
    default: 2,
    min: 0.5
  },
  aicteCategory: {
    type: Number,
    default: 5,
    min: 1,
    max: 15
  },
  activitySummary: {
    type: String,
    default: ''
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
    designation: {
      type: String,
      default: 'Member'
    },
    tier: {
      type: String,
      enum: ['Core', 'WC', 'Member', 'General'],
      default: 'Member'
    },
    aicteHours: {
      type: Number,
      default: 0
    },
    aictePoints: {
      type: Number,
      default: 0
    },
    qrCode: {
      type: String,
      default: ''
    },
    certificateUrl: {
      type: String,
      default: ''
    },
    certificateIssuedAt: {
      type: Date,
      default: null
    },
    certificateVerified: {
      type: Boolean,
      default: false
    }
  }],
  certificatesIssued: {
    type: Boolean,
    default: false
  },
  certificatesIssuedAt: {
    type: Date,
    default: null
  },
  certificateBatchUrl: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
