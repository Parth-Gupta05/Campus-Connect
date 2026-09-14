const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    default: 'Resume'
  },
  fileSize: {
    type: Number,
    default: 0
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  resumeVector: {
    type: [Number],
    default: []
  },
  parsedData: {
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

module.exports = mongoose.model('Resume', ResumeSchema);
