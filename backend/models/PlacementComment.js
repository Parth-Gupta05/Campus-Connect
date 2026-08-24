const mongoose = require('mongoose');

const PlacementCommentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlacementPost',
    required: true,
    index: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000,
    trim: true
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlacementComment',
    default: null,
    index: true
  },
  depth: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  replyCount: {
    type: Number,
    default: 0
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['helpful', 'like', 'celebrate'],
      default: 'like'
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

PlacementCommentSchema.index({ post: 1, parentComment: 1, createdAt: 1 });
PlacementCommentSchema.index({ author: 1 });

module.exports = mongoose.model('PlacementComment', PlacementCommentSchema);
