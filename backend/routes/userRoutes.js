const express = require('express');
const multer = require('multer');
const { authMiddleware } = require('../middleware/authMiddleware');
const { 
  getProfile, 
  getPublicProfile,
  updateProfile, 
  refreshMetrics, 
  updatePortfolio, 
  uploadAvatar, 
  uploadCertFile, 
  uploadVaultDocument,
  getResumePdf, 
  approveAchievement, 
  discardAchievement, 
  addManualAchievement, 
  getGithubHeatmap, 
  verifyPlatform, 
  generateVerificationCode,
  searchUsers,
  updateProfileCustomization
} = require('../controllers/userController');
const { 
  uploadAndParseResume,
  getUserResumes,
  uploadResumeToVault,
  deleteResumeFromVault,
  setPrimaryResume,
  renameResumeInVault
} = require('../controllers/resumeController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const uploadResumeWithLimit = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }
});

const uploadResumeMiddleware = (req, res, next) => {
  uploadResumeWithLimit.single('resume')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Resume file size cannot exceed 2MB. Please upload a smaller file.' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message || 'Error processing file upload' });
    }
    next();
  });
};

// Public Route (No Auth Required)
router.get('/public/:uid', getPublicProfile);
router.get('/portfolio/resume/pdf', getResumePdf);

// Apply auth middleware to all other routes in this file
router.use(authMiddleware);

router.get('/profile', getProfile);
router.patch('/profile/customization', updateProfileCustomization);
router.get('/search', searchUsers);
router.get('/github-heatmap', getGithubHeatmap);
router.put('/profile', updateProfile);
router.post('/refresh-metrics', refreshMetrics);
router.put('/portfolio', updatePortfolio);
router.post('/parse-resume', uploadResumeMiddleware, uploadAndParseResume);
router.post('/upload-avatar', upload.single('avatar'), uploadAvatar);
router.post('/upload-cert-file', upload.single('file'), uploadCertFile);
router.post('/academic-vault/document', upload.single('file'), uploadVaultDocument);
router.post('/achievements/approve', approveAchievement);
router.post('/achievements/discard', discardAchievement);
router.post('/achievements/manual', addManualAchievement);
router.post('/verify-platform', verifyPlatform);
router.post('/generate-verification-code', generateVerificationCode);

// Resume Vault Routes
router.get('/resumes', getUserResumes);
router.post('/resumes', uploadResumeMiddleware, uploadResumeToVault);
router.delete('/resumes/:id', deleteResumeFromVault);
router.put('/resumes/:id/primary', setPrimaryResume);
router.put('/resumes/:id', renameResumeInVault);

module.exports = router;
