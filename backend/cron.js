const path = require('path');
const mongoose = require('mongoose');

// Load environment variables from backend/.env or root .env
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Opportunity = require('./models/Opportunities');
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
      console.log('[CRON] Connected to MongoDB successfully');
    } catch (err) {
      console.error('[CRON] MongoDB connection error:', err);
      process.exit(1);
    }
  }
}

/**
 * Worker task: Fetch opportunities where vectorProcessed is false and hit the vector processing endpoint
 */
async function processPendingOpportunityVectors() {
  try {
    await connectDB();

    // Fetch all opportunities where requirement vector has not been generated yet
    const pendingOpportunities = await Opportunity.find({
      vectorProcessed: { $ne: true },
    });

    if (pendingOpportunities.length === 0) {
      console.log(`[CRON ${new Date().toLocaleTimeString()}] No pending opportunities for vector creation.`);
      return;
    }

    console.log(
      `[CRON ${new Date().toLocaleTimeString()}] Found ${pendingOpportunities.length} pending opportunity(ies) for vector processing.`
    );

    for (const opportunity of pendingOpportunities) {
      const endpoint = `${API_BASE_URL}/process-opportunity-vector/${opportunity._id}`;
      console.log(`[CRON] Processing opportunity ID: ${opportunity._id} (${opportunity.title})`);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok) {
          console.log(`[CRON] Successfully generated vector for opportunity ID: ${opportunity._id}`);
        } else {
          console.error(`[CRON] Failed to generate vector for ID ${opportunity._id}:`, data.message || data);
        }
      } catch (reqErr) {
        console.error(`[CRON] Error hitting endpoint for opportunity ${opportunity._id}:`, reqErr.message);
      }
    }
  } catch (err) {
    console.error('[CRON] Error in processPendingOpportunityVectors task:', err);
  }
}

/**
 * Worker task: Fetch applicants where matchScoreCalculated is false and process them
 */
async function processPendingApplications() {
  try {
    await connectDB();

    const pendingApplications = await Applicant.find({
      matchScoreCalculated: false,
    });

    if (pendingApplications.length === 0) {
      console.log(`[CRON ${new Date().toLocaleTimeString()}] No pending applications for match score calculation.`);
      return;
    }

    console.log(
      `[CRON ${new Date().toLocaleTimeString()}] Found ${pendingApplications.length} pending application(s) for match scoring.`
    );

    for (const applicant of pendingApplications) {
      // The endpoint might be /evaluate-applicant-match/:userId/:opportunityId
      const endpoint = `${API_BASE_URL}/algodimension/evaluate-applicant-match/${applicant.userId}/${applicant.opportunityId}`;
      console.log(`[CRON] Processing application ID: ${applicant._id} for user ${applicant.userId}`);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        let data;
        try {
          data = await response.json();
        } catch (e) {
          data = await response.text();
        }

        if (response.ok) {
          console.log(`[CRON] Successfully calculated match score for application ID: ${applicant._id}`);
        } else {
          console.error(`[CRON] Failed to calculate score for application ${applicant._id}:`, data.message || data);
        }
      } catch (reqErr) {
        console.error(`[CRON] Error hitting endpoint for application ${applicant._id}:`, reqErr.message);
      }
    }
  } catch (err) {
    console.error('[CRON] Error in processPendingApplications task:', err);
  }
}

// Execute immediately on startup
processPendingOpportunityVectors();
processPendingApplications();

// Schedule worker task to run every 1 minute (60,000 ms)
const INTERVAL_MS = 60 * 1000;
setInterval(() => {
  processPendingOpportunityVectors();
  processPendingApplications();
}, INTERVAL_MS);

console.log('[CRON Worker] Opportunity Vector & Application Match Cron Service started. Running every 1 minute...');
