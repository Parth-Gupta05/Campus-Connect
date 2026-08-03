const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    sparse: true,
    unique: true,
  },
  uid: {
    type: String,
    sparse: true,
    unique: true,
  },
  admissionYear: { type: String, default: '' },
  graduationYear: { type: String, default: '' },
  branch: { type: String, default: '' },
  division: { type: String, default: '' },
  rollNo: { type: String, default: '' },
  currentYear: { type: String, default: '' },
  currentSem: { type: Number, default: null },
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
  avatarUrl: {
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
  pendingAchievements: [{
    title: String,
    description: String,
    imageUrl: String,
    date: String
  }],
  lastScrapedAt: {
    type: Date,
    default: null,
  },
  lastLinkedInScrapeAt: {
    type: Date,
    default: null,
  },
  resumeUrl: {
    type: String,
    default: '',
  },
  resumeDetails: {
    portfolioUrl: { type: String, default: '' },
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
    }],
    certificates: [{
      title: String,
      issuer: String,
      issueDate: String,
      credentialUrl: String,
      fileUrl: String,
      isComplete: { type: Boolean, default: false }
    }],
    achievements: [{
      title: String,
      description: String,
      imageUrl: String,
      date: String
    }]
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);