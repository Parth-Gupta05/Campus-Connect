const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:/Users/komal/OneDrive/Desktop/campus-connect/backend/.env' });
const User = require('./models/User');
const Opportunity = require('./models/Opportunities');
const { calculateOpportunityCompatibility } = require('./controllers/algodimension');

async function testMatch() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const user = await User.findOne({ email: 'p@p.com' });
    const opportunity = await Opportunity.findOne();

    if (!user || !opportunity) {
      console.log('User or Opportunity not found');
      process.exit(1);
    }

    // Force vector regeneration to get jobDomainSpecificity from LLM
    opportunity.jobVector = [];
    await opportunity.save();

    console.log('==========================================');
    console.log('Evaluating Compatibility (Keyword Match)');
    console.log('==========================================');
    console.log('Job Title:', opportunity.title);
    console.log('Required Skills:', opportunity.requiredSkills);
    
    // Evaluate Compatibility
    const result = await calculateOpportunityCompatibility(user._id, opportunity._id);
    
    console.log('\n--- Match Results ---');
    console.log('Total Required Skills:', result.totalRequired);
    console.log('Matching Skills:', result.matchingSkills);
    console.log('Missing Skills:', result.missingSkills);
    console.log('\nFinal Similarity Score:', result.similarity);
    console.log('Final Match Score %:', result.matchScore);
    console.log('Reasoning:', result.reasoning);
    console.log('==========================================\n');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testMatch();
