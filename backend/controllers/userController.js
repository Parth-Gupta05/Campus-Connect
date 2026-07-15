const User = require('../models/User');
const { getgithubdata, getleetcodedata } = require('./algodimension');

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

  user.scrapedData = { github: githubData, leetcode: leetcodeData };
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
    const { skills, education, experience, projects } = req.body;
    
    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.resumeDetails = {
      skills: skills || user.resumeDetails?.skills || [],
      education: education || user.resumeDetails?.education || [],
      experience: experience || user.resumeDetails?.experience || [],
      projects: projects || user.resumeDetails?.projects || []
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

module.exports = {
  getProfile,
  updateProfile,
  refreshMetrics,
  updatePortfolio
};
