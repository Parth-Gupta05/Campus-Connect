const path = require('path');
const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Applicant = require('./models/Applicants');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Connect to MongoDB
 */
async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('[MATCH CRON] Connected to MongoDB successfully');
    } catch (err) {
      console.error('[MATCH CRON] MongoDB connection error:', err);
      process.exit(1);
    }
  }
}

/**
 * Worker task: Fetch applicants where matchScoreCalculated is false and hit evaluation endpoint
 */
async function processPendingApplicantMatches() {
  try {
    await connectDB();

    // Fetch all applicants where matchScoreCalculated is false
    const pendingApplicants = await Applicant.find({
      matchScoreCalculated: { $ne: true },
    });

    if (pendingApplicants.length === 0) {
      console.log(`[MATCH CRON ${new Date().toLocaleTimeString()}] No pending applicant match calculations.`);
      return;
    }

    console.log(
      `[MATCH CRON ${new Date().toLocaleTimeString()}] Found ${pendingApplicants.length} pending applicant match(es) for processing.`
    );

    for (const applicant of pendingApplicants) {
      const { userId, opportunityId } = applicant;
      const endpoint = `${API_BASE_URL}/evaluate-applicant-match/${userId}/${opportunityId}`;

      console.log(
        `[MATCH CRON] Processing match score for User ID: ${userId} & Opportunity ID: ${opportunityId}`
      );

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok) {
          console.log(
            `[MATCH CRON] Successfully calculated match score for User ${userId} on Opportunity ${opportunityId}: ${data.applicant?.matchScore}%`
          );
        } else {
          console.error(
            `[MATCH CRON] Failed to calculate match score for User ${userId} & Opportunity ${opportunityId}:`,
            data.details || data.message || data
          );
        }
      } catch (reqErr) {
        console.error(
          `[MATCH CRON] Error hitting endpoint for User ${userId} & Opportunity ${opportunityId}:`,
          reqErr.message
        );
      }
    }
  } catch (err) {
    console.error('[MATCH CRON] Error in processPendingApplicantMatches task:', err);
  }
}

// Execute immediately on startup
processPendingApplicantMatches();

// Schedule worker task to run every 1 minute (60,000 ms)
const INTERVAL_MS = 60 * 1000;
setInterval(processPendingApplicantMatches, INTERVAL_MS);

console.log('[MATCH CRON Worker] Applicant Match Evaluation Cron Service started. Running every 1 minute...');
