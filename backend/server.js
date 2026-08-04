const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const clubRoutes = require('./routes/clubRoutes');
const eventRoutes = require('./routes/eventRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Vite default port
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start Cron Jobs after DB connect
    require('./cron/attendanceCron');
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
