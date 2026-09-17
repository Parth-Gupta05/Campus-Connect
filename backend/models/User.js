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
  universityEmail: {
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
  pendingLinkEmail: {
    type: String,
    default: null,
  },
  linkEmailOtp: {
    type: String,
    default: null,
  },
  linkEmailOtpExpiry: {
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
  },
  profileCustomization: {
    appearance: {
      preset: {
        type: String,
        enum: ['geist', 'editorial', 'research', 'cyber', 'paper', 'brutalist', 'organic', 'luxury'],
        default: 'geist'
      },
      accent: {
        type: String,
        enum: ['default', 'blue', 'violet', 'green', 'orange', 'rose', 'cyan'],
        default: 'default'
      },
      cardStyle: {
        type: String,
        enum: ['default', 'glass', 'paper', 'outlined'],
        default: 'default'
      },
      motion: {
        type: String,
        enum: ['none', 'subtle', 'interactive'],
        default: 'subtle'
      },
      texture: {
        type: String,
        enum: ['none', 'animated-grid', 'interactive-grid', 'hexagon', 'striped', 'light-rays', 'noise', 'glyph-matrix'],
        default: 'none'
      }
    },
    visibility: {
      showGithub: { type: Boolean, default: true },
      showLeetcode: { type: Boolean, default: true },
      showExperience: { type: Boolean, default: true },
      showEducation: { type: Boolean, default: true },
      showProjects: { type: Boolean, default: true },
      showCertificates: { type: Boolean, default: true }
    },
    metricsPrivacy: {
      githubHeatmap: { type: Boolean, default: true },
      githubTotalStars: { type: Boolean, default: true },
      leetcodeHeatmap: { type: Boolean, default: true },
      leetcodeRank: { type: Boolean, default: true },
      leetcodeAchievements: { type: Boolean, default: true },
      cgpa: { type: Boolean, default: false }
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);