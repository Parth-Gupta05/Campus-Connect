const mongoose = require('mongoose');

const ClubSchema = new mongoose.Schema({
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
    default: 'club'
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  profilePhoto: {
    type: String,
    default: '',
  },
  bannerPhoto: {
    type: String,
    default: '',
  },
  socials: {
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' },
    linkedin: { type: String, default: '' }
  },
  assignedStudents: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      default: 'Member'
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Club', ClubSchema);
