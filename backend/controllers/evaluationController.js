const AssessmentUpload = require('../models/AssessmentUpload');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const { processPendingUploads } = require('../cron/assessmentProcessor');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadAssessmentFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const { title, academicYear } = req.body;
        if (!title || !academicYear) {
            return res.status(400).json({ success: false, message: 'Title and academicYear are required' });
        }

        // Upload to Cloudinary as raw file
        const result = await cloudinary.uploader.upload(req.file.path, {
            resource_type: 'raw',
            folder: 'evaluations',
            public_id: `${Date.now()}_${req.file.originalname}`
        });

        // Delete local temp file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        const uploadDoc = new AssessmentUpload({
            title,
            academicYear,
            fileUrl: result.secure_url,
            status: 'PENDING',
            uploadedBy: req.user?._id || null
        });

        await uploadDoc.save();

        res.status(201).json({
            success: true,
            message: 'Assessment file uploaded and queued for processing',
            upload: uploadDoc
        });

        // Trigger processing immediately in the background
        processPendingUploads().catch(err => console.error('Background processing error:', err));
        
    } catch (error) {
        console.error('Error uploading assessment:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const getAssessmentUploads = async (req, res) => {
    try {
        const uploads = await AssessmentUpload.find().sort({ createdAt: -1 }).populate('uploadedBy', 'name email');
        res.status(200).json({ success: true, uploads });
    } catch (error) {
        console.error('Error fetching uploads:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const { calculatePlatformBaseline, mergeWithVerifiedBoost } = require('../utils/vectorEngine');

const getStudentEvaluations = async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).select('name email uid branch skillVector academicVector scrapedData assessments');
        
        // Lazy-evaluate skill vectors for students who haven't been migrated yet
        const processedStudents = students.map(student => {
            if (!student.skillVector || student.skillVector.length !== 9) {
                const platformBaseline = calculatePlatformBaseline(student.scrapedData);
                const academicVector = student.academicVector && student.academicVector.length === 9 ? student.academicVector : Array(9).fill(-1);
                student.skillVector = mergeWithVerifiedBoost(academicVector, platformBaseline);
                
                // Fire and forget: save the generated vector back to DB
                student.academicVector = academicVector;
                student.save().catch(err => console.error('Lazy save failed:', err.message));
            }
            return student;
        });

        res.status(200).json({ success: true, students: processedStudents });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const getAssessmentById = async (req, res) => {
    try {
        const assessment = await AssessmentUpload.findById(req.params.id)
            .populate('uploadedBy', 'name email')
            .populate('results.user', 'name uid branch email');
        
        if (!assessment) {
            return res.status(404).json({ success: false, message: 'Assessment not found' });
        }
        
        res.status(200).json({ success: true, assessment });
    } catch (error) {
        console.error('Error fetching assessment:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

module.exports = {
    uploadAssessmentFile,
    getAssessmentUploads,
    getStudentEvaluations,
    getAssessmentById
};
