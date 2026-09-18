const User = require('../models/User');
const { getgithubdata, getleetcodedata, getLinkedInData, getLinkedInPosts, filterAchievementsWithGemini, getGithubContributions } = require('./algodimension');
const { deleteCloudinaryAsset } = require('../utils/cloudinaryHelper');
const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('resumes');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.verificationCode) {
      user.verificationCode = `cc-verify-${crypto.randomBytes(4).toString('hex')}`;
      await user.save();
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

const getPublicProfile = async (req, res) => {
  try {
    const { uid } = req.params;
    
    // Support parsing like 23_COMPA10_27 or 23-COMPA10-27
    const normalizedUid = uid.replace(/_/g, '-').toUpperCase();
    
    const user = await User.findOne({ uid: normalizedUid })
      .select('-password -resetOtp -verificationCode -pendingAchievements')
      .populate('resumes')
      .lean();
      
    if (!user) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Enforce privacy settings server-side
    const visibility = user.profileCustomization?.visibility || {
      showGithub: true, showLeetcode: true, showExperience: true,
      showEducation: true, showProjects: true, showCertificates: true
    };
    const metricsPrivacy = user.profileCustomization?.metricsPrivacy || {
      githubHeatmap: true, githubTotalStars: true, leetcodeHeatmap: true,
      leetcodeRank: true, cgpa: false
    };

    if (!metricsPrivacy.cgpa) {
      delete user.cgpa;
    }

    // If Github section is completely hidden
    if (!visibility.showGithub) {
      delete user.githubUsername;
      delete user.githubVerified;
      if (user.scrapedData) delete user.scrapedData.github;
    } else {
      if (!metricsPrivacy.githubHeatmap && user.scrapedData?.github) {
        delete user.scrapedData.github.heatmapData;
      }
      if (!metricsPrivacy.githubTotalStars && user.scrapedData?.github) {
        delete user.scrapedData.github.stars;
      }
    }

    // If Leetcode section is hidden
    if (!visibility.showLeetcode) {
      delete user.leetcodeUsername;
      delete user.leetcodeVerified;
      if (user.scrapedData) delete user.scrapedData.leetcode;
    } else {
      if (metricsPrivacy.leetcodeHeatmap === false && user.scrapedData?.leetcode) {
        delete user.scrapedData.leetcode.heatmapData;
      }
      if (metricsPrivacy.leetcodeRank === false && user.scrapedData?.leetcode) {
        delete user.scrapedData.leetcode.ranking;
      }
      if (metricsPrivacy.leetcodeAchievements === false && user.scrapedData?.leetcode) {
        delete user.scrapedData.leetcode.profile;
        delete user.scrapedData.leetcode.badges;
        delete user.scrapedData.leetcode.contest;
      }
    }

    // If LinkedIn is not verified, completely hide it from the public profile
    if (!user.linkedInVerified) {
      delete user.linkedInUrl;
      if (user.scrapedData) delete user.scrapedData.linkedin;
    }

    // Resume details hiding
    if (user.resumeDetails) {
      if (!visibility.showExperience) delete user.resumeDetails.experience;
      if (!visibility.showEducation) delete user.resumeDetails.education;
      if (!visibility.showProjects) delete user.resumeDetails.projects;
      if (!visibility.showCertificates) {
        delete user.resumeDetails.certificates;
      } else if (user.resumeDetails.certificates) {
        user.resumeDetails.certificates = user.resumeDetails.certificates.filter(c => !c.isHidden);
      }
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching public profile:', error);
    res.status(500).json({ message: 'Server error fetching public profile' });
  }
};

const updateProfileCustomization = async (req, res) => {
  try {
    const { appearance, visibility, metricsPrivacy } = req.body;
    
    // Explicit allowlist logic using $set to prevent accidental overwrites
    const updatePayload = { $set: {} };
    
    // Appearance
    if (appearance) {
      if (appearance.preset !== undefined) updatePayload.$set['profileCustomization.appearance.preset'] = appearance.preset;
      if (appearance.accent !== undefined) updatePayload.$set['profileCustomization.appearance.accent'] = appearance.accent;
      if (appearance.cardStyle !== undefined) updatePayload.$set['profileCustomization.appearance.cardStyle'] = appearance.cardStyle;
      if (appearance.motion !== undefined) updatePayload.$set['profileCustomization.appearance.motion'] = appearance.motion;
      if (appearance.texture !== undefined) updatePayload.$set['profileCustomization.appearance.texture'] = appearance.texture;
    }
    
    // Visibility
    if (visibility) {
      if (visibility.showGithub !== undefined) updatePayload.$set['profileCustomization.visibility.showGithub'] = visibility.showGithub;
      if (visibility.showLeetcode !== undefined) updatePayload.$set['profileCustomization.visibility.showLeetcode'] = visibility.showLeetcode;
      if (visibility.showExperience !== undefined) updatePayload.$set['profileCustomization.visibility.showExperience'] = visibility.showExperience;
      if (visibility.showEducation !== undefined) updatePayload.$set['profileCustomization.visibility.showEducation'] = visibility.showEducation;
      if (visibility.showProjects !== undefined) updatePayload.$set['profileCustomization.visibility.showProjects'] = visibility.showProjects;
      if (visibility.showCertificates !== undefined) updatePayload.$set['profileCustomization.visibility.showCertificates'] = visibility.showCertificates;
    }
    
    // Metrics Privacy
    if (metricsPrivacy) {
      if (metricsPrivacy.githubHeatmap !== undefined) updatePayload.$set['profileCustomization.metricsPrivacy.githubHeatmap'] = metricsPrivacy.githubHeatmap;
      if (metricsPrivacy.githubTotalStars !== undefined) updatePayload.$set['profileCustomization.metricsPrivacy.githubTotalStars'] = metricsPrivacy.githubTotalStars;
      if (metricsPrivacy.leetcodeHeatmap !== undefined) updatePayload.$set['profileCustomization.metricsPrivacy.leetcodeHeatmap'] = metricsPrivacy.leetcodeHeatmap;
      if (metricsPrivacy.leetcodeRank !== undefined) updatePayload.$set['profileCustomization.metricsPrivacy.leetcodeRank'] = metricsPrivacy.leetcodeRank;
      if (metricsPrivacy.leetcodeAchievements !== undefined) updatePayload.$set['profileCustomization.metricsPrivacy.leetcodeAchievements'] = metricsPrivacy.leetcodeAchievements;
      if (metricsPrivacy.cgpa !== undefined) updatePayload.$set['profileCustomization.metricsPrivacy.cgpa'] = metricsPrivacy.cgpa;
    }
    
    if (Object.keys(updatePayload.$set).length === 0) {
      return res.status(400).json({ message: 'No valid properties provided to update.' });
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updatePayload, { returnDocument: 'after', runValidators: true }).select('profileCustomization');
    if (!updatedUser) return res.status(404).json({ message: 'User not found' });
    
    res.json({ message: 'Profile customization updated', profileCustomization: updatedUser.profileCustomization });
  } catch (error) {
    console.error('Error updating profile customization:', error);
    res.status(500).json({ message: 'Server error updating profile customization', error: error.message });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json([]);
    }
    
    const normalizedQ = q.replace(/_/g, '-');
    
    const users = await User.find({
      $and: [
        { role: 'student' },
        {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { uid: { $regex: normalizedQ, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
            { universityEmail: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
    .select('name uid avatarUrl branch')
    .limit(10)
    .lean();
    
    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Server error searching users' });
  }
};

const scrapeAndCacheMetrics = async (user) => {
  let githubData = null;
  let githubHeatmapData = null;
  let leetcodeData = null;

  if (user.githubUsername) {
    try {
      githubData = await getgithubdata(user.githubUsername);
      githubHeatmapData = await getGithubContributions(user.githubUsername);
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
    // Temporarily disabled for testing - normally 24 hours
    const TWENTY_FOUR_HOURS_MS = 0; // 24 * 60 * 60 * 1000;
    const timeSinceLastLinkedInScrape = user.lastLinkedInScrapeAt 
      ? Date.now() - new Date(user.lastLinkedInScrapeAt).getTime()
      : Infinity;
      
    if (timeSinceLastLinkedInScrape > TWENTY_FOUR_HOURS_MS) {
      try {
        linkedinData = await getLinkedInData(user.linkedInUrl);
        user.lastLinkedInScrapeAt = new Date();
        
        // Fetch posts and filter them with Gemini for achievements
        const posts = await getLinkedInPosts(user.linkedInUrl);
        const newAchievements = await filterAchievementsWithGemini(posts);
        
        if (newAchievements.length > 0) {
            // Check for duplicates before pushing
            if (!user.pendingAchievements) user.pendingAchievements = [];
            const existingTitles = new Set([
              ...user.pendingAchievements.map(a => a.title),
              ...(user.resumeDetails?.achievements || []).map(a => a.title)
            ]);
            
            newAchievements.forEach(ach => {
                if (!existingTitles.has(ach.title)) {
                    user.pendingAchievements.push(ach);
                }
            });
        }
      } catch (err) {
        console.warn('Failed to fetch linkedin data/posts:', err.message);
      }
    }
  }

  user.scrapedData = { github: githubData, githubHeatmap: githubHeatmapData, leetcode: leetcodeData, linkedin: linkedinData };
  
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

  user.markModified('scrapedData');
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

    // Check timeout: 30 minutes (Temporarily disabled for testing)
    const THIRTY_MINUTES_MS = 0; // 30 * 60 * 1000;
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
    const { skills, education, experience, projects, certificates, portfolioUrl, achievements, githubUsername, leetcodeUsername, linkedInUrl } = req.body;
    
    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Safeguard club-issued certificates: preserve authentic club-issued credentials and prevent forgery
    let finalCertificates = (user.resumeDetails && user.resumeDetails.certificates) || [];
    if (Array.isArray(certificates)) {
      const existingClubCerts = finalCertificates.filter(c => c.issuedByClub);
      const sanitizedClientCerts = certificates.map(c => {
        // If it matches an existing club-issued certificate, preserve the authentic verified record
        const matchingClubCert = existingClubCerts.find(ec => ec._id?.toString() === c._id?.toString());
        if (matchingClubCert) {
          // Allow the user to toggle visibility even for club-issued certificates
          matchingClubCert.isHidden = !!c.isHidden;
          return matchingClubCert;
        }
        // Self-added certificate: cannot forge club authorization or verification
        return {
          _id: c._id,
          title: c.title || '',
          issuer: c.issuer || '',
          issueDate: c.issueDate || '',
          credentialUrl: c.credentialUrl || '',
          fileUrl: c.fileUrl || '',
          isComplete: !!c.fileUrl,
          isVerified: false,
          issuedByClub: false,
          isHidden: !!c.isHidden
        };
      });

      // Ensure authentic club certificates are never removed by client edits
      existingClubCerts.forEach(ec => {
        const stillPresent = sanitizedClientCerts.some(sc => sc._id?.toString() === ec._id?.toString());
        if (!stillPresent) {
          sanitizedClientCerts.push(ec);
        }
      });

      finalCertificates = sanitizedClientCerts;
    }

    user.resumeDetails = {
      portfolioUrl: portfolioUrl !== undefined ? portfolioUrl : (user.resumeDetails && user.resumeDetails.portfolioUrl) || '',
      skills: skills || (user.resumeDetails && user.resumeDetails.skills) || [],
      education: education || (user.resumeDetails && user.resumeDetails.education) || [],
      experience: experience || (user.resumeDetails && user.resumeDetails.experience) || [],
      projects: projects || (user.resumeDetails && user.resumeDetails.projects) || [],
      certificates: finalCertificates,
      achievements: achievements || (user.resumeDetails && user.resumeDetails.achievements) || []
    };

    if (req.body.cgpa !== undefined) {
      user.cgpa = String(req.body.cgpa).trim();
    } else if (Array.isArray(education)) {
      const eduWithGrade = education.find(e => e && (e.grade || e.cgpa));
      if (eduWithGrade) {
        user.cgpa = String(eduWithGrade.grade || eduWithGrade.cgpa).trim();
      }
    }

    // Check if handles changed
    const handlesChanged = 
      (githubUsername !== undefined && githubUsername !== user.githubUsername) ||
      (leetcodeUsername !== undefined && leetcodeUsername !== user.leetcodeUsername) ||
      (linkedInUrl !== undefined && linkedInUrl !== user.linkedInUrl);

    if (handlesChanged) {
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      if (user.lastHandleUpdateAt && (Date.now() - new Date(user.lastHandleUpdateAt).getTime() < ONE_DAY_MS)) {
        const remainingHours = Math.ceil((ONE_DAY_MS - (Date.now() - new Date(user.lastHandleUpdateAt).getTime())) / (60 * 60 * 1000));
        return res.status(400).json({ message: `Handles can only be updated once every 24 hours. Please try again in ${remainingHours} hours.` });
      }

      if (githubUsername !== undefined) user.githubUsername = githubUsername;
      if (leetcodeUsername !== undefined) user.leetcodeUsername = leetcodeUsername;
      if (linkedInUrl !== undefined && linkedInUrl !== user.linkedInUrl) {
        user.linkedInUrl = linkedInUrl;
        user.linkedInVerified = false;
        if (user.scrapedData && user.scrapedData.linkedin) {
          delete user.scrapedData.linkedin;
        }
      }
      
      user.lastHandleUpdateAt = new Date();
      
      user.markModified('resumeDetails');
      // Save handles first
      await user.save();
      
      // Trigger a re-scrape with the new handles
      user = await scrapeAndCacheMetrics(user);
    } else {
      user.markModified('resumeDetails');
      await user.save();
    }

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
    
    if (user.avatarUrl) {
      await deleteCloudinaryAsset(user.avatarUrl);
    }
    
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
    let targetUrl = req.query.url;
    if (!targetUrl) {
      if (!req.user || !req.user.id) {
        return res.status(401).send('Unauthorized. Please provide a URL or authenticate.');
      }
      const studentId = req.query.studentId || req.user.id;
      const user = await User.findById(studentId);
      if (!user || !user.resumeUrl) {
        return res.status(404).send('No resume found');
      }
      targetUrl = user.resumeUrl;
    }

    const response = await fetch(targetUrl);
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

const approveAchievement = async (req, res) => {
  try {
    const { title } = req.body;
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const achievementIndex = user.pendingAchievements.findIndex(a => a.title === title);
    if (achievementIndex === -1) return res.status(404).json({ message: 'Pending achievement not found' });

    const achievement = user.pendingAchievements[achievementIndex];
    
    if (!user.resumeDetails) user.resumeDetails = {};
    if (!user.resumeDetails.achievements) user.resumeDetails.achievements = [];
    
    user.resumeDetails.achievements.push(achievement);
    user.pendingAchievements.splice(achievementIndex, 1);
    
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    res.json({ message: 'Achievement approved and added to profile', user: userResponse });
  } catch (error) {
    console.error('Error approving achievement:', error);
    res.status(500).json({ message: 'Server error approving achievement' });
  }
};

const discardAchievement = async (req, res) => {
  try {
    const { title } = req.body;
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const achievementIndex = user.pendingAchievements.findIndex(a => a.title === title);
    if (achievementIndex === -1) return res.status(404).json({ message: 'Pending achievement not found' });

    user.pendingAchievements.splice(achievementIndex, 1);
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    res.json({ message: 'Achievement discarded', user: userResponse });
  } catch (error) {
    console.error('Error discarding achievement:', error);
    res.status(500).json({ message: 'Server error discarding achievement' });
  }
};

const addManualAchievement = async (req, res) => {
  try {
    const { title, description, imageUrl, date } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.resumeDetails) user.resumeDetails = {};
    if (!user.resumeDetails.achievements) user.resumeDetails.achievements = [];
    
    user.resumeDetails.achievements.push({
      title,
      description: description || '',
      imageUrl: imageUrl || '',
      date: date || new Date().toISOString()
    });
    
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    res.json({ message: 'Achievement added successfully', user: userResponse });
  } catch (error) {
    console.error('Error adding achievement manually:', error);
    res.status(500).json({ message: 'Server error adding achievement' });
  }
};

const getGithubHeatmap = async (req, res) => {
  try {
    let targetUsername = req.query.username;
    if (!targetUsername) {
      const user = await User.findById(req.user.id);
      if (!user || !user.githubUsername) {
        return res.status(404).json({ message: 'GitHub username not found' });
      }
      if (!user.githubVerified) {
        return res.status(403).json({ message: 'GitHub account must be verified to view telemetry activity stream' });
      }
      targetUsername = user.githubUsername;
    }

    // Clean up username if full URL or leading @ was provided
    targetUsername = targetUsername.trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '');

    if (!targetUsername) {
      return res.status(400).json({ message: 'Invalid GitHub username' });
    }

    const data = await getGithubContributions(targetUsername);
    if (!data) {
      return res.status(500).json({ message: 'Failed to fetch github contributions' });
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching github heatmap:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const verifyPlatform = async (req, res) => {
  try {
    const { platform } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.verificationCode) return res.status(400).json({ message: 'No verification code found for user. Please generate one first.' });

    let isVerified = false;

    if (platform === 'github') {
      if (!user.githubUsername) return res.status(400).json({ message: 'No GitHub username linked' });
      const githubData = await getgithubdata(user.githubUsername);
      if (githubData?.profile?.bio && githubData.profile.bio.includes(user.verificationCode)) {
        user.githubVerified = true;
        isVerified = true;
      }
    } else if (platform === 'leetcode') {
      if (!user.leetcodeUsername) return res.status(400).json({ message: 'No LeetCode username linked' });
      const leetcodeData = await getleetcodedata(user.leetcodeUsername, true);
      if (leetcodeData?.profile && JSON.stringify(leetcodeData.profile).includes(user.verificationCode)) {
        user.leetcodeVerified = true;
        isVerified = true;
      }
    } else if (platform === 'linkedin') {
      if (!user.linkedInUrl) return res.status(400).json({ message: 'No LinkedIn URL linked' });
      const linkedinData = await getLinkedInData(user.linkedInUrl);
      if (linkedinData && ((linkedinData.about && linkedinData.about.includes(user.verificationCode)) || (linkedinData.headline && linkedinData.headline.includes(user.verificationCode)))) {
        user.linkedInVerified = true;
        isVerified = true;
      }
    } else {
      return res.status(400).json({ message: 'Invalid or unsupported platform for verification' });
    }

    if (isVerified) {
      await user.save();
      const userResponse = user.toObject();
      delete userResponse.password;
      return res.json({ message: `${platform} verified successfully!`, user: userResponse });
    } else {
      return res.status(400).json({ message: `Verification code not found in your ${platform} profile bio/about section.` });
    }
  } catch (error) {
    console.error('Error verifying platform:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
};

const generateVerificationCode = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.verificationCode = `cc-verify-${crypto.randomBytes(4).toString('hex')}`;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    res.json({ message: 'Verification code generated', user: userResponse });
  } catch (error) {
    console.error('Error generating code:', error);
    res.status(500).json({ message: 'Server error generating code' });
  }
};

module.exports = {
  getProfile,
  getPublicProfile,
  updateProfile,
  refreshMetrics,
  updatePortfolio,
  uploadAvatar,
  uploadCertFile,
  getResumePdf,
  approveAchievement,
  discardAchievement,
  addManualAchievement,
  getGithubHeatmap,
  verifyPlatform,
  generateVerificationCode,
  searchUsers,
  updateProfileCustomization
};
