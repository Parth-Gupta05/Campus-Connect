const mongoose = require('mongoose');

const LeetcodeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  profile: {
    totalSolved: { type: Number, default: 0 },
    totalSubmissions: [{
      difficulty: { type: String },
      count: { type: Number },
      submissions: { type: Number }
    }],
    totalQuestions: { type: Number, default: 0 },
    easySolved: { type: Number, default: 0 },
    totalEasy: { type: Number, default: 0 },
    mediumSolved: { type: Number, default: 0 },
    totalMedium: { type: Number, default: 0 },
    hardSolved: { type: Number, default: 0 },
    totalHard: { type: Number, default: 0 },
    ranking: { type: Number, default: 0 },
    contributionPoint: { type: Number, default: 0 },
    reputation: { type: Number, default: 0 },
    submissionCalendar: { type: mongoose.Schema.Types.Mixed, default: {} },
    recentSubmissions: [{
      title: { type: String },
      titleSlug: { type: String },
      timestamp: { type: String },
      statusDisplay: { type: String },
      lang: { type: String }
    }]
  },
  calendar: {
    activeYears: [{ type: Number }],
    streak: { type: Number, default: 0 },
    totalActiveDays: { type: Number, default: 0 },
    submissionCalendar: { type: String, default: '' }
  },
  skills: {
    fundamental: [{
      tagName: { type: String },
      tagSlug: { type: String },
      problemsSolved: { type: Number }
    }],
    intermediate: [{
      tagName: { type: String },
      tagSlug: { type: String },
      problemsSolved: { type: Number }
    }],
    advanced: [{
      tagName: { type: String },
      tagSlug: { type: String },
      problemsSolved: { type: Number }
    }]
  },
  languages: {
    languageProblemCount: [{
      languageName: { type: String },
      problemsSolved: { type: Number }
    }]
  }
}, { timestamps: true });

module.exports = mongoose.model('Leetcode', LeetcodeSchema);
