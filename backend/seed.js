require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('./models/User');

const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB...');

    // Clear existing users
    await User.deleteMany({});

    // Create Student
    await User.create({
      email: 'student@university.edu',
      password: hashPassword('password123'),
      role: 'student'
    });

    // Create Admin
    await User.create({
      email: 'admin@university.edu',
      password: hashPassword('password123'),
      role: 'admin'
    });

    console.log('Database seeded with student and admin accounts.');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();