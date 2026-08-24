const mongoose = require('mongoose');

const PlacementPostSchema = new mongoose.Schema({
  // === AUTHOR ===
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // === COMPANY INFO ===
  company: {
    name: { type: String, required: true, trim: true },
    domain: { type: String, default: '', trim: true },
    logoUrl: { type: String, default: '' },
    isCustom: { type: Boolean, default: false }
  },

  // === POST METRICS / CLASSIFICATION ===
  role: {
    type: String,
    required: true,
    trim: true
  },
  postType: {
    type: String,
    enum: [
      'interview_experience',
      'assessment_experience',
      'offer_received',
      'rejection_experience',
      'referral_share',
      'tips_and_advice'
    ],
    required: true,
    default: 'interview_experience'
  },

  // --- Compensation ---
  salary: {
    amount: { type: Number, default: null },
    currency: { type: String, default: 'INR' },
    period: {
      type: String,
      enum: ['annual', 'monthly', 'stipend_per_month'],
      default: 'annual'
    }
  },

  // --- Assessment Specifics ---
  assessmentType: {
    type: String,
    enum: [
      'online_test',
      'coding_round',
      'mcq',
      'aptitude',
      'case_study',
      'group_discussion',
      'hackathon',
      'take_home_assignment',
      'other'
    ],
    default: null
  },
  assessmentMode: {
    type: String,
    enum: ['online', 'offline', 'hybrid'],
    default: null
  },

  // --- Interview Specifics ---
  interviewType: {
    type: String,
    enum: [
      'technical',
      'hr',
      'behavioral',
      'system_design',
      'managerial',
      'culture_fit',
      'panel',
      'other'
    ],
    default: null
  },
  interviewMode: {
    type: String,
    enum: ['online', 'offline', 'hybrid'],
    default: null
  },
  numberOfRounds: {
    type: Number,
    default: null,
    min: 1,
    max: 20
  },

  // --- Additional Filters ---
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'very_hard'],
    default: null
  },
  outcome: {
    type: String,
    enum: ['selected', 'rejected', 'waitlisted', 'in_process'],
    default: null
  },
  branch: {
    type: String,
    default: '',
    trim: true
  },
  graduationYear: {
    type: String,
    default: '',
    trim: true
  },
  jobType: {
    type: String,
    enum: ['full_time', 'internship', 'part_time', 'contract', 'freelance'],
    default: 'full_time'
  },
  workMode: {
    type: String,
    enum: ['remote', 'onsite', 'hybrid'],
    default: null
  },
  location: {
    type: String,
    default: '',
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],

  // === RICH CONTENT ===
  title: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 50000
  },
  images: [{
    type: String
  }],
  attachmentUrl: {
    type: String,
    default: ''
  },
  attachmentName: {
    type: String,
    default: ''
  },
  links: [{
    type: String,
    trim: true
  }],

  // === ENGAGEMENT & REACTIONS ===
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['helpful', 'insightful', 'celebrate', 'like'],
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  commentCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },

  // === STATUS ===
  isPublished: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Search indexes for performant filtering
PlacementPostSchema.index({ 'company.name': 1 });
PlacementPostSchema.index({ postType: 1 });
PlacementPostSchema.index({ assessmentType: 1 });
PlacementPostSchema.index({ interviewType: 1 });
PlacementPostSchema.index({ outcome: 1 });
PlacementPostSchema.index({ branch: 1 });
PlacementPostSchema.index({ tags: 1 });
PlacementPostSchema.index({ createdAt: -1 });
PlacementPostSchema.index({ author: 1, createdAt: -1 });
PlacementPostSchema.index({ title: 'text', content: 'text', 'company.name': 'text', role: 'text', tags: 'text' });

module.exports = mongoose.model('PlacementPost', PlacementPostSchema);
