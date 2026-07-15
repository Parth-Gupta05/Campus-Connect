const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student',
  },
  name: {
    type: String,
    default: '',
  },
  githubUsername: {
    type: String,
    default: '',
  },
  leetcodeUsername: {
    type: String,
    default: '',
  },
  linkedInUrl: {
    type: String,
    default: '',
  },
  isProfileComplete: {
    type: Boolean,
    default: false,
  },
  scrapedData: {
    type: Object,
    default: null,
  },
  lastScrapedAt: {
    type: Date,
    default: null,
  },
  resumeUrl: {
    type: String,
    default: '',
  },
  resumeDetails: {
    skills: { type: [String], default: [] },
    education: [{
      institution: String,
      degree: String,
      startYear: String,
      endYear: String
    }],
    experience: [{
      company: String,
      role: String,
      startDate: String,
      endDate: String,
      description: String
    }],
    projects: [{
      title: String,
      link: String,
      description: String
    }]
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);