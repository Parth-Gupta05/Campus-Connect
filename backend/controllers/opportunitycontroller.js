const Opportunity = require('../models/Opportunities');
const Applicant = require('../models/Applicants');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * @desc    Get all active opportunities with optional filtering, search & pagination
 * @route   GET /api/opportunities
 * @access  Private / Public
 */
const getOpportunities = async (req, res) => {
  try {
    const { type, location, search, page = 1, limit = 20 } = req.query;

    const query = { isActive: true };

    // Filter by opportunityType if provided (e.g., 'AEDP', 'PLI', 'REGULAR', 'internship', etc.)
    if (type) {
      query.opportunityType = type;
    }

    // Filter by location (case-insensitive substring)
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Search by title, company, or description if search query parameter exists
    if (search) {
      query.$text = { $search: search };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const opportunities = await Opportunity.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Opportunity.countDocuments(query);

    res.status(200).json({
      success: true,
      count: opportunities.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      opportunities,
    });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching opportunities',
    });
  }
};

/**
 * @desc    Get a single opportunity by ID
 * @route   GET /api/opportunities/:id
 * @access  Private / Public
 */
const getOpportunityById = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found',
      });
    }

    res.status(200).json({
      success: true,
      opportunity,
    });
  } catch (error) {
    console.error('Error fetching opportunity by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching opportunity details',
    });
  }
};

/**
 * @desc    Apply for an opportunity (with optional resume upload to Cloudinary)
 * @route   POST /api/opportunities/:id/apply
 * @access  Private (Student)
 */
const applyForOpportunity = async (req, res) => {
  try {
    const opportunityId = req.params.id;
    const userId = req.user.id;

    // Check if opportunity exists and is active
    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found',
      });
    }

    if (!opportunity.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This opportunity is no longer active',
      });
    }

    // Check if user has already applied
    const existingApplication = await Applicant.findOne({ userId, opportunityId });
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this opportunity',
      });
    }

    let resumeUrl = '';

    // Upload resume file to Cloudinary if provided in request
    if (req.file) {
      try {
        const uploadStream = new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'applicant_resumes', resource_type: 'raw' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result.secure_url);
            }
          );
          stream.end(req.file.buffer);
        });
        resumeUrl = await uploadStream;
      } catch (uploadErr) {
        console.error('Cloudinary resume upload error:', uploadErr);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload resume file',
        });
      }
    }

    const user = await User.findById(userId);
    let applicantVector = [];

    if (user) {
      if (!req.file && user.resumeUrl) {
        resumeUrl = user.resumeUrl;
      }
      if (user.scrapedData && user.scrapedData.vector) {
        applicantVector = Array.isArray(user.scrapedData.vector)
          ? user.scrapedData.vector
          : Object.values(user.scrapedData.vector);
      }
    }

    // Create new application record
    const application = new Applicant({
      userId,
      opportunityId,
      resumeUrl,
      applicantVector,
      status: 'applied',
      matchScoreCalculated: false,
    });

    await application.save();

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application,
    });
  } catch (error) {
    console.error('Error applying for opportunity:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting application',
    });
  }
};

module.exports = {
  getOpportunities,
  getOpportunityById,
  applyForOpportunity,
};
