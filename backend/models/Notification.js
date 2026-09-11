const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    refPath: 'recipientModel', 
    required: true 
  },
  recipientModel: { 
    type: String, 
    required: true, 
    enum: ['User', 'Club'] 
  },
  type: { 
    type: String, 
    enum: ['event_registration', 'announcement', 'system', 'profile_update', 'club_invite', 'placement_comment', 'placement_reply', 'placement_reaction'],
    required: true
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  link: { 
    type: String // Optional: URL path to navigate to when clicked
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    refPath: 'senderModel' 
  },
  senderModel: { 
    type: String, 
    enum: ['User', 'Club'] 
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
