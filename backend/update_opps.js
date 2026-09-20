const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:/Users/komal/OneDrive/Desktop/campus-connect/backend/.env' });
const Opportunity = require('./models/Opportunities');

async function updateDb() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const sampleRequirements = [
      { criterion: '10th_percent', operator: 'gte', value: '60' },
      { criterion: '12th_percent', operator: 'gte', value: '60' },
      { criterion: 'cgpa', operator: 'gte', value: '7.5' },
      { criterion: 'active_backlogs', operator: 'eq', value: '0' },
      { criterion: 'branch', operator: 'in', value: ['B.E. Computer Engineering', 'B.E. Information Technology', 'B.E. Artificial Intelligence and Data Science'] }
    ];

    const result = await Opportunity.updateMany(
      {},
      { $set: { requirements: sampleRequirements } }
    );
    console.log('Opportunities update result:', result);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updateDb();
