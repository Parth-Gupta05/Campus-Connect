const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Opportunity = require('./models/Opportunities');
const Applicant = require('./models/Applicants');
const { generateRequirementVector, normalizeRequirementVector, evaluateApplicantMatch } = require('./controllers/algodimension');

async function migrateDatabase() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected successfully.");

        console.log("\n=============================================");
        console.log("STEP 1: Migrating Opportunities (FORCED)");
        console.log("=============================================");
        const opportunities = await Opportunity.find({});
        console.log(`Found ${opportunities.length} opportunities.`);

        for (const opp of opportunities) {
            console.log(`\nProcessing Opportunity: ${opp.title} (${opp._id})`);
            console.log(`-> Force generating vector and domain specificity...`);
            try {
                const { vector: rawVector, jobDomainSpecificity } = await generateRequirementVector(opp);
                const normalizedVector = normalizeRequirementVector(rawVector);
                opp.jobVector = Object.values(normalizedVector);
                opp.jobDomainSpecificity = jobDomainSpecificity / 100;
                opp.vectorProcessed = true;
                await opp.save();
                console.log(`-> Saved: Specificity = ${opp.jobDomainSpecificity}`);
            } catch (e) {
                console.error(`-> Failed to generate for opp ${opp._id}:`, e.message);
            }
        }

        console.log("\n=============================================");
        console.log("STEP 2: Migrating Applicants (FORCED)");
        console.log("=============================================");
        const applicants = await Applicant.find({});
        console.log(`Found ${applicants.length} applicants.`);

        for (const app of applicants) {
            console.log(`\nProcessing Applicant: User ${app.userId} for Opp ${app.opportunityId}`);
            console.log(`-> Force generating match details...`);
            try {
                await evaluateApplicantMatch(app.userId, app.opportunityId);
                console.log(`-> Successfully re-evaluated and updated applicant.`);
            } catch (e) {
                console.error(`-> Failed to evaluate applicant ${app._id}:`, e.message);
            }
        }

        console.log("\n=============================================");
        console.log("MIGRATION COMPLETE.");
        console.log("=============================================");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrateDatabase();
