const cloudinary = require('cloudinary').v2;
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdfParse = require('pdf-parse');
const User = require('../models/User');
const { deleteCloudinaryAsset } = require('../utils/cloudinaryHelper');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadAndParseResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No resume file provided' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'Gemini API Key missing on server' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Using gemini-3.1-flash-lite as it is highly responsive and avoids the 503 issues of 3.5-flash
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

    // Call the API directly without retries to eliminate long waiting times
    const result = await model.generateContent([prompt]);
    
    let responseText = result.response.text();
    
    // Clean up any potential markdown formatting the AI might inject
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    let parsedData = {};
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON', responseText);
      return res.status(500).json({ message: 'Failed to parse resume into structured format' });
    }

    // 3. Upload to Cloudinary
    let resumeUrl = '';
    try {
      const uploadStream = new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'resumes', resource_type: 'raw' },
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
      // We don't fail the parsing if upload fails, we just don't save the URL.
    }

    // 4. Save URL to User (we don't save the parsed data yet, the frontend form will do that on "Save")
    if (resumeUrl) {
      const user = await User.findById(req.user.id);
      if (user) {
        if (user.resumeUrl) {
          await deleteCloudinaryAsset(user.resumeUrl);
        }
        user.resumeUrl = resumeUrl;
        await user.save();
      }
    }

    res.json({ message: 'Resume parsed successfully', parsedData, resumeUrl });
  } catch (error) {
    console.error('Error processing resume:', error);
    res.status(500).json({ message: 'Server error processing resume' });
  }
};

module.exports = {
  uploadAndParseResume
};
