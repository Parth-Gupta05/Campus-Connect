const express = require('express');
const multer = require('multer');
const { authMiddleware } = require('../middleware/authMiddleware');
const { getProfile, updateProfile, refreshMetrics, updatePortfolio, uploadAvatar, uploadCertFile, getResumePdf, approveAchievement, discardAchievement, addManualAchievement } = require('../controllers/userController');
const { uploadAndParseResume } = require('../controllers/resumeController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Apply auth middleware to all routes in this file
router.use(authMiddleware);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/refresh-metrics', refreshMetrics);
router.put('/portfolio', updatePortfolio);
router.post('/parse-resume', upload.single('resume'), uploadAndParseResume);
router.post('/upload-avatar', upload.single('avatar'), uploadAvatar);
router.post('/upload-cert-file', upload.single('file'), uploadCertFile);
router.get('/portfolio/resume/pdf', getResumePdf);
router.post('/achievements/approve', approveAchievement);
router.post('/achievements/discard', discardAchievement);
router.post('/achievements/manual', addManualAchievement);
module.exports = router;
