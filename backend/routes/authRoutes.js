const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Club = require('../models/Club');

const router = express.Router();

// Helper to hash password
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Helper to parse UID
const parseUID = (uid) => {
  const match = uid.match(/^(\d{2})-([A-Za-z]+)([A-Za-z])(\d+)-(\d{2})$/);
  if (!match) return null;

  const admissionYear = '20' + match[1];
  const branch = match[2].toUpperCase();
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
    const { identifier, password, role } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide email/UID and password' });
    }

    const isEmail = identifier.includes('@');
    const email = isEmail ? identifier : undefined;
    const uid = !isEmail ? identifier.toUpperCase() : undefined;

    // Check if user already exists
    const query = [];
    if (email) query.push({ email });
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

    // Create new user
    const user = new User({
      email,
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
router.post('/login', async (req, res) => {
  try {
    const { identifier, password, remember } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide email/UID and password' });
    }

    const isEmail = identifier.includes('@');
    const email = isEmail ? identifier : undefined;
    const uid = !isEmail ? identifier.toUpperCase() : undefined;

    const query = [];
    if (email) query.push({ email });
    if (uid) query.push({ uid });

    // Find user
    let user = await User.findOne({ $or: query });
    let isClub = false;

    if (!user && isEmail) {
      user = await Club.findOne({ email });
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

    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ message: 'Please provide an identifier to link' });
    }

    const isEmail = identifier.includes('@');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (isEmail) {
      if (user.email) {
        return res.status(400).json({ message: 'Email is already linked' });
      }
      const existingUser = await User.findOne({ email: identifier });
      if (existingUser) {
        return res.status(400).json({ message: 'This email is already in use by another account' });
      }
      user.email = identifier;
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
      const parsed = parseUID(uid);
      if (parsed) {
        if (!user.admissionYear) user.admissionYear = parsed.admissionYear;
        if (!user.graduationYear) user.graduationYear = parsed.graduationYear;
        if (!user.branch) user.branch = parsed.branch;
        if (!user.division) user.division = parsed.division;
        if (!user.rollNo) user.rollNo = parsed.rollNo;
        if (!user.currentYear) user.currentYear = parsed.currentYear;
        if (!user.currentSem) user.currentSem = parsed.currentSem;
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

module.exports = router;