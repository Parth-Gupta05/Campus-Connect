const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:/Users/komal/OneDrive/Desktop/campus-connect/backend/.env' });

async function updateDb() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    const User = require('./models/User');
    const Club = require('./models/Club');
    
    // The previous run updated p@p.com to 23-MECHA80-27 but let's make sure it's updated.
    const resultUser = await User.updateOne(
      { email: 'p@p.com' },
      { $set: { uid: '23-MECHA80-27' } }
    );
    console.log('User update result:', resultUser);

    const resultClub = await Club.updateMany(
      { 'pendingMembers.uid': '23-COMPA80-27' },
      { $set: { 'pendingMembers.$.uid': '23-MECHA80-27' } }
    );
    console.log('Club update result:', resultClub);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updateDb();
