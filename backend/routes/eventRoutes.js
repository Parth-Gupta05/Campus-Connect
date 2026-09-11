const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const { authMiddleware, clubMiddleware } = require('../middleware/authMiddleware');
const crypto = require('crypto');
const { sendEventRegistrationEmail } = require('../utils/emailService');
const { createNotification } = require('../utils/notificationService');

// Create Event (Club only)
router.post('/', authMiddleware, clubMiddleware, async (req, res) => {
  try {
    const { title, description, posterImage, contactPerson, date, time, venue } = req.body;
    
    if (!title || !date || !time) {
      return res.status(400).json({ message: 'Title, date, and time are required' });
    }

    const event = new Event({
      clubId: req.user.id,
      title,
      description,
      posterImage,
      contactPerson,
      date,
      time,
      venue
    });

    await event.save();
    res.status(201).json({ message: 'Event created successfully', event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get club's own events (Club only)
router.get('/club', authMiddleware, clubMiddleware, async (req, res) => {
  try {
    const events = await Event.find({ clubId: req.user.id }).sort({ date: 1 });
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public: Get all upcoming events
router.get('/public', authMiddleware, async (req, res) => {
  try {
    const query = { status: 'upcoming' };
    if (req.query.clubId) {
      query.clubId = req.query.clubId;
    }
    const events = await Event.find(query)
      .populate('clubId', 'name profilePhoto')
      .sort({ date: 1 });
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Student: Get registered events
router.get('/student/registered', authMiddleware, async (req, res) => {
  try {
    const events = await Event.find({
      'registeredStudents.studentId': req.user.id
    })
      .populate('clubId', 'name profilePhoto')
      .sort({ date: 1 });
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public: Get event details
router.get('/:eventId', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('clubId', 'name profilePhoto description');
    
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    // Check if current user is registered
    const isRegistered = event.registeredStudents.some(
      student => student.studentId.toString() === req.user.id
    );

    // If club is viewing its own event, populate students
    if (req.user.role === 'club' && event.clubId._id.toString() === req.user.id) {
      await event.populate('registeredStudents.studentId', 'name uid email branch currentSem');
    }

    res.json({ event, isRegistered });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Student Route: Register for event
router.post('/:eventId/register', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can register for events' });
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.status !== 'upcoming') {
      return res.status(400).json({ message: 'Can only register for upcoming events' });
    }

    const alreadyRegistered = event.registeredStudents.some(
      student => student.studentId.toString() === req.user.id
    );

    if (alreadyRegistered) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // Generate unique QR code token
    const qrToken = crypto.randomUUID();
    
    event.registeredStudents.push({
      studentId: req.user.id,
      attendanceStatus: 'pending',
      qrCode: qrToken
    });

    await event.save();

    const student = await User.findById(req.user.id);
    if (student && student.email) {
      await sendEventRegistrationEmail(student.email, student.name, event.title, qrToken);
    }

    // Notify the club
    if (student) {
      await createNotification({
        recipient: event.clubId,
        recipientModel: 'Club',
        type: 'event_registration',
        title: 'New Event Registration',
        message: `${student.name} registered for ${event.title}`,
        link: `/club`, // Club dashboard
        sender: student._id,
        senderModel: 'User'
      });
    }

    console.log(`[Event Registration] Generated QR Code and sent email for student ${req.user.id}: ${qrToken}`);

    res.json({ message: 'Successfully registered for event', qrCode: qrToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Club Route: Scan QR code and fetch student details (without marking present)
router.post('/:eventId/scan-qr', authMiddleware, clubMiddleware, async (req, res) => {
  try {
    const { qrCode } = req.body;
    if (!qrCode) return res.status(400).json({ message: 'QR Code is required' });

    const event = await Event.findById(req.params.eventId).populate('registeredStudents.studentId', 'name uid avatarUrl branch currentSem');
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.clubId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized for this event' });
    }

    const studentRecord = event.registeredStudents.find(s => s.qrCode === qrCode);
    if (!studentRecord) {
      return res.status(404).json({ message: 'Invalid QR code for this event' });
    }

    res.json({ student: studentRecord.studentId, attendanceStatus: studentRecord.attendanceStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Club Route: Verify QR code and mark present
router.post('/:eventId/verify-qr', authMiddleware, clubMiddleware, async (req, res) => {
  try {
    const { qrCode } = req.body;
    if (!qrCode) return res.status(400).json({ message: 'QR Code is required' });

    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.clubId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized for this event' });
    }

    const studentIndex = event.registeredStudents.findIndex(s => s.qrCode === qrCode);
    if (studentIndex === -1) {
      return res.status(404).json({ message: 'Invalid QR code for this event' });
    }

    if (event.registeredStudents[studentIndex].attendanceStatus === 'present') {
      return res.status(400).json({ message: 'Student is already marked present' });
    }

    event.registeredStudents[studentIndex].attendanceStatus = 'present';
    await event.save();

    res.json({ message: 'Attendance marked successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
