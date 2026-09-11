const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authMiddleware } = require('../middleware/authMiddleware');

// Get all notifications for the logged-in user/club
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Determine model based on role (student -> User, club -> Club)
    const recipientModel = req.user.role === 'student' ? 'User' : 'Club';
    
    // Pagination could be added here if needed
    const notifications = await Notification.find({ 
      recipient: req.user.id,
      recipientModel: recipientModel
    })
    .sort({ createdAt: -1 })
    .limit(50); // Fetch top 50 for now

    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
});

// Get unread count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const recipientModel = req.user.role === 'student' ? 'User' : 'Club';
    const count = await Notification.countDocuments({ 
      recipient: req.user.id,
      recipientModel: recipientModel,
      isRead: false
    });
    res.json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching unread count' });
  }
});

// Mark single notification as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error marking notification as read' });
  }
});

// Mark all as read
router.put('/mark-all-read', authMiddleware, async (req, res) => {
  try {
    const recipientModel = req.user.role === 'student' ? 'User' : 'Club';
    await Notification.updateMany(
      { recipient: req.user.id, recipientModel: recipientModel, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
