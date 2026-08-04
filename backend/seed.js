require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('./models/User');
const Club = require('./models/Club');

const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB...');

    // Clear existing users and clubs
    await User.deleteMany({});
    await Club.deleteMany({});

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

    // Create Dummy Club
    await Club.create({
      email: 'techclub@university.edu',
      password: hashPassword('password123'),
      name: 'Tech Innovators Club',
      description: 'A club for technology enthusiasts.',
    });

    console.log('Database seeded with student, admin, and club accounts.');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();