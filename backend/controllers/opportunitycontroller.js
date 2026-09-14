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

    let appliedOppIds = [];
    let userApplications = {};
    if (req.user && req.user.id) {
      const applications = await Applicant.find({ userId: req.user.id }, 'opportunityId matchScore matchScoreCalculated matchDetails');
      appliedOppIds = applications.map(app => app.opportunityId.toString());
      applications.forEach(app => {
        userApplications[app.opportunityId.toString()] = {
          matchScore: app.matchScore,
          matchScoreCalculated: app.matchScoreCalculated,
          matchDetails: app.matchDetails
        };
      });
    }

    res.status(200).json({
      success: true,
      count: opportunities.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      opportunities,
      appliedOppIds,
      userApplications,
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

    let resumeId = null;

    // If user selected an existing resume from the dropdown
    if (req.body.resumeId) {
      const Resume = require('../models/Resume');
      const existingResume = await Resume.findOne({ _id: req.body.resumeId, userId });
      if (!existingResume) {
        return res.status(404).json({ success: false, message: 'Selected resume not found or unauthorized' });
      }
      resumeId = existingResume._id;
    }
    // Upload new resume file to Cloudinary if provided in request
    else if (req.file) {
      try {
        const uploadStream = new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'applicant_resumes', resource_type: 'auto' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result.secure_url);
            }
          );
          stream.end(req.file.buffer);
        });
        const resumeUrl = await uploadStream;

        // Create new Resume document
        const Resume = require('../models/Resume');
        const newResume = new Resume({
          userId,
          fileUrl: resumeUrl,
          fileName: req.file.originalname || 'Resume',
          isPrimary: false
        });
        await newResume.save();
        
        // Add to user's resumes array
        const UserObj = await User.findById(userId);
        if (UserObj) {
          if (!UserObj.resumes) UserObj.resumes = [];
          UserObj.resumes.push(newResume._id);
          await UserObj.save();
        }

        resumeId = newResume._id;
      } catch (uploadErr) {
        console.error('Cloudinary resume upload error:', uploadErr);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload resume file',
        });
      }
    } else {
      // For backwards compatibility or if no resume is strictly required, though ideally we return 400
      // Let's check if the user has any resume
      const UserObj = await User.findById(userId);
      if (UserObj && UserObj.resumes && UserObj.resumes.length > 0) {
        resumeId = UserObj.resumes[0]; // Just use the first one
      } else {
        return res.status(400).json({ success: false, message: 'Please provide a resume to apply.' });
      }
    }

    // Create new application record
    const application = new Applicant({
      userId,
      opportunityId,
      resumeId,
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

/**
 * @desc    Check AI resume match & compatibility score for an opportunity
 * @route   POST /api/opportunities/:id/compatibility
 * @access  Private (Student)
 */
const checkOpportunityCompatibility = async (req, res) => {
  try {
    const opportunityId = req.params.id;
    const userId = req.user.id;
    const { resumeId } = req.body;

    let customResumeData = null;
    let selectedResumeId = resumeId;

    // If an external resume file was uploaded strictly for compatibility testing
    if (req.file) {
      try {
        let extractedSkills = [];
        try {
          const pdfParse = require('pdf-parse');
          const pdfData = await pdfParse(req.file.buffer);
          const text = pdfData.text || '';
          
          const opp = await Opportunity.findById(opportunityId);
          const reqSkills = opp?.requiredSkills || [];
          reqSkills.forEach(s => {
            const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escaped}\\b`, 'i');
            if (regex.test(text)) {
              extractedSkills.push(s);
            }
          });

          // Also scan for common technical keywords in the document
          const COMMON_TECH_SKILLS = [
            'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin',
            'React', 'React.js', 'Next.js', 'Vue', 'Angular', 'Node.js', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot',
            'HTML', 'CSS', 'Tailwind', 'TailwindCSS', 'Bootstrap', 'Sass', 'Redux',
            'MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Redis', 'Firebase', 'Supabase', 'GraphQL', 'REST API', 'RESTful API',
            'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Cloudinary', 'CI/CD', 'Git', 'GitHub', 'Linux',
            'Machine Learning', 'Deep Learning', 'NLP', 'Data Science', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy',
            'Cybersecurity', 'JWT', 'OAuth', 'Microservices', 'System Design', 'Agile', 'Scrum'
          ];
          COMMON_TECH_SKILLS.forEach(skill => {
            if (!extractedSkills.includes(skill)) {
              const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const regex = new RegExp(`\\b${escaped}\\b`, 'i');
              if (regex.test(text)) {
                extractedSkills.push(skill);
              }
            }
          });
        } catch (parseErr) {
          console.warn('PDF parse warning in check-compatibility:', parseErr.message);
        }

        // Strictly evaluated in-memory for testing; NEVER stored in Cloudinary or the user's resume vault
        selectedResumeId = null;
        customResumeData = {
          skills: extractedSkills,
          fileName: req.file.originalname || 'External Test Resume'
        };
      } catch (uploadErr) {
        console.error('Resume processing error:', uploadErr);
        return res.status(500).json({ success: false, message: 'Failed to process uploaded resume file' });
      }
    }

    const { calculateOpportunityCompatibility } = require('./algodimension');
    const result = await calculateOpportunityCompatibility(userId, opportunityId, selectedResumeId, customResumeData);

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error checking compatibility:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to evaluate opportunity compatibility',
      details: error.message
    });
  }
};

module.exports = {
  getOpportunities,
  getOpportunityById,
  applyForOpportunity,
  checkOpportunityCompatibility,
};
