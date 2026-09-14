const express = require('express');
const router = express.Router();
const multer = require('multer');

const {
  getOpportunities,
  getOpportunityById,
  applyForOpportunity,
  checkOpportunityCompatibility,
} = require('../controllers/opportunitycontroller');
const { authMiddleware } = require('../middleware/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

// Get all opportunities (with optional filters ?type=AEDP&location=Remote&search=developer&page=1)
router.get('/', authMiddleware, getOpportunities);

// Get single opportunity by ID
router.get('/:id', authMiddleware, getOpportunityById);

// Apply for an opportunity (with optional resume file upload)
router.post('/:id/apply', authMiddleware, upload.single('resume'), applyForOpportunity);

// Check AI match & compatibility for an opportunity
router.post('/:id/compatibility', authMiddleware, upload.single('resume'), checkOpportunityCompatibility);

module.exports = router;
