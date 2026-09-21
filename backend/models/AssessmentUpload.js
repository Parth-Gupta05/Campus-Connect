const mongoose = require('mongoose');

const AssessmentUploadSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  academicYear: { 
    type: String, 
    required: true 
  },
  fileUrl: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], 
    default: 'PENDING' 
  },
  processedCount: { 
    type: Number, 
    default: 0 
  },
  errors: [{ 
    row: Number, 
    reason: String 
  }],
  results: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uid: String,
    name: String,
    scores: {
      type: Map,
      of: Number
    }
  }],
  uploadedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { timestamps: true });

module.exports = mongoose.model('AssessmentUpload', AssessmentUploadSchema);
