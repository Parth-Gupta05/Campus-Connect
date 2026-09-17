const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const { authMiddleware, clubMiddleware } = require('../middleware/authMiddleware');
const crypto = require('crypto');
const { sendEventRegistrationEmail } = require('../utils/emailService');
const { createNotification } = require('../utils/notificationService');

const Club = require('../models/Club');
const { calculateAictePoints, resolveMemberTier } = require('../utils/aicteCalculator');
const multer = require('multer');
const { 
  extractDivision,
  sortAttendees, 
  splitAndMatchCertificates, 
  uploadCertificateToCloudinary, 
  uploadCertificatesInBatches 
} = require('../services/certificateSplitter');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max for multi-page batch PDF
});

// Create Event (Club only)
router.post('/', authMiddleware, clubMiddleware, async (req, res) => {
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
      activitySummary,
      registrationDeadline
    } = req.body;
    
    if (!title || !date || !time) {
      return res.status(400).json({ message: 'Title, date, and time are required' });
    }

    const eventStartDateTime = new Date(date);
    const [hours, minutes] = time.split(':');
    eventStartDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    let parsedDeadline = registrationDeadline ? new Date(registrationDeadline) : new Date(eventStartDateTime);
    if (parsedDeadline > eventStartDateTime) {
      return res.status(400).json({ message: 'Registration deadline cannot be after the event start time' });
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
      registrationDeadline: parsedDeadline,
      registeredStudents: coreRegistrations
    });

    await event.save();
    res.status(201).json({ message: 'Event created successfully', event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit Event (Club only)
router.put('/:eventId', authMiddleware, clubMiddleware, async (req, res) => {
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
      activitySummary,
      registrationDeadline
    } = req.body;
    
    if (!title || !date || !time) {
      return res.status(400).json({ message: 'Title, date, and time are required' });
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    if (event.clubId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized for this event' });
    }

    if (event.certificatesIssued) {
      // If certificates are issued, block core metadata edits to prevent mismatch
      if (
        new Date(date).toISOString() !== event.date.toISOString() ||
        time !== event.time ||
        title !== event.title ||
        Number(durationHours || 2) !== event.durationHours ||
        Number(aicteCategory || 5) !== event.aicteCategory
      ) {
        return res.status(400).json({ 
          message: 'Certificates have already been issued for this event. Core details (Title, Date, Time, Duration, Category) cannot be modified.' 
        });
      }
    }

    const eventStartDateTime = new Date(date);
    const [hours, minutes] = time.split(':');
    eventStartDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    let parsedDeadline = event.registrationDeadline;
    if (registrationDeadline) {
      parsedDeadline = new Date(registrationDeadline);
      if (parsedDeadline > eventStartDateTime) {
        return res.status(400).json({ message: 'Registration deadline cannot be after the event starts' });
      }
    } else {
      parsedDeadline = eventStartDateTime;
    }

    // Reset status to upcoming if pushed to the future and currently completed/ongoing
    if (eventStartDateTime > new Date() && event.status !== 'upcoming') {
      event.status = 'upcoming';
    }

    // Check if AICTE recalculation is needed
    const newDuration = Number(durationHours) || 2;
    const newCategory = Number(aicteCategory) || 5;
    const needsAicteRecalc = (
      event.registeredStudents.length > 0 &&
      (newDuration !== event.durationHours || newCategory !== event.aicteCategory)
    );

    // Update fields
    event.title = title;
    event.description = description;
    event.posterImage = posterImage;
    event.contactPerson = contactPerson;
    event.date = date;
    event.time = time;
    event.venue = venue;
    event.durationHours = newDuration;
    event.aicteCategory = newCategory;
    event.activitySummary = activitySummary || '';
    event.registrationDeadline = parsedDeadline;

    if (needsAicteRecalc) {
      event.registeredStudents.forEach(student => {
        if (student.attendanceStatus === 'present') {
          // Recalculate based on new duration/tier
          const pointCalc = calculateAictePoints(event.durationHours, student.tier || 'Member');
          student.aicteHours = pointCalc.recordedHours;
          student.aictePoints = pointCalc.points;
        }
      });
    }

    await event.save();
    res.json({ message: 'Event updated successfully', event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get club's own events (Club only)
router.get('/club', authMiddleware, clubMiddleware, async (req, res) => {
  try {
    const events = await Event.find({ clubId: req.user.id }).sort({ date: -1 });
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
    if (req.query.status) {
      if (req.query.status === 'all') {
        delete query.status;
      } else {
        query.status = req.query.status;
      }
    }
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
      await event.populate('registeredStudents.studentId', 'name uid email avatarUrl branch division rollNo currentSem');
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

    if (event.status === 'completed') {
      return res.status(400).json({ message: 'Cannot register for completed events' });
    }

    const now = new Date();
    let deadline = event.registrationDeadline;
    
    // Fallback for older events that don't have a registrationDeadline set
    if (!deadline) {
      deadline = new Date(event.date);
      const [h, m] = event.time.split(':');
      deadline.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
    }

    if (now > new Date(deadline)) {
      return res.status(400).json({ message: 'Registration for this event has closed' });
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

    // Resolve student tier and points
    const club = await Club.findById(req.user.id);
    const assignment = club?.assignedStudents?.find(
      m => m.studentId && m.studentId.toString() === studentRecord.studentId?._id?.toString()
    );

    const tier = assignment ? resolveMemberTier(club.name, assignment.role, assignment.tier) : 'Member';
    const pointCalc = calculateAictePoints(event.durationHours || 2, tier);

    res.json({ 
      student: studentRecord.studentId, 
      attendanceStatus: studentRecord.attendanceStatus,
      tier,
      designation: assignment?.role || 'Attendee',
      pointsAwarded: pointCalc.points,
      multiplier: pointCalc.multiplier
    });
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

    const studentId = event.registeredStudents[studentIndex].studentId;
    const club = await Club.findById(req.user.id);
    const assignment = club?.assignedStudents?.find(
      m => m.studentId && m.studentId.toString() === studentId.toString()
    );

    const tier = assignment ? resolveMemberTier(club.name, assignment.role, assignment.tier) : 'Member';
    const pointCalc = calculateAictePoints(event.durationHours || 2, tier);

    event.registeredStudents[studentIndex].attendanceStatus = 'present';
    event.registeredStudents[studentIndex].tier = tier;
    event.registeredStudents[studentIndex].designation = assignment?.role || 'Attendee';
    event.registeredStudents[studentIndex].aicteHours = pointCalc.recordedHours;
    event.registeredStudents[studentIndex].aictePoints = pointCalc.points;

    await event.save();

    res.json({ 
      message: 'Attendance marked successfully',
      tier,
      designation: assignment?.role || 'Attendee',
      pointsAwarded: pointCalc.points
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Club Route: Toggle / manually update student attendance
router.post('/:eventId/manual-attendance', authMiddleware, clubMiddleware, async (req, res) => {
  try {
    const { studentId, status } = req.body;
    if (!studentId || !status) return res.status(400).json({ message: 'studentId and status required' });

    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.clubId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized for this event' });
    }

    const club = await Club.findById(req.user.id);
    const assignment = club?.assignedStudents?.find(
      m => m.studentId && m.studentId.toString() === studentId.toString()
    );

    const tier = assignment ? resolveMemberTier(club.name, assignment.role, assignment.tier) : 'Member';
    const pointCalc = calculateAictePoints(event.durationHours || 2, tier);

    let idx = event.registeredStudents.findIndex(
      s => s.studentId && s.studentId.toString() === studentId.toString()
    );

    if (idx === -1) {
      event.registeredStudents.push({
        studentId,
        attendanceStatus: status,
        tier,
        designation: assignment?.role || 'Attendee',
        aicteHours: status === 'present' ? pointCalc.recordedHours : 0,
        aictePoints: status === 'present' ? pointCalc.points : 0
      });
    } else {
      event.registeredStudents[idx].attendanceStatus = status;
      event.registeredStudents[idx].tier = tier;
      event.registeredStudents[idx].designation = assignment?.role || event.registeredStudents[idx].designation || 'Attendee';
      event.registeredStudents[idx].aicteHours = status === 'present' ? pointCalc.recordedHours : 0;
      event.registeredStudents[idx].aictePoints = status === 'present' ? pointCalc.points : 0;
    }

    await event.save();
    res.json({ message: `Attendance updated to ${status}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Club Route: Download formatted roster CSV for Canva Bulk Create / Mail Merge
router.get('/:eventId/certificates/roster-csv', authMiddleware, clubMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).populate('registeredStudents.studentId', 'name uid email branch division rollNo currentSem');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.clubId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized for this event' });
    }

    const club = await Club.findById(req.user.id);
    const audience = req.query.audience || 'present'; // 'present' or 'all'

    let targetAttendees = event.registeredStudents;
    if (audience === 'present') {
      targetAttendees = targetAttendees.filter(s => s.attendanceStatus === 'present');
    }

    const sorted = sortAttendees(targetAttendees);

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const headers = [
      'Page Number (in PDF)',
      'Student Name',
      'University UID',
      'Branch',
      'Division',
      'Semester',
      'Role / Designation',
      'Tier',
      'Email',
      'Event Title',
      'Event Date',
      'Issuing Organization'
    ];

    const eventDateStr = event.date ? new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
    const clubName = club?.name || 'CampusConnect Club';

    const rows = sorted.map((record, index) => [
      index + 1,
      record.studentId?.name || 'Attendee',
      record.studentId?.uid || '',
      record.studentId?.branch || '',
      record.studentId?.division || extractDivision(record.studentId) || '',
      record.studentId?.currentSem || '',
      record.designation || 'Member',
      record.tier || 'Member',
      record.studentId?.email || '',
      event.title,
      eventDateStr,
      clubName
    ]);

    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...rows.map(row => row.map(escapeCsv).join(','))
    ].join('\r\n');

    const sanitizedTitle = (event.title || 'event').replace(/[^a-z0-9]/gi, '_');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}_Certificate_Order_Sheet.csv"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error generating roster CSV:', error);
    res.status(500).json({ message: 'Failed to generate roster CSV' });
  }
});

// Club Route: Slices multi-page PDF and distributes certificates directly to student portfolios
router.post('/:eventId/certificates/upload-batch', authMiddleware, clubMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'A multi-page PDF document is required.' });
    }

    const event = await Event.findById(req.params.eventId).populate('registeredStudents.studentId', 'name uid email branch division rollNo currentSem');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.clubId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized for this event' });
    }

    const club = await Club.findById(req.user.id);
    const audience = req.body.audience || 'present'; // 'present' or 'all'

    let targetAttendees = event.registeredStudents.filter(s => s.studentId && s.studentId._id);
    if (audience === 'present') {
      targetAttendees = targetAttendees.filter(s => s.attendanceStatus === 'present');
    }

    if (targetAttendees.length === 0) {
      return res.status(400).json({
        message: audience === 'present' 
          ? 'No students are marked present for this event. Mark attendance first or choose All Registered.'
          : 'No registered students found for this event.'
      });
    }

    // Process PDF slicing and matching
    const result = await splitAndMatchCertificates(req.file.buffer, targetAttendees);
    const { totalPages, matchedCount, pages, isFlattened } = result;

    if (totalPages !== targetAttendees.length) {
      return res.status(400).json({
        message: `PDF page count mismatch: The uploaded PDF has ${totalPages} page(s), but there are ${targetAttendees.length} recipients in the selected list (${audience === 'present' ? 'Present only' : 'All registered'}). Exactly 1 page per recipient is required with no extra or missing pages.`,
        totalPages,
        attendeeCount: targetAttendees.length
      });
    }

    // Filter pages that have a matched student
    const matchedPages = pages.filter(p => p.matchedStudent && p.matchedStudent.studentId);
    if (matchedPages.length === 0) {
      return res.status(400).json({ message: 'Could not match any pages to registered students.' });
    }

    // Prepare batch upload items
    const uploadItems = matchedPages.map((p, idx) => ({
      buffer: p.buffer,
      publicId: `cert_${event._id}_${p.matchedStudent.studentId._id}_${Date.now()}_${idx}`
    }));

    // Batch upload to Cloudinary with concurrency throttling (5 at a time)
    const uploadedUrls = await uploadCertificatesInBatches(uploadItems, 5);

    const issueDateStr = event.date ? new Date(event.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    // Assign URLs to Event and User records
    for (let i = 0; i < matchedPages.length; i++) {
      const pageInfo = matchedPages[i];
      const certUrl = uploadedUrls[i];
      const studentId = pageInfo.matchedStudent.studentId._id;

      // 1. Update event record
      const regIndex = event.registeredStudents.findIndex(
        r => r.studentId && r.studentId._id.toString() === studentId.toString()
      );
      if (regIndex !== -1) {
        event.registeredStudents[regIndex].certificateUrl = certUrl;
        event.registeredStudents[regIndex].certificateIssuedAt = new Date();
        event.registeredStudents[regIndex].certificateVerified = true;
      }

      // 2. Update student User document
      const user = await User.findById(studentId);
      if (user) {
        if (!user.resumeDetails) user.resumeDetails = {};
        if (!user.resumeDetails.certificates) user.resumeDetails.certificates = [];

        const existingCertIndex = user.resumeDetails.certificates.findIndex(
          c => c.eventId && c.eventId.toString() === event._id.toString()
        );

        const certData = {
          title: `${event.title} - Certificate of Participation`,
          issuer: club?.name || 'CampusConnect Club',
          issueDate: issueDateStr,
          credentialUrl: `/events?eventId=${event._id}`,
          fileUrl: certUrl,
          isComplete: true,
          isVerified: true,
          issuedByClub: true,
          clubId: club?._id || event.clubId,
          eventId: event._id,
          issuedAt: new Date()
        };

        if (existingCertIndex !== -1) {
          user.resumeDetails.certificates[existingCertIndex] = {
            ...user.resumeDetails.certificates[existingCertIndex].toObject?.() || user.resumeDetails.certificates[existingCertIndex],
            ...certData
          };
        } else {
          user.resumeDetails.certificates.push(certData);
        }

        user.markModified('resumeDetails');
        await user.save();

        // 3. Dispatch real-time in-app notification to student
        try {
          await createNotification({
            recipient: studentId,
            recipientModel: 'User',
            type: 'event_certificate',
            title: '✨ Official Certificate Awarded!',
            message: `You have received an official verified certificate from ${club?.name || 'the club'} for "${event.title}". It has been added to your verified portfolio!`,
            link: '/certificates',
            sender: club?._id || event.clubId,
            senderModel: 'Club'
          });
        } catch (notifErr) {
          console.warn('Failed to send notification to student:', notifErr.message);
        }
      }
    }

    event.certificatesIssued = true;
    event.certificatesIssuedAt = new Date();
    await event.save();

    res.json({
      message: `Successfully sliced and distributed ${matchedPages.length} certificates!`,
      totalPages,
      matchedCount: matchedPages.length,
      isFlattened,
      event
    });
  } catch (error) {
    console.error('Error during certificate batch distribution:', error);
    res.status(500).json({ message: error.message || 'Failed to split and issue certificates.' });
  }
});

// Club Route: Single certificate manual upload / override for an attendee
router.post('/:eventId/certificates/single/:studentId', authMiddleware, clubMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'Certificate PDF document is required.' });
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.clubId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized for this event' });
    }

    const club = await Club.findById(req.user.id);
    const studentId = req.params.studentId;

    const regIndex = event.registeredStudents.findIndex(
      r => r.studentId && r.studentId.toString() === studentId.toString()
    );
    if (regIndex === -1) {
      return res.status(404).json({ message: 'Student is not registered for this event.' });
    }

    // Upload to Cloudinary
    const publicId = `cert_${event._id}_${studentId}_${Date.now()}`;
    const certUrl = await uploadCertificateToCloudinary(req.file.buffer, publicId);

    // Update Event record
    event.registeredStudents[regIndex].certificateUrl = certUrl;
    event.registeredStudents[regIndex].certificateIssuedAt = new Date();
    event.registeredStudents[regIndex].certificateVerified = true;
    await event.save();

    // Update Student User record
    const user = await User.findById(studentId);
    if (user) {
      if (!user.resumeDetails) user.resumeDetails = {};
      if (!user.resumeDetails.certificates) user.resumeDetails.certificates = [];

      const issueDateStr = event.date ? new Date(event.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

      const existingCertIndex = user.resumeDetails.certificates.findIndex(
        c => c.eventId && c.eventId.toString() === event._id.toString()
      );

      const certData = {
        title: `${event.title} - Certificate of Participation`,
        issuer: club?.name || 'CampusConnect Club',
        issueDate: issueDateStr,
        credentialUrl: `/events?eventId=${event._id}`,
        fileUrl: certUrl,
        isComplete: true,
        isVerified: true,
        issuedByClub: true,
        clubId: club?._id || event.clubId,
        eventId: event._id,
        issuedAt: new Date()
      };

      if (existingCertIndex !== -1) {
        user.resumeDetails.certificates[existingCertIndex] = {
          ...user.resumeDetails.certificates[existingCertIndex].toObject?.() || user.resumeDetails.certificates[existingCertIndex],
          ...certData
        };
      } else {
        user.resumeDetails.certificates.push(certData);
      }

      user.markModified('resumeDetails');
      await user.save();

      try {
        await createNotification({
          recipient: studentId,
          recipientModel: 'User',
          type: 'event_certificate',
          title: '✨ Official Certificate Awarded!',
          message: `Your certificate for "${event.title}" has been issued/updated by ${club?.name || 'the club'}!`,
          link: '/certificates',
          sender: club?._id || event.clubId,
          senderModel: 'Club'
        });
      } catch (notifErr) {
        console.warn('Failed to send notification:', notifErr.message);
      }
    }

    res.json({
      message: 'Certificate uploaded and assigned successfully!',
      certificateUrl: certUrl,
      event
    });
  } catch (error) {
    console.error('Error uploading single certificate:', error);
    res.status(500).json({ message: error.message || 'Failed to upload certificate.' });
  }
});

module.exports = router;
