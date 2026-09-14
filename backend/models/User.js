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
  cgpa: { type: String, default: '' },
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
  verificationCode: {
    type: String,
    default: '',
  },
  githubVerified: {
    type: Boolean,
    default: false,
  },
  leetcodeVerified: {
    type: Boolean,
    default: false,
  },
  linkedInUrl: {
    type: String,
    default: '',
  },
  isProfileComplete: {
    type: Boolean,
    default: false,
  },
  lastHandleUpdateAt: {
    type: Date,
    default: null,
  },
  resetOtp: {
    type: String,
    default: null,
  },
  resetOtpExpiry: {
    type: Date,
    default: null,
  },
  resetOtpLastSent: {
    type: Date,
    default: null,
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
  resumes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  }],
  resumeDetails: {
    portfolioUrl: { type: String, default: '' },
    skills: [{ type: String }],
    education: [mongoose.Schema.Types.Mixed],
    experience: [mongoose.Schema.Types.Mixed],
    projects: [mongoose.Schema.Types.Mixed],
    certificates: [{
      title: { type: String, default: '' },
      issuer: { type: String, default: '' },
      issueDate: { type: String, default: '' },
      credentialUrl: { type: String, default: '' },
      fileUrl: { type: String, default: '' },
      isComplete: { type: Boolean, default: false },
      isVerified: { type: Boolean, default: false },
      issuedByClub: { type: Boolean, default: false },
      clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
      eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
      issuedAt: { type: Date, default: Date.now }
    }],
    achievements: [mongoose.Schema.Types.Mixed]
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);