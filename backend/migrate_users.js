const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

const BRANCH_MAPPING = {
  COMP: "B.E. Computer Engineering",
  IT: "B.E. Information Technology",
  AIDS: "B.Tech Artificial Intelligence and Data Science",
  AIML: "B.Tech Artificial Intelligence and Machine Learning",
  MECH: "B.E. Mechanical Engineering",
  MME: "B.E - Mechanical and Mechatronics Engineering (Additive Manufacturing)",
  IOT: "B.Tech Computer Science & Engineering(IoT)",
  CIVIL: "B.E. Civil Engineering",
  EXTC: "B.E. Electronics and Telecommunication Engineering",
  ECS: "B.E. Electronics and Computer Science",
  CSE: "B.E. Computer Science and Engineering (Cyber Security)"
};

async function migrateUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({});
        console.log(`Found ${users.length} users.`);
        
        let updatedCount = 0;
        for (const user of users) {
            if (user.branch && BRANCH_MAPPING[user.branch.toUpperCase()]) {
                const oldBranch = user.branch;
                user.branch = BRANCH_MAPPING[user.branch.toUpperCase()];
                await user.save();
                updatedCount++;
                console.log(`User ${user.email}: Updated branch from '${oldBranch}' to '${user.branch}'`);
            } else if (user.branch) {
                // Check if it's "MECHA" because some screenshots showed "MECHA"
                if (user.branch.toUpperCase().includes('MECHA')) {
                     user.branch = BRANCH_MAPPING['MECH'];
                     await user.save();
                     updatedCount++;
                     console.log(`User ${user.email}: Updated branch to '${user.branch}'`);
                } else {
                     console.log(`User ${user.email}: Branch '${user.branch}' not in mapping or already full format.`);
                }
            }
        }
        
        console.log(`Successfully updated ${updatedCount} users.`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
migrateUsers();
