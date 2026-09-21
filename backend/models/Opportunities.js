const mongoose = require('mongoose');

const OpportunitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    companyLogo: {
      type: String,
      default: '',
      trim: true,
    },
    companyDomain: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      default: 'Remote',
      trim: true,
    },
    opportunityType: {
      type: String,
      enum: ['AEDP', 'PLI', 'REGULAR', 'full-time', 'internship', 'part-time', 'contract', 'hackathon', 'project'],
      default: 'REGULAR',
    },
    jobDescription: {
      type: String,
      required: true,
    },
    // Vector embedding representation of the job description (to be populated by message queue workers)
    jobVector: {
      type: [Number],
      default: [],
    },
    // Flag to track vector embedding status by background workers
    vectorProcessed: {
      type: Boolean,
      default: false,
      index: true,
    },
    // The strictness/specialization level of the job domain
    jobDomainSpecificity: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    experienceLevel: {
      type: String,
      enum: ['Entry Level', 'Intermediate', 'Senior', 'All Levels'],
      default: 'Entry Level',
    },
    stipendOrSalary: {
      type: String,
      default: '',
    },
    applyLink: {
      type: String,
      default: '',
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    deadline: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    requirements: [{
      criterion: { 
        type: String, 
        required: true 
      },
      operator: { 
        type: String, 
        required: true,
        enum: ['gte', 'lte', 'eq', 'gt', 'lt', 'in']
      },
      value: { 
        type: mongoose.Schema.Types.Mixed, 
        required: true 
      }
    }],
  },
  {
    timestamps: true,
  }
);

// Index for text search on title, company, and description
OpportunitySchema.index({ title: 'text', company: 'text', jobDescription: 'text' });

module.exports = mongoose.model('Opportunity', OpportunitySchema);
