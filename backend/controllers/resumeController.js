const cloudinary = require('cloudinary').v2;
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdfParse = require('pdf-parse');
const User = require('../models/User');
const Resume = require('../models/Resume');
const { deleteCloudinaryAsset } = require('../utils/cloudinaryHelper');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const MAX_RESUMES_PER_USER = 5;
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

/**
 * @desc Get all resumes in student's vault
 * @route GET /api/user/resumes
 */
const getUserResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.id })
      .sort({ isPrimary: -1, createdAt: -1 });

    // Sync User.resumes array with active documents
    const user = await User.findById(req.user.id);
    if (user) {
      user.resumes = resumes.map(r => r._id);
      await user.save();
    }

    res.json({ success: true, resumes });
  } catch (error) {
    console.error('Error fetching user resumes:', error);
    res.status(500).json({ message: 'Server error fetching resumes' });
  }
};

/**
 * @desc Upload a new resume to student's vault (Max 5 resumes, Max 2MB)
 * @route POST /api/user/resumes
 */
const uploadResumeToVault = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No resume file provided' });
    }

    // 2MB Size limit check
    if (req.file.size > MAX_FILE_SIZE_BYTES) {
      return res.status(400).json({
        message: 'Resume file size cannot exceed 2MB. Please upload a smaller file.'
      });
    }

    // 5 Resumes Cap check
    const currentCount = await Resume.countDocuments({ userId: req.user.id });
    if (currentCount >= MAX_RESUMES_PER_USER) {
      return res.status(400).json({
        message: `Resume vault limit reached (maximum ${MAX_RESUMES_PER_USER} resumes per profile). Please delete an existing resume to upload a new one.`
      });
    }

    // Validate PDF format
    const isPdf = req.file.mimetype === 'application/pdf' || req.file.originalname?.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      return res.status(400).json({ message: 'Only PDF documents are supported' });
    }

    // Upload to Cloudinary
    let resumeUrl = '';
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
      resumeUrl = await uploadStream;
    } catch (uploadErr) {
      console.error('Cloudinary resume upload error:', uploadErr);
      return res.status(500).json({ message: 'Failed to store resume in Cloudinary' });
    }

    const isPrimaryReq = req.body.isPrimary === 'true' || req.body.isPrimary === true;
    const shouldBePrimary = currentCount === 0 || isPrimaryReq;

    if (shouldBePrimary) {
      await Resume.updateMany({ userId: req.user.id }, { isPrimary: false });
    }

    const displayName = req.body.fileName?.trim() || req.file.originalname || 'Resume.pdf';

    const newResume = new Resume({
      userId: req.user.id,
      fileUrl: resumeUrl,
      fileName: displayName,
      fileSize: req.file.size || 0,
      isPrimary: shouldBePrimary
    });
    await newResume.save();

    const user = await User.findById(req.user.id);
    if (user) {
      if (!user.resumes) user.resumes = [];
      user.resumes.push(newResume._id);
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: 'Resume added to vault successfully',
      resume: newResume
    });
  } catch (error) {
    console.error('Error uploading resume to vault:', error);
    res.status(500).json({ message: 'Server error uploading resume' });
  }
};

/**
 * @desc Delete a resume from student's vault
 * @route DELETE /api/user/resumes/:id
 */
const deleteResumeFromVault = async (req, res) => {
  try {
    const resumeId = req.params.id;
    const resume = await Resume.findOne({ _id: resumeId, userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found in your vault' });
    }

    const wasPrimary = resume.isPrimary;

    // Delete Cloudinary asset
    if (resume.fileUrl) {
      try {
        await deleteCloudinaryAsset(resume.fileUrl);
      } catch (err) {
        console.warn('Could not delete Cloudinary asset:', err.message);
      }
    }

    await Resume.findByIdAndDelete(resumeId);

    // Remove from User.resumes
    await User.findByIdAndUpdate(req.user.id, { $pull: { resumes: resumeId } });

    // If deleted resume was primary, promote newest remaining resume to primary
    if (wasPrimary) {
      const remaining = await Resume.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
      if (remaining) {
        remaining.isPrimary = true;
        await remaining.save();
      }
    }

    res.json({ success: true, message: 'Resume deleted from vault successfully' });
  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({ message: 'Server error deleting resume' });
  }
};

/**
 * @desc Set a resume as primary application document
 * @route PUT /api/user/resumes/:id/primary
 */
const setPrimaryResume = async (req, res) => {
  try {
    const resumeId = req.params.id;
    const resume = await Resume.findOne({ _id: resumeId, userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found in your vault' });
    }

    await Resume.updateMany({ userId: req.user.id }, { isPrimary: false });
    resume.isPrimary = true;
    await resume.save();

    res.json({ success: true, message: 'Primary resume updated successfully', resumeId });
  } catch (error) {
    console.error('Error updating primary resume:', error);
    res.status(500).json({ message: 'Server error updating primary resume' });
  }
};

/**
 * @desc Rename a resume in the vault
 * @route PUT /api/user/resumes/:id
 */
const renameResumeInVault = async (req, res) => {
  try {
    const resumeId = req.params.id;
    const { fileName } = req.body;
    if (!fileName || !fileName.trim()) {
      return res.status(400).json({ message: 'File name cannot be empty' });
    }

    const resume = await Resume.findOne({ _id: resumeId, userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found in your vault' });
    }

    resume.fileName = fileName.trim();
    await resume.save();

    res.json({ success: true, message: 'Resume name updated successfully', resume });
  } catch (error) {
    console.error('Error renaming resume:', error);
    res.status(500).json({ message: 'Server error renaming resume' });
  }
};

/**
 * @desc Upload and parse resume with Gemini AI (enforces 2MB & 5-resume cap)
 * @route POST /api/user/parse-resume
 */
const uploadAndParseResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No resume file provided' });
    }

    // 2MB Size limit check
    if (req.file.size > MAX_FILE_SIZE_BYTES) {
      return res.status(400).json({
        message: 'Resume file size cannot exceed 2MB. Please upload a smaller file.'
      });
    }

    // 5 Resumes Cap check
    const currentCount = await Resume.countDocuments({ userId: req.user.id });
    if (currentCount >= MAX_RESUMES_PER_USER) {
      return res.status(400).json({
        message: `Resume vault limit reached (maximum ${MAX_RESUMES_PER_USER} resumes per profile). Please delete an existing resume before uploading a new one.`
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'Gemini API Key missing on server' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
    
    // Extract text from the PDF buffer
    let resumeText = '';
    try {
      const pdfData = await pdfParse(req.file.buffer);
      resumeText = pdfData.text;
    } catch (err) {
      console.error('Failed to parse PDF text:', err);
      return res.status(500).json({ message: 'Failed to read PDF file' });
    }

    const prompt = `
    You are an expert resume parser. I have provided the text extracted from a resume.
    Extract the following information from the resume.
    Return ONLY a valid JSON object matching this schema exactly without markdown wrapping:
    {
      "skills": ["skill1", "skill2"],
      "education": [{"institution": "...", "degree": "...", "startYear": "...", "endYear": "..."}],
      "experience": [{"company": "...", "role": "...", "startDate": "...", "endDate": "...", "description": "..."}],
      "projects": [{"title": "...", "link": "...", "description": "..."}]
    }

    RESUME TEXT:
    ${resumeText}
    `;

    const result = await model.generateContent([prompt]);
    
    let responseText = result.response.text();
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    let parsedData = {};
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON', responseText);
      return res.status(500).json({ message: 'Failed to parse resume into structured format' });
    }

    // Upload to Cloudinary
    let resumeUrl = '';
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
      resumeUrl = await uploadStream;
    } catch (uploadErr) {
      console.error('Cloudinary upload error:', uploadErr);
    }

    // Save Resume document and link to User
    let newResume = null;
    if (resumeUrl) {
      const isFirst = currentCount === 0;
      if (isFirst) {
        await Resume.updateMany({ userId: req.user.id }, { isPrimary: false });
      }

      newResume = new Resume({
        userId: req.user.id,
        fileUrl: resumeUrl,
        fileName: req.file.originalname || 'Resume',
        fileSize: req.file.size || 0,
        parsedData: parsedData,
        isPrimary: isFirst
      });
      await newResume.save();

      const user = await User.findById(req.user.id);
      if (user) {
        if (!user.resumes) user.resumes = [];
        user.resumes.push(newResume._id);
        await user.save();
      }
    }

    res.json({ message: 'Resume parsed successfully', parsedData, resumeUrl, resumeId: newResume ? newResume._id : null });
  } catch (error) {
    console.error('Error processing resume:', error);
    res.status(500).json({ message: 'Server error processing resume' });
  }
};

module.exports = {
  getUserResumes,
  uploadResumeToVault,
  deleteResumeFromVault,
  setPrimaryResume,
  renameResumeInVault,
  uploadAndParseResume
};
