const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const Club = require('../models/Club');
const emailService = require('../utils/emailService');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { message: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper to hash password
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

const BRANCH_MAPPING = {
  COMP: "B.E. Computer Engineering",
  IT: "B.E. Information Technology",
  AIDS: "B.Tech Artificial Intelligence and Data Science",
  AIML: "B.Tech Artificial Intelligence and Machine Learning",
  MECH: "B.E. Mechanical Engineering",
  MME: "B.E - Mechanical and Mechatronics Engineering (Additive Manufacturing)",
  IOT: "B.Tech Computer Science & Engineering(IoT)",
  CIVIL: "B.E. Civil Engineering",
  EXTC: "B.E. Electronics and Telecommunication Engineering",
  ECS: "B.E. Electronics and Computer Science",
  CSE: "B.E. Computer Science and Engineering (Cyber Security)"
};

// Helper to parse UID
const parseUID = (uid) => {
  const match = uid.match(/^(\d{2})-([A-Za-z]+)([A-Za-z])(\d+)-(\d{2})$/);
  if (!match) return null;

  const admissionYear = '20' + match[1];
  const shortCode = match[2].toUpperCase();
  const branch = BRANCH_MAPPING[shortCode] || shortCode;
  const division = match[3].toUpperCase();
  const rollNo = match[4];
  const graduationYear = '20' + match[5];

  const currentYearFull = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11
  
  const yearsDiff = currentYearFull - parseInt(admissionYear);
  let currentSem = 1;

  if (currentMonth >= 6) {
    currentSem = (yearsDiff * 2) + 1;
  } else {
    currentSem = (yearsDiff * 2);
  }

  if (currentSem > 8) currentSem = 8;
  if (currentSem < 1) currentSem = 1;

  let currentYear = 'FE';
  if (currentSem <= 2) currentYear = 'FE';
  else if (currentSem <= 4) currentYear = 'SE';
  else if (currentSem <= 6) currentYear = 'TE';
  else if (currentSem <= 8) currentYear = 'BE';

  return {
    admissionYear,
    graduationYear,
    branch,
    division,
    rollNo,
    currentYear,
    currentSem
  };
};

// Register Route
router.post('/register', async (req, res) => {
  try {
    let { identifier, password, role } = req.body;
    identifier = identifier?.trim();

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide email/UID and password' });
    }

    const isEmail = identifier.includes('@');
    let email, universityEmail;
    if (isEmail) {
      if (identifier.endsWith('@tcetmumbai.in')) {
        universityEmail = identifier;
      } else {
        email = identifier;
      }
    }
    const uid = !isEmail ? identifier.toUpperCase() : undefined;

    // Check if user already exists
    const query = [];
    if (email) query.push({ email });
    if (universityEmail) query.push({ universityEmail });
    if (uid) query.push({ uid });

    const existingUser = await User.findOne({ $or: query });
    if (existingUser) {
      return res.status(400).json({ message: 'Account is already registered with this credential' });
    }

    // Hash password
    const hashedPassword = hashPassword(password);

    let profileData = {};
    if (uid) {
      const parsed = parseUID(uid);
      if (parsed) {
        profileData = parsed;
      }
    }
    
    // Override with any explicit profile data provided by the frontend (e.g. from UID verification modal)
    if (req.body.profileData) {
      profileData = { ...profileData, ...req.body.profileData };
    }

    if (profileData.division) {
      profileData.division = profileData.division.toUpperCase().charAt(0);
    }

    // Create new user
    const user = new User({
      email,
      universityEmail,
      uid,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'student', // Default to student
      ...profileData
    });

    await user.save();

    // Create Access Token (auto login)
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Create Refresh Token
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Set Refresh Token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      message: 'Account created successfully',
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        universityEmail: user.universityEmail,
        uid: user.uid,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login Route
router.post('/login', loginLimiter, async (req, res) => {
  try {
    let { identifier, password, remember } = req.body;
    identifier = identifier?.trim();

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide email/UID and password' });
    }

    const isEmail = identifier.includes('@');
    const uid = !isEmail ? identifier.toUpperCase() : undefined;

    const query = [];
    if (isEmail) {
      query.push({ email: identifier });
      query.push({ universityEmail: identifier });
    }
    if (uid) query.push({ uid });

    // Find user
    let user = await User.findOne({ $or: query });
    let isClub = false;

    if (!user && isEmail) {
      user = await Club.findOne({ email: identifier });
      if (user) isClub = true;
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create Access Token
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // Short lived access token
    );

    // Create Refresh Token (Long lived if remember is true, otherwise shorter)
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: remember ? '7d' : '1d' } 
    );

    // Set Refresh Token in HttpOnly cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    };

    if (remember) {
      cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    }

    res.cookie('refreshToken', refreshToken, cookieOptions);

    // Send response
    res.json({
      message: 'Logged in successfully',
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        universityEmail: user.universityEmail,
        uid: user.uid,
        role: user.role,
        isMissingCredential: isClub ? false : (!user.email || !user.uid)
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Link Account Route
router.post('/link-account', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    let { identifier } = req.body;
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ message: 'Please provide an identifier to link' });
    }
    identifier = identifier.trim();

    const isEmail = identifier.includes('@');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (isEmail) {
      const isUniversity = identifier.endsWith('@tcetmumbai.in');
      
      // Validation before sending OTP
      if (isUniversity) {
        if (user.universityEmail) {
          return res.status(400).json({ message: 'University email is already linked' });
        }
        const existingUser = await User.findOne({ universityEmail: identifier });
        if (existingUser) {
          return res.status(400).json({ message: 'This email is already in use by another account' });
        }
      } else {
        if (user.email) {
          return res.status(400).json({ message: 'Email is already linked' });
        }
        const existingUser = await User.findOne({ email: identifier });
        if (existingUser) {
          return res.status(400).json({ message: 'This email is already in use by another account' });
        }
      }

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.pendingLinkEmail = identifier;
      user.linkEmailOtp = otp;
      user.linkEmailOtpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
      
      await user.save();
      await emailService.sendLinkEmailOtp(identifier, otp);
      
      return res.json({ requiresOtp: true, message: 'OTP sent to email' });

    } else {
      const uid = identifier.toUpperCase();
      if (user.uid) {
        return res.status(400).json({ message: 'UID is already linked' });
      }
      const existingUser = await User.findOne({ uid: uid });
      if (existingUser) {
        return res.status(400).json({ message: 'This UID is already in use by another account' });
      }
      user.uid = uid;
      
      // Auto-fill details if missing
      let profileData = parseUID(uid) || {};
      if (req.body.profileData) {
        profileData = { ...profileData, ...req.body.profileData };
      }

      if (Object.keys(profileData).length > 0) {
        if (!user.admissionYear) user.admissionYear = profileData.admissionYear;
        if (!user.graduationYear) user.graduationYear = profileData.graduationYear;
        if (!user.branch) user.branch = profileData.branch;
        if (!user.division && profileData.division) user.division = profileData.division.toUpperCase().charAt(0);
        if (!user.rollNo) user.rollNo = profileData.rollNo;
        if (!user.currentYear) user.currentYear = profileData.currentYear;
        if (!user.currentSem) user.currentSem = profileData.currentSem;
      }
    }

    await user.save();

    res.json({
      message: 'Account linked successfully',
      user: {
        id: user._id,
        email: user.email,
        uid: user.uid,
        role: user.role,
        isMissingCredential: !user.email || !user.uid
      }
    });

  } catch (error) {
    console.error('Link account error:', error);
    res.status(500).json({ message: 'Server error during account linking' });
  }
});

// @route   POST /api/auth/verify-link-otp
// @desc    Verify OTP to link email
// @access  Private
router.post('/verify-link-otp', async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  let { otp } = req.body;
  if (!otp || !otp.trim()) {
    return res.status(400).json({ message: 'Please provide the OTP' });
  }
  otp = otp.trim();

  try {
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.linkEmailOtp || user.linkEmailOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (Date.now() > user.linkEmailOtpExpiry) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    const emailToLink = user.pendingLinkEmail;
    if (!emailToLink) {
      return res.status(400).json({ message: 'No pending email to link' });
    }

    const isUniversity = emailToLink.endsWith('@tcetmumbai.in');
    if (isUniversity) {
      user.universityEmail = emailToLink;
    } else {
      user.email = emailToLink;
    }

    user.pendingLinkEmail = null;
    user.linkEmailOtp = null;
    user.linkEmailOtpExpiry = null;

    await user.save();

    res.json({
      message: 'Email linked successfully',
      user: {
        id: user._id,
        email: user.email,
        uid: user.uid,
        role: user.role,
        isMissingCredential: !user.email || !user.uid
      }
    });

  } catch (error) {
    console.error('Verify link OTP error:', error);
    res.status(500).json({ message: 'Server error verifying OTP' });
  }
});

// Refresh Token Route
router.post('/refresh', (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    // Verify refresh token
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid refresh token' });
      }

      // Find user to get role
      let user = await User.findById(decoded.id);
      if (!user) {
        user = await Club.findById(decoded.id);
      }
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Issue new access token
      const accessToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      res.json({ accessToken });
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ message: 'Server error during token refresh' });
  }
});

// Logout Route
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
});

// Forgot Password Route
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot reset password via OTP' });
    }

    // Cooldown check (60 seconds)
    if (user.resetOtpLastSent && Date.now() - user.resetOtpLastSent.getTime() < 60000) {
      return res.status(429).json({ message: 'Please wait 60 seconds before requesting another OTP' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = hashPassword(otp);

    user.resetOtp = hashedOtp;
    user.resetOtpExpiry = new Date(Date.now() + 15 * 60000); // 15 mins
    user.resetOtpLastSent = new Date();
    await user.save();

    const { sendPasswordResetEmail } = require('../utils/emailService');
    await sendPasswordResetEmail(user.email, otp);

    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify OTP Route
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.resetOtp || !user.resetOtpExpiry || user.resetOtpExpiry < new Date()) {
      return res.status(400).json({ message: 'OTP is invalid or expired' });
    }

    const hashedProvidedOtp = hashPassword(otp);
    if (user.resetOtp !== hashedProvidedOtp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset Password Route
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.resetOtp || !user.resetOtpExpiry || user.resetOtpExpiry < new Date()) {
      return res.status(400).json({ message: 'OTP is invalid or expired' });
    }

    // Verify OTP
    const hashedProvidedOtp = hashPassword(otp);
    if (user.resetOtp !== hashedProvidedOtp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Update Password
    user.password = hashPassword(newPassword);
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    user.resetOtpLastSent = null;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;