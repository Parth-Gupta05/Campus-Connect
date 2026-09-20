const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Applicant = require('./models/Applicants');
const Opportunity = require('./models/Opportunities');
const User = require('./models/User');

async function fixRequirements() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const applicants = await Applicant.find({});
        console.log(`Checking requirements for ${applicants.length} applicants...`);

        for (const app of applicants) {
            const opp = await Opportunity.findById(app.opportunityId);
            const user = await User.findById(app.userId);
            
            if (!opp || !user) continue;

            let failedRequirements = [];
            if (opp.requirements && opp.requirements.length > 0) {
                const education = user.resumeDetails?.education || [];
                const cgpaStr = user.cgpa || education.find(e => e?.level === 'Undergraduate' || e?.level === 'Undergrad Degree')?.grade || education.find(e => e?.level === 'Undergraduate' || e?.level === 'Undergrad Degree')?.cgpa || '0';
                const userCgpa = parseFloat(cgpaStr) || 0;

                const tenthEdu = education.find(e => e?.level === '10th' || e?.level === 'High School (10th Std)');
                const user10th = parseFloat(tenthEdu?.grade || tenthEdu?.score || '0');

                const twelfthEdu = education.find(e => e?.level === '12th / Diploma' || e?.level === '12th' || e?.level === '11th and 12th or Diploma');
                const user12th = parseFloat(twelfthEdu?.grade || twelfthEdu?.score || '0');

                const userBacklogs = user.activeBacklogs || 0; 
                const userBranch = user.branch || '';
                
                const getValueForCriterion = (criterion) => {
                    if (criterion === 'cgpa') return userCgpa;
                    if (criterion === '10th_percent') return user10th;
                    if (criterion === '12th_percent') return user12th;
                    if (criterion === 'active_backlogs') return userBacklogs;
                    if (criterion === 'branch') return userBranch;
                    return null;
                };

                for (let reqObj of opp.requirements) {
                    const userValue = getValueForCriterion(reqObj.criterion);
                    if (userValue === null) continue;

                    let passed = true;
                    
                    if (reqObj.operator === 'in') {
                        const allowedValues = Array.isArray(reqObj.value) ? reqObj.value : [reqObj.value];
                        passed = allowedValues.some(val => val.toString().toLowerCase() === userValue.toString().toLowerCase());
                    } else {
                        const requiredValue = parseFloat(reqObj.value);
                        const numericUserVal = parseFloat(userValue) || 0;
                        switch (reqObj.operator) {
                            case 'gte': passed = numericUserVal >= requiredValue; break;
                            case 'lte': passed = numericUserVal <= requiredValue; break;
                            case 'eq':  passed = numericUserVal == requiredValue; break;
                            case 'gt':  passed = numericUserVal > requiredValue; break;
                            case 'lt':  passed = numericUserVal < requiredValue; break;
                        }
                    }

                    if (!passed) {
                        let reason = `Failed requirement: ${reqObj.criterion.replace('_', ' ')} must be ${reqObj.operator} ${reqObj.value} (Your value: ${userValue})`;
                        if (reqObj.operator === 'in') {
                             reason = `Your branch '${userValue}' is not allowed for this opportunity. Allowed branches: ${Array.isArray(reqObj.value) ? reqObj.value.join(', ') : reqObj.value}`;
                        }
                        failedRequirements.push(reason);
                    }
                }
            }

            app.requirementsReview = failedRequirements;
            if (failedRequirements.length > 0) {
                app.status = 'rejected';
            } else if (app.status === 'rejected' && failedRequirements.length === 0) {
                // Recover status if it was only rejected because of requirements
                app.status = 'applied'; 
            }
            
            await app.save();
            console.log(`Updated requirements for applicant ${app._id}. Failed reqs: ${failedRequirements.length}`);
        }
        console.log("Done.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
fixRequirements();
