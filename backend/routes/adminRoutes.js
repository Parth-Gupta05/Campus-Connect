const express = require('express');
const router = express.Router();
const Opportunity = require('../models/Opportunities');
const Applicant = require('../models/Applicants');
const Club = require('../models/Club');
const Event = require('../models/Event');
const User = require('../models/User');
const crypto = require('crypto');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { resolveMemberTier } = require('../utils/aicteCalculator');
const { createNotification } = require('../utils/notificationService');
const multer = require('multer');
const { uploadAssessmentFile, getAssessmentUploads, getStudentEvaluations, getAssessmentById } = require('../controllers/evaluationController');

// Multer setup for temporary storage before Cloudinary
const upload = multer({ dest: 'uploads/' });

// Helper to hash password matching authRoutes.js
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// @route   POST /api/admin/opportunities
// @desc    Create a new opportunity
// @access  Admin
router.post('/opportunities', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, company, companyLogo, companyDomain, location, opportunityType, jobDescription, requiredSkills, experienceLevel, stipendOrSalary, applyLink, deadline, requirements } = req.body;

    const newOpportunity = new Opportunity({
      title,
      company,
      companyLogo: companyLogo || '',
      companyDomain: companyDomain || '',
      location,
      opportunityType,
      jobDescription,
      requiredSkills,
      experienceLevel,
      stipendOrSalary,
      applyLink,
      deadline,
      requirements: requirements || [],
      postedBy: req.user.id
    });

    await newOpportunity.save();
    res.status(201).json({ message: 'Opportunity created successfully', opportunity: newOpportunity });
  } catch (err) {
    console.error('Error creating opportunity:', err);
    res.status(500).json({ message: 'Server error creating opportunity' });
  }
});

// @route   GET /api/admin/opportunities
// @desc    Get all opportunities created
// @access  Admin
router.get('/opportunities', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const opportunities = await Opportunity.find().sort({ createdAt: -1 });
    res.json({ opportunities });
  } catch (err) {
    console.error('Error fetching opportunities:', err);
    res.status(500).json({ message: 'Server error fetching opportunities' });
  }
});

// @route   GET /api/admin/opportunities/:id/applicants
// @desc    Get all applicants for a specific opportunity
// @access  Admin
router.get('/opportunities/:id/applicants', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const opportunityId = req.params.id;

    const applicants = await Applicant.find({ opportunityId })
      .populate('userId', 'name email avatarUrl branch graduationYear rollNo uid currentSem division')
      .populate('resumeId', 'fileName fileUrl parsedData createdAt')
      .sort({ appliedAt: -1 });

    res.json({ applicants });
  } catch (err) {
    console.error('Error fetching applicants:', err);
    res.status(500).json({ message: 'Server error fetching applicants' });
  }
});

// @route   PATCH /api/admin/opportunities/:id/status
// @desc    Toggle opportunity active status
// @access  Admin
router.patch('/opportunities/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    opportunity.isActive = !opportunity.isActive;
    await opportunity.save();
    res.json({ message: `Opportunity marked as ${opportunity.isActive ? 'Active' : 'Closed'}`, opportunity });
  } catch (err) {
    console.error('Error updating opportunity status:', err);
    res.status(500).json({ message: 'Server error updating status' });
  }
});

// @route   DELETE /api/admin/opportunities/:id
// @desc    Delete an opportunity and its applicants
// @access  Admin
router.delete('/opportunities/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    await Promise.all([
      Opportunity.findByIdAndDelete(req.params.id),
      Applicant.deleteMany({ opportunityId: req.params.id })
    ]);
    res.json({ message: 'Opportunity and associated applicants removed successfully' });
  } catch (err) {
    console.error('Error deleting opportunity:', err);
    res.status(500).json({ message: 'Server error deleting opportunity' });
  }
});

// @route   GET /api/admin/students
// @desc    Get filtered or searched list of students
// @access  Admin
router.get('/students', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { passingYear, department, division, search } = req.query;

    if (search && search.trim()) {
      const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(safeSearch, 'i');
      const students = await User.find({
        role: 'student',
        $or: [
          { name: searchRegex },
          { uid: searchRegex },
          { email: searchRegex }
        ]
      })
      .select('name uid email avatarUrl branch currentSem')
      .limit(5);

      return res.json({ students });
    }

    if (!passingYear && !department && !division) {
      // If no filters specified, return recent active students
      const students = await User.find({ role: 'student' })
        .select('-password -__v')
        .sort({ createdAt: -1 })
        .limit(50);
      return res.json({ students });
    }

    // Prepare explicit query fields
    let explicitQuery = {};
    if (passingYear) explicitQuery.graduationYear = passingYear.length === 2 ? `20${passingYear}` : passingYear;
    if (department) explicitQuery.branch = new RegExp(`^${department}$`, 'i');
    if (division) explicitQuery.division = new RegExp(`^${division}$`, 'i');

    // Prepare UID fallback Regex
    // Example UID: 23-COMPA58-27
    const yr = passingYear ? passingYear.slice(-2) : '.*';
    const dept = department ? department : '.*';
    const div = division ? division : '.*';
    const uidRegexPattern = `^.*-${dept}${div}.*-${yr}$`;
    const uidRegex = new RegExp(uidRegexPattern, 'i');

    const finalQuery = {
      $and: [
        { role: 'student' },
        {
          $or: [
            explicitQuery,
            { uid: uidRegex }
          ]
        }
      ]
    };


    // If explicitQuery is empty, $or might behave weirdly. But we check above that at least one filter is provided.
    const students = await User.find(finalQuery)
      .select('-password -__v')
      .sort({ createdAt: -1 });

    res.json({ students });
  } catch (err) {
    console.error('Error fetching admin students:', err);
    res.status(500).json({ message: 'Server error fetching students' });
  }
});

// @route   GET /api/admin/students/:id
// @desc    Get comprehensive data for a single student
// @access  Admin
router.get('/students/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const identifier = req.params.id;
    const User = require('../models/User');
    const Github = require('../models/Github');
    const Leetcode = require('../models/Leetcode');
    const LindedIn = require('../models/LindedIn');
    const Resume = require('../models/Resume');
    const Club = require('../models/Club');
    const Event = require('../models/Event');
    const PlacementPost = require('../models/PlacementPost');

    const mongoose = require('mongoose');

    let user;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      user = await User.findById(req.params.id).select('-password');
    }
    if (!user) {
      user = await User.findOne({ uid: req.params.id.toUpperCase() }).select('-password');
    }

    if (!user) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const studentId = user._id;

    // Run all independent queries concurrently
    const [
      github,
      leetcode,
      linkedin,
      resumes,
      applications,
      clubs,
      events,
      placements
    ] = await Promise.all([
      Github.findOne({ user: studentId }),
      Leetcode.findOne({ user: studentId }),
      LindedIn.findOne({ user: studentId }),
      Resume.find({ userId: studentId }).sort({ createdAt: -1 }),
      Applicant.find({ userId: studentId })
        .populate('opportunityId', 'title company location opportunityType stipendOrSalary deadline status')
        .populate('resumeId', 'fileName fileUrl createdAt')
        .sort({ appliedAt: -1 }),
      Club.find({ "assignedStudents.studentId": studentId }).select('name profilePhoto assignedStudents'),
      Event.find({ "registeredStudents.studentId": studentId }).select('title date time venue status registeredStudents'),
      PlacementPost.find({ author: studentId }).sort({ createdAt: -1 }).select('title company role postType salary createdAt')
    ]);



    res.json({
      success: true,
      data: {
        user,
        github,
        leetcode,
        linkedin,
        resumes,
        applications,
        clubs,
        events,
        placements
      }
    });

  } catch (err) {
    console.error('Error fetching comprehensive student data:', err);
    res.status(500).json({ message: 'Server error fetching student data' });
  }
});

// =========================================================================
// ROOT ADMIN CLUB MANAGEMENT & PROVISIONING
// =========================================================================

// @route   GET /api/admin/clubs
// @desc    Get all clubs with stats (core members, total members, events)
// @access  Root Admin
router.get('/clubs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const clubs = await Club.find()
      .populate('assignedStudents.studentId', 'name uid email avatarUrl branch currentSem')
      .sort({ createdAt: -1 });

    const enrichedClubs = await Promise.all(
      clubs.map(async (club) => {
        const eventsCount = await Event.countDocuments({ clubId: club._id });
        const coreMembers = (club.assignedStudents || []).filter(m => {
          const tier = resolveMemberTier(club.name, m.role, m.tier);
          return tier === 'Core';
        });

        return {
          _id: club._id,
          name: club.name,
          email: club.email,
          description: club.description,
          category: club.category || 'Technical',
          profilePhoto: club.profilePhoto,
          bannerPhoto: club.bannerPhoto,
          socials: club.socials,
          hasMembershipSystem: club.hasMembershipSystem || false,
          wcRoles: club.wcRoles || [],
          totalMembersCount: (club.assignedStudents || []).length,
          coreMembersCount: coreMembers.length,
          eventsCount,
          coreMembers: coreMembers.map(m => ({
            student: m.studentId,
            role: m.role,
            tier: 'Core'
          })),
          createdAt: club.createdAt
        };
      })
    );

    res.json({ clubs: enrichedClubs });
  } catch (err) {
    console.error('Error fetching admin clubs:', err);
    res.status(500).json({ message: 'Server error fetching clubs' });
  }
});

// @route   POST /api/admin/clubs
// @desc    Create new club and assign initial Core Committee members
// @access  Root Admin
router.post('/clubs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      description, 
      category, 
      profilePhoto, 
      bannerPhoto,
      initialCoreMembers // Array of { studentId, role }
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Club name is required' });
    }

    // Auto-generate clean email if not explicitly provided
    const cleanSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const clubEmail = (email && email.trim()) 
      ? email.trim().toLowerCase() 
      : `${cleanSlug}@campusconnect.edu`;

    // Check if email already registered
    const existingUser = await User.findOne({ email: clubEmail });
    const existingClub = await Club.findOne({ email: clubEmail });
    if (existingUser || existingClub) {
      return res.status(400).json({ message: `Account with email ${clubEmail} already exists. Please specify a unique email.` });
    }

    // Auto-generate secure password if not provided
    const plainPassword = (password && password.trim()) 
      ? password.trim() 
      : `Club@${crypto.randomBytes(4).toString('hex').toUpperCase()}!`;

    const hashedPassword = hashPassword(plainPassword);

    // Format initial Core Committee members
    const assignedStudents = [];
    if (Array.isArray(initialCoreMembers)) {
      for (const core of initialCoreMembers) {
        if (core.studentId) {
          assignedStudents.push({
            studentId: core.studentId,
            role: core.role || 'Core Member',
            tier: 'Core' // Root admin explicitly designates Core tier
          });
        }
      }
    }

    const newClub = new Club({
      name: name.trim(),
      email: clubEmail,
      password: hashedPassword,
      role: 'club',
      description: description || '',
      category: category || 'Technical',
      profilePhoto: profilePhoto || '',
      bannerPhoto: bannerPhoto || '',
      assignedStudents
    });

    await newClub.save();

    // Notify all initial Core Committee appointees
    if (Array.isArray(initialCoreMembers) && initialCoreMembers.length > 0) {
      for (const core of initialCoreMembers) {
        if (core.studentId) {
          const appointedRole = core.role || 'Core Member';
          await createNotification({
            recipient: core.studentId,
            recipientModel: 'User',
            type: 'committee_assignment',
            title: `Appointed to Core Committee: ${newClub.name}`,
            message: `Congratulations! You have been appointed as "${appointedRole}" in ${newClub.name} by the Administration. As a Core Committee member, you are eligible for 2x AICTE activity points and automatic event attendance tracking.`,
            link: '/clubs',
            sender: newClub._id,
            senderModel: 'Club'
          });
        }
      }
    }

    const populatedClub = await Club.findById(newClub._id)
      .populate('assignedStudents.studentId', 'name uid email avatarUrl branch currentSem');

    res.status(201).json({
      message: 'Club provisioned successfully',
      club: populatedClub,
      credentials: {
        email: clubEmail,
        password: plainPassword
      }
    });

  } catch (err) {
    console.error('Error creating club:', err);
    res.status(500).json({ message: 'Server error creating club' });
  }
});

// @route   POST /api/admin/clubs/:clubId/core-members
// @desc    Assign or update Core Committee members for an existing club
// @access  Root Admin
router.post('/clubs/:clubId/core-members', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { studentId, role } = req.body;
    if (!studentId) return res.status(400).json({ message: 'studentId is required' });

    const club = await Club.findById(req.params.clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const existingIndex = club.assignedStudents.findIndex(
      m => m.studentId && m.studentId.toString() === studentId.toString()
    );

    if (existingIndex > -1) {
      club.assignedStudents[existingIndex].role = role || club.assignedStudents[existingIndex].role || 'Core Member';
      club.assignedStudents[existingIndex].tier = 'Core';
    } else {
      club.assignedStudents.push({
        studentId,
        role: role || 'Core Member',
        tier: 'Core'
      });
    }

    await club.save();

    // Notify the appointed Core Committee member
    const assignedRole = role || 'Core Member';
    await createNotification({
      recipient: studentId,
      recipientModel: 'User',
      type: 'committee_assignment',
      title: `Appointed to Core Committee: ${club.name}`,
      message: `Congratulations! You have been appointed as "${assignedRole}" in ${club.name} by the Administration. As a Core Committee member, you are eligible for 2x AICTE activity points and automatic event attendance tracking.`,
      link: '/clubs',
      sender: club._id,
      senderModel: 'Club'
    });

    const updatedClub = await Club.findById(club._id)
      .populate('assignedStudents.studentId', 'name uid email avatarUrl branch currentSem');

    res.json({
      message: 'Core Committee roster updated successfully',
      club: updatedClub
    });
  } catch (err) {
    console.error('Error updating core members:', err);
    res.status(500).json({ message: 'Server error updating core committee' });
  }
});

// @route   DELETE /api/admin/clubs/:clubId/core-members/:studentId
// @desc    Remove a student from club Core Committee roster
// @access  Root Admin
router.delete('/clubs/:clubId/core-members/:studentId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    club.assignedStudents = club.assignedStudents.filter(
      m => m.studentId && m.studentId.toString() !== req.params.studentId.toString()
    );

    await club.save();

    res.json({ message: 'Member removed from Core Committee successfully' });
  } catch (err) {
    console.error('Error removing core member:', err);
    res.status(500).json({ message: 'Server error removing core member' });
  }
});

// @route   PATCH /api/admin/clubs/:clubId/reset-password
// @desc    Reset club login password and return new credentials
// @access  Root Admin
router.patch('/clubs/:clubId/reset-password', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    const newPassword = req.body.password && req.body.password.trim()
      ? req.body.password.trim()
      : `Club@${crypto.randomBytes(4).toString('hex').toUpperCase()}!`;

    club.password = hashPassword(newPassword);
    await club.save();

    res.json({
      message: 'Club password reset successfully',
      credentials: {
        email: club.email,
        password: newPassword
      }
    });
  } catch (err) {
    console.error('Error resetting club password:', err);
    res.status(500).json({ message: 'Server error resetting club password' });
  }
});

// @route   PATCH /api/admin/clubs/:clubId/membership
// @desc    Toggle official membership system for a club
// @access  Root Admin
router.patch('/clubs/:clubId/membership', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    club.hasMembershipSystem = !club.hasMembershipSystem;
    await club.save();

    res.json({ message: `Membership system ${club.hasMembershipSystem ? 'enabled' : 'disabled'} for ${club.name}`, club });
  } catch (err) {
    console.error('Error toggling membership system:', err);
    res.status(500).json({ message: 'Server error toggling membership system' });
  }
});

// @route   PATCH /api/admin/clubs/:clubId/wcroles
// @desc    Update Working Committee roles for a club
// @access  Root Admin
router.patch('/clubs/:clubId/wcroles', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { wcRoles } = req.body;
    if (!Array.isArray(wcRoles)) {
      return res.status(400).json({ message: 'wcRoles must be an array of strings' });
    }

    const club = await Club.findById(req.params.clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    club.wcRoles = wcRoles;
    await club.save();

    res.json({ message: `Working Committee roles updated for ${club.name}`, club });
  } catch (err) {
    console.error('Error updating WC roles:', err);
    res.status(500).json({ message: 'Server error updating WC roles' });
  }
});

// @route   DELETE /api/admin/clubs/:clubId
// @desc    Remove a club
// @access  Root Admin
router.delete('/clubs/:clubId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    await Club.findByIdAndDelete(req.params.clubId);
    res.json({ message: `Club ${club.name} has been removed successfully.` });
  } catch (err) {
    console.error('Error deleting club:', err);
    res.status(500).json({ message: 'Server error deleting club' });
  }
});

// @route   POST /api/admin/evaluation/upload
// @desc    Upload an assessment excel file for background processing
// @access  Admin
router.post('/evaluation/upload', authMiddleware, adminMiddleware, upload.single('file'), uploadAssessmentFile);

// @route   GET /api/admin/evaluation/uploads
// @desc    Get all uploaded assessment files
// @access  Admin
router.get('/evaluation/uploads', authMiddleware, adminMiddleware, getAssessmentUploads);

// @route   GET /api/admin/evaluation/uploads/:id
// @desc    Get a single assessment with its raw results
// @access  Admin
router.get('/evaluation/uploads/:id', authMiddleware, adminMiddleware, getAssessmentById);

// @route   GET /api/admin/evaluation/students
// @desc    Get all students with their evaluated skill vectors and assessments
// @access  Admin
router.get('/evaluation/students', authMiddleware, adminMiddleware, getStudentEvaluations);

module.exports = router;
