const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const User = require('../models/User');
const Announcement = require('../models/Announcement');
const Event = require('../models/Event');
const crypto = require('crypto');
const { calculateAictePoints, resolveMemberTier } = require('../utils/aicteCalculator');
const { authMiddleware, clubMiddleware } = require('../middleware/authMiddleware');
const { deleteCloudinaryAsset } = require('../utils/cloudinaryHelper');
const { broadcastNotification, createNotification } = require('../utils/notificationService');

// Get Club Profile (For the logged-in club)
router.get('/profile', authMiddleware, clubMiddleware, async (req, res) => {
  try {
    const club = await Club.findById(req.user.id).populate('assignedStudents.studentId', 'name uid email avatarUrl branch currentSem');
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
    const { uid, role, tier } = req.body;
    if (!uid) return res.status(400).json({ message: 'UID is required' });

    const student = await User.findOne({ uid: uid.toUpperCase() });
    if (!student) return res.status(404).json({ message: 'Student with this UID not found' });

    const club = await Club.findById(req.user.id);
    
    // Check if student already assigned
    if (club.assignedStudents.some(member => member.studentId.toString() === student._id.toString())) {
      return res.status(400).json({ message: 'Student is already a member of this club' });
    }

    const { resolveMemberTier } = require('../utils/aicteCalculator');
    const resolvedTier = resolveMemberTier(club.name, role, tier);

    club.assignedStudents.push({ 
      studentId: student._id, 
      role: role || 'Member',
      tier: resolvedTier
    });
    await club.save();

    // Notify the assigned student
    const isElevated = resolvedTier === 'Core' || resolvedTier === 'Working Committee';
    const appointedRole = role || 'Member';
    const notificationTitle = isElevated 
      ? `Appointed to ${resolvedTier}: ${club.name}` 
      : `Joined ${club.name}`;
    const notificationMessage = isElevated 
      ? `Congratulations! You have been appointed as "${appointedRole}" (${resolvedTier}) in ${club.name}. You are eligible for 2x AICTE activity points and automatic event attendance tracking.` 
      : `You have been added as "${appointedRole}" in ${club.name}. Welcome to the team!`;

    await createNotification({
      recipient: student._id,
      recipientModel: 'User',
      type: 'committee_assignment',
      title: notificationTitle,
      message: notificationMessage,
      link: '/clubs',
      sender: club._id,
      senderModel: 'Club'
    });
    
    const updatedClub = await Club.findById(req.user.id).populate('assignedStudents.studentId', 'name uid email avatarUrl branch currentSem');
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
    const clubs = await Club.find()
      .select('name description profilePhoto bannerPhoto assignedStudents socials createdAt')
      .sort({ name: 1 });
    res.json(clubs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Club Route: Create event directly via /clubs/events
router.post('/events', authMiddleware, clubMiddleware, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      posterImage, 
      contactPerson, 
      date, 
      time, 
      venue,
      durationHours,
      aicteCategory,
      activitySummary
    } = req.body;
    
    if (!title || !date || !time) {
      return res.status(400).json({ message: 'Title, date, and time are required' });
    }

    const duration = Math.max(0.5, Number(durationHours) || 2);
    const category = Math.min(15, Math.max(1, Number(aicteCategory) || 5));

    // Find club to auto-credit Core members (no QR required)
    const club = await Club.findById(req.user.id);
    const coreRegistrations = [];

    if (club && Array.isArray(club.assignedStudents)) {
      const coreCalc = calculateAictePoints(duration, 'Core');
      club.assignedStudents.forEach(m => {
        if (m.studentId) {
          const tier = resolveMemberTier(club.name, m.role, m.tier);
          if (tier === 'Core') {
            coreRegistrations.push({
              studentId: m.studentId,
              attendanceStatus: 'present',
              designation: m.role || 'Core Member',
              tier: 'Core',
              aicteHours: coreCalc.recordedHours,
              aictePoints: coreCalc.points,
              qrCode: `AUTO_CORE_${crypto.randomUUID()}`
            });
          }
        }
      });
    }

    const event = new Event({
      clubId: req.user.id,
      title,
      description,
      posterImage,
      contactPerson,
      date,
      time,
      venue,
      durationHours: duration,
      aicteCategory: category,
      activitySummary: activitySummary || '',
      registeredStudents: coreRegistrations
    });

    await event.save();
    res.status(201).json({ message: 'Event created successfully', event });
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
    const club = await Club.findById(req.params.clubId).populate(
      'assignedStudents.studentId',
      'name role avatarUrl uid branch currentSem'
    );
    if (!club) return res.status(404).json({ message: 'Club not found' });
    res.json(club);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
