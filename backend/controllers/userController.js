const User = require('../models/User');
const { getgithubdata, getleetcodedata, getLinkedInData } = require('./algodimension');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

const scrapeAndCacheMetrics = async (user) => {
  let githubData = null;
  let leetcodeData = null;

  if (user.githubUsername) {
    try {
      githubData = await getgithubdata(user.githubUsername);
    } catch (err) {
      console.warn('Failed to fetch github data:', err.message);
    }
  }

  if (user.leetcodeUsername) {
    try {
      leetcodeData = await getleetcodedata(user.leetcodeUsername);
    } catch (err) {
      console.warn('Failed to fetch leetcode data:', err.message);
    }
  }

  let linkedinData = user.scrapedData?.linkedin || null;
  if (user.linkedInUrl) {
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    const timeSinceLastLinkedInScrape = user.lastLinkedInScrapeAt 
      ? Date.now() - new Date(user.lastLinkedInScrapeAt).getTime()
      : Infinity;
      
    if (timeSinceLastLinkedInScrape > TWENTY_FOUR_HOURS_MS) {
      try {
        linkedinData = await getLinkedInData(user.linkedInUrl);
        user.lastLinkedInScrapeAt = new Date();
      } catch (err) {
        console.warn('Failed to fetch linkedin data:', err.message);
      }
    }
  }

  user.scrapedData = { github: githubData, leetcode: leetcodeData, linkedin: linkedinData };
  
  // Merge LinkedIn certificates into resumeDetails.certificates
  if (linkedinData && linkedinData.certifications) {
    if (!user.resumeDetails) user.resumeDetails = {};
    if (!user.resumeDetails.certificates) user.resumeDetails.certificates = [];
    
    linkedinData.certifications.forEach(cert => {
      // Check if it already exists by title
      const exists = user.resumeDetails.certificates.find(c => c.title === cert.title);
      if (!exists) {
        user.resumeDetails.certificates.push({
          title: cert.title,
          issuer: cert.issuedBy,
          issueDate: cert.issuedAt,
          credentialUrl: cert.link,
          fileUrl: '',
          isComplete: false
        });
      }
    });
  }

  user.lastScrapedAt = new Date();
  await user.save();
  return user;
};

const updateProfile = async (req, res) => {
  try {
    const { name, githubUsername, leetcodeUsername, linkedInUrl } = req.body;
    
    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name || user.name;
    user.githubUsername = githubUsername || user.githubUsername;
    user.leetcodeUsername = leetcodeUsername || user.leetcodeUsername;
    user.linkedInUrl = linkedInUrl || user.linkedInUrl;
    user.isProfileComplete = true;

    // Immediately trigger a scrape on initial setup
    user = await scrapeAndCacheMetrics(user);

    // Return the updated user without the password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({ message: 'Profile updated successfully', user: userResponse });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

const refreshMetrics = async (req, res) => {
  try {
    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check timeout: 30 minutes
    const THIRTY_MINUTES_MS = 30 * 60 * 1000;
    if (user.lastScrapedAt) {
      const timeSinceLastScrape = Date.now() - new Date(user.lastScrapedAt).getTime();
      if (timeSinceLastScrape < THIRTY_MINUTES_MS) {
        const remainingMinutes = Math.ceil((THIRTY_MINUTES_MS - timeSinceLastScrape) / 60000);
        return res.status(429).json({ 
          message: `Please wait ${remainingMinutes} minutes before refreshing again.`
        });
      }
    }

    user = await scrapeAndCacheMetrics(user);
    
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ message: 'Metrics refreshed successfully', user: userResponse });
  } catch (error) {
    console.error('Error refreshing metrics:', error);
    res.status(500).json({ message: 'Server error refreshing metrics' });
  }
};

const updatePortfolio = async (req, res) => {
  try {
    const { skills, education, experience, projects, certificates, portfolioUrl } = req.body;
    
    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.resumeDetails = {
      portfolioUrl: portfolioUrl !== undefined ? portfolioUrl : (user.resumeDetails && user.resumeDetails.portfolioUrl) || '',
      skills: skills || (user.resumeDetails && user.resumeDetails.skills) || [],
      education: education || (user.resumeDetails && user.resumeDetails.education) || [],
      experience: experience || (user.resumeDetails && user.resumeDetails.experience) || [],
      projects: projects || (user.resumeDetails && user.resumeDetails.projects) || [],
      certificates: certificates || (user.resumeDetails && user.resumeDetails.certificates) || []
    };

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({ message: 'Portfolio updated successfully', user: userResponse });
  } catch (error) {
    console.error('Error updating portfolio:', error);
    res.status(500).json({ message: 'Server error updating portfolio' });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const uploadStream = new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'image', folder: 'avatars' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      stream.end(req.file.buffer);
    });
    
    const avatarUrl = await uploadStream;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.avatarUrl = avatarUrl;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ message: 'Avatar uploaded successfully', user: userResponse, avatarUrl });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ message: 'Server error uploading avatar' });
  }
};

const uploadCertFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const uploadStream = new Promise((resolve, reject) => {
      // Use resource_type 'image' to allow PDF to image conversion (thumbnails)
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'image', folder: 'certificates' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      stream.end(req.file.buffer);
    });
    
    const fileUrl = await uploadStream;

    res.json({ message: 'File uploaded successfully', fileUrl });
  } catch (error) {
    console.error('Error uploading cert file:', error);
    res.status(500).json({ message: 'Server error uploading file', details: error.message || error });
  }
};

const getResumePdf = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.resumeUrl) {
      return res.status(404).send('No resume found');
    }

    const response = await fetch(user.resumeUrl);
    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch resume from storage');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="resume.pdf"');

    // Stream the response directly to the client
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer);
  } catch (error) {
    console.error('Error proxying resume PDF:', error);
    res.status(500).send('Server error');
  }
};

module.exports = {
  getProfile,
  updateProfile,
  refreshMetrics,
  updatePortfolio,
  uploadAvatar,
  uploadCertFile,
  getResumePdf
};
