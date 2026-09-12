const express = require('express');
const router = express.Router();
const Opportunity = require('../models/Opportunities');
const Applicant = require('../models/Applicants');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// @route   POST /api/admin/opportunities
// @desc    Create a new opportunity
// @access  Admin
router.post('/opportunities', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, company, location, opportunityType, jobDescription, requiredSkills, experienceLevel, stipendOrSalary, applyLink, deadline } = req.body;

    const newOpportunity = new Opportunity({
      title,
      company,
      location,
      opportunityType,
      jobDescription,
      requiredSkills,
      experienceLevel,
      stipendOrSalary,
      applyLink,
      deadline,
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
      .populate('userId', 'name email avatarUrl branch graduationYear rollNo')
      .populate('resumeId', 'fileName fileUrl parsedData createdAt')
      .sort({ appliedAt: -1 });

    res.json({ applicants });
  } catch (err) {
    console.error('Error fetching applicants:', err);
    res.status(500).json({ message: 'Server error fetching applicants' });
  }
});

// @route   GET /api/admin/students
// @desc    Get filtered list of students
// @access  Admin
router.get('/students', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { passingYear, department, division } = req.query;

    if (!passingYear && !department && !division) {
      return res.status(400).json({ message: 'Please provide at least one filter criteria (Passing Year, Department, or Division).' });
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
    const User = require('../models/User');
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
    const studentId = req.params.id;
    const User = require('../models/User');
    const Github = require('../models/Github');
    const Leetcode = require('../models/Leetcode');
    const LindedIn = require('../models/LindedIn');
    const Resume = require('../models/Resume');
    const Club = require('../models/Club');
    const Event = require('../models/Event');
    const PlacementPost = require('../models/PlacementPost');

    // Run all independent queries concurrently
    const [
      user,
      github,
      leetcode,
      linkedin,
      resumes,
      applications,
      clubs,
      events,
      placements
    ] = await Promise.all([
      User.findById(studentId).select('-password'),
      Github.findOne({ user: studentId }),
      Leetcode.findOne({ user: studentId }),
      LindedIn.findOne({ user: studentId }),
      Resume.find({ userId: studentId }).sort({ createdAt: -1 }),
      Applicant.find({ userId: studentId }).populate('opportunityId', 'title company location opportunityType').sort({ appliedAt: -1 }),
      Club.find({ "assignedStudents.studentId": studentId }).select('name role profilePhoto'),
      Event.find({ "registeredStudents.studentId": studentId }).select('title date status'),
      PlacementPost.find({ author: studentId }).sort({ createdAt: -1 }).select('title company role postType createdAt')
    ]);

    if (!user) {
      return res.status(404).json({ message: 'Student not found' });
    }

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

module.exports = router;
