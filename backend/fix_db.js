const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Opportunity = require('./models/Opportunities');
const Applicant = require('./models/Applicants');
const { generateRequirementVector, normalizeRequirementVector, evaluateApplicantMatch } = require('./controllers/algodimension');

async function fixCrash() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGODB_URI);

        const oppId = '6a70e514b993d99f9c1fc8b1';
        console.log("Fetching Opportunity:", oppId);
        const opp = await Opportunity.findById(oppId);
        if (!opp) {
            console.log("Opportunity not found!");
            process.exit(1);
        }

        console.log("Force generating vector and specificity...");
        const { vector: rawVector, jobDomainSpecificity } = await generateRequirementVector(opp);
        const normalizedVector = normalizeRequirementVector(rawVector);
        opp.jobVector = Object.values(normalizedVector);
        opp.jobDomainSpecificity = jobDomainSpecificity / 100;
        opp.vectorProcessed = true;
        await opp.save();
        console.log("Saved Job Domain Specificity:", opp.jobDomainSpecificity);

        const apps = await Applicant.find({ opportunityId: oppId });
        console.log(`Found ${apps.length} applicants. Reprocessing...`);

        for (const app of apps) {
            console.log("Reprocessing user:", app.userId);
            await evaluateApplicantMatch(app.userId, oppId);
            console.log("Successfully re-evaluated applicant:", app._id);
        }

        console.log("DONE");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
fixCrash();
