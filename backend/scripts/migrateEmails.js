const mongoose = require('mongoose');
require('dotenv').config(); 
const User = require('../models/User');

const migrateEmails = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({ email: /@university\.edu$/ });
    console.log(`Found ${users.length} users to migrate.`);
    
    // Cleanup any email: null from the previous failed script run
    const cleanup = await mongoose.connection.collection('users').updateMany(
      { email: { $type: 10 } },
      { $unset: { email: "" } }
    );
    if (cleanup.modifiedCount > 0) console.log(`Cleaned up ${cleanup.modifiedCount} null emails.`);

    let migratedCount = 0;
    for (let user of users) {
      if (user.email) {
        const newEmail = user.email.replace('@university.edu', '@tcetmumbai.in');
        
        await mongoose.connection.collection('users').updateOne(
          { _id: user._id },
          { 
            $set: { universityEmail: newEmail },
            $unset: { email: "" }
          }
        );
        
        migratedCount++;
        console.log(`Migrated ${user.uid || user._id}: -> ${newEmail}`);
      }
    }

    console.log(`Migration complete. Migrated ${migratedCount} users.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrateEmails();
