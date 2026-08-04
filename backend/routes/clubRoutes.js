const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const User = require('../models/User');
const Announcement = require('../models/Announcement');
const { authMiddleware, clubMiddleware } = require('../middleware/authMiddleware');
const { deleteCloudinaryAsset } = require('../utils/cloudinaryHelper');
const { broadcastNotification } = require('../utils/notificationService');

// Get Club Profile (For the logged-in club)
router.get('/profile', authMiddleware, clubMiddleware, async (req, res) => {
  try {
    const club = await Club.findById(req.user.id).populate('assignedStudents.studentId', 'name uid branch currentSem');
    if (!club) return res.status(404).json({ message: 'Club not found' });
    res.json(club);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Club Profile
router.put('/profile', authMiddleware, clubMiddleware, async (req, res) => {
  try {
    const { name, description, profilePhoto, bannerPhoto, socials } = req.body;
    const club = await Club.findById(req.user.id);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    if (name) club.name = name;
    if (description !== undefined) club.description = description;
    if (profilePhoto !== undefined && profilePhoto !== club.profilePhoto) {
      if (club.profilePhoto) await deleteCloudinaryAsset(club.profilePhoto);
      club.profilePhoto = profilePhoto;
    }
    if (bannerPhoto !== undefined && bannerPhoto !== club.bannerPhoto) {
      if (club.bannerPhoto) await deleteCloudinaryAsset(club.bannerPhoto);
      club.bannerPhoto = bannerPhoto;
    }
    
    if (socials) {
      if (!club.socials) club.socials = {};
      if (socials.instagram !== undefined) club.socials.instagram = socials.instagram;
      if (socials.facebook !== undefined) club.socials.facebook = socials.facebook;
      if (socials.linkedin !== undefined) club.socials.linkedin = socials.linkedin;
    }

    await club.save();
    res.json({ message: 'Profile updated successfully', club });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search students by UID
router.get('/search-students', authMiddleware, clubMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json([]);
    }
    
    // Case-insensitive regex match starting with the query string
    const users = await User.find({ 
      role: 'student',
      uid: { $regex: new RegExp('^' + q, 'i') } 
    })
      .select('name uid avatarUrl')
      .limit(5);

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add member by UID
router.post('/members', authMiddleware, clubMiddleware, async (req, res) => {
  try {
    const { uid, role } = req.body;
    if (!uid) return res.status(400).json({ message: 'UID is required' });

    const student = await User.findOne({ uid: uid.toUpperCase() });
    if (!student) return res.status(404).json({ message: 'Student with this UID not found' });

    const club = await Club.findById(req.user.id);
    
    // Check if student already assigned
    if (club.assignedStudents.some(member => member.studentId.toString() === student._id.toString())) {
      return res.status(400).json({ message: 'Student is already a member of this club' });
    }

    club.assignedStudents.push({ studentId: student._id, role: role || 'Member' });
    await club.save();
    
    const updatedClub = await Club.findById(req.user.id).populate('assignedStudents.studentId', 'name uid branch currentSem');
    res.json({ message: 'Member added successfully', assignedStudents: updatedClub.assignedStudents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove member
router.delete('/members/:studentId', authMiddleware, clubMiddleware, async (req, res) => {
  try {
    const club = await Club.findById(req.user.id);
    club.assignedStudents = club.assignedStudents.filter(member => member.studentId.toString() !== req.params.studentId);
    await club.save();
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public Route: Get all clubs
router.get('/', authMiddleware, async (req, res) => {
  try {
    const clubs = await Club.find().select('name description profilePhoto bannerPhoto');
    res.json(clubs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Public Route: Get all announcements
router.get('/announcements/public', authMiddleware, async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ datePublished: -1 }).populate('clubId', 'name profilePhoto');
    res.json(announcements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Club Route: Create announcement
router.post('/announcements', authMiddleware, clubMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'Title and content are required' });

    const announcement = new Announcement({
      clubId: req.user.id,
      title,
      content
    });

    await announcement.save();

    // Broadcast to all students
    const club = await Club.findById(req.user.id);
    const students = await User.find({ role: 'student' }).select('_id');
    const studentIds = students.map(s => s._id);

    await broadcastNotification(studentIds, 'User', {
      type: 'announcement',
      title: `New Announcement from ${club?.name || 'a club'}`,
      message: title,
      link: '/events', // Send them to the feed
      sender: req.user.id,
      senderModel: 'Club'
    });

    res.status(201).json({ message: 'Announcement created successfully', announcement });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Club Route: Get club's own announcements
router.get('/announcements', authMiddleware, clubMiddleware, async (req, res) => {
  try {
    const announcements = await Announcement.find({ clubId: req.user.id }).sort({ datePublished: -1 });
    res.json(announcements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public Route: Get club by ID
router.get('/:clubId', authMiddleware, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId).populate('assignedStudents.studentId', 'name role');
    if (!club) return res.status(404).json({ message: 'Club not found' });
    res.json(club);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
