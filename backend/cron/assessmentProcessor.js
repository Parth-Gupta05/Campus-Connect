const cron = require('node-cron');
const axios = require('axios');
const xlsx = require('xlsx');
const AssessmentUpload = require('../models/AssessmentUpload');
const User = require('../models/User');

// Helper to determine the dimension index based on column name
// Helper to extract and scale scores from the specific TCET excel format
const extractScores = (row) => {
    // Technical subjects are out of 10, multiply by 10 to get percentage
    const getTechScore = (key) => {
        const val = row[key];
        return val !== undefined && val !== null && !isNaN(val) ? parseFloat(val) * 10 : -1;
    };

    // Aptitude and Coding have direct percentage columns
    const getPercentScore = (key) => {
        const val = row[key];
        return val !== undefined && val !== null && !isNaN(val) ? parseFloat(val) : -1;
    };

    const verbalAbility = parseFloat(row['Verbal Ability']) || 0;
    const verbalReasoning = parseFloat(row['Verbal Reasoning']) || 0;
    const commScore = row['Verbal Ability'] !== undefined ? ((verbalAbility + verbalReasoning) / 20) * 100 : -1;

    return [
        getTechScore('Technical DSA'), // DSA
        getTechScore('TechnicalSQL') !== -1 ? getTechScore('TechnicalSQL') : getTechScore('Technical SQL'), // SQL
        getPercentScore('Coding marks %'), // PROGRAMMING
        getTechScore('TechnicalOOPs') !== -1 ? getTechScore('TechnicalOOPs') : getTechScore('Technical OOPs'), // OOP
        getTechScore('Technical DBMS'), // DBMS
        getTechScore('Technical CN'), // CN
        getTechScore('Technical OS'), // OS
        getPercentScore('Aptitute Marks %'), // APTITUDE
        commScore // COMMUNICATION
    ];
};

const processPendingUploads = async () => {
    try {
        const pendingUploads = await AssessmentUpload.find({ status: 'PENDING' });
        if (pendingUploads.length === 0) return;

        console.log(`Found ${pendingUploads.length} pending assessment uploads. Processing...`);

        for (const upload of pendingUploads) {
            upload.status = 'PROCESSING';
            await upload.save();

            try {
                // Download file from Cloudinary
                const response = await axios.get(upload.fileUrl, { responseType: 'arraybuffer' });
                
                // Parse Excel
                const workbook = xlsx.read(response.data, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                
                // Convert sheet to JSON, array of arrays to find header row
                const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
                
                // Find the row index that contains 'T&P UID' or 'UID'
                let headerRowIndex = 0;
                for (let i = 0; i < rawData.length; i++) {
                    const row = rawData[i];
                    if (row && (row.includes('T&P UID') || row.includes('UID') || row.includes('Name of The Student'))) {
                        headerRowIndex = i;
                        break;
                    }
                }
                
                // Convert to JSON using the found header row
                const data = xlsx.utils.sheet_to_json(sheet, { range: headerRowIndex });
                
                let processedCount = 0;
                upload.results = [];
                
                // Check if the sheet has an 'Updated' column at all
                const hasUpdatedColumn = data.length > 0 && Object.keys(data[0]).some(k => 
                    ['status', 'action', 'updated'].includes(k.toLowerCase())
                );
                
                for (let i = 0; i < data.length; i++) {
                    const row = data[i];
                    
                    if (hasUpdatedColumn) {
                        const statusField = row['Status'] || row['Action'] || row['updated'] || row['Updated'];
                        if (!statusField || statusField.toString().toLowerCase() !== 'updated') {
                            continue;
                        }
                    }
                    
                    // Identify user by UID or Email
                    const uid = row['T&P UID'] || row['UID'] || row['uid'];
                    const email = row['Email'] || row['email'];
                    
                    if (!uid && !email) continue;
                    
                    let user;
                    if (uid) {
                        user = await User.findOne({ uid: uid });
                    }
                    if (!user && email) {
                        user = await User.findOne({ email: email });
                    }
                    
                    if (!user) {
                        upload.errors.push({ row: i + headerRowIndex + 2, reason: `User not found for UID/Email: ${uid || email}` });
                        continue;
                    }
                    
                    // Initialize vectors if they don't exist
                    if (!user.academicVector || user.academicVector.length !== 9) {
                        user.academicVector = Array(9).fill(-1);
                    }
                    
                    // Extract scores for this specific TCET format
                    const newScores = extractScores(row);
                    
                    // Save to AssessmentUpload results
                    const name = row['Name of The Student'] || row['Name'] || row['name'] || user.name || 'Unknown';
                    upload.results.push({
                        user: user._id,
                        uid: uid || user.uid || '',
                        name: name,
                        scores: newScores
                    });
                    
                    // Update academic vector with new max scores
                    for (let dim = 0; dim < 9; dim++) {
                        const newScore = newScores[dim];
                        if (newScore !== -1) {
                            const oldScore = user.academicVector[dim];
                            user.academicVector[dim] = oldScore === -1 ? newScore : Math.max(oldScore, newScore);
                        }
                    }
                    
                    // Generate Platform Baseline
                    const { calculatePlatformBaseline, mergeWithVerifiedBoost } = require('../utils/vectorEngine');
                    const platformBaseline = calculatePlatformBaseline(user.scrapedData);
                    
                    // Merge vectors
                    user.skillVector = mergeWithVerifiedBoost(user.academicVector, platformBaseline);
                    
                    // Add assessment reference if not already there
                    if (!user.assessments) {
                        user.assessments = [];
                    }
                    if (!user.assessments.includes(upload._id)) {
                        user.assessments.push(upload._id);
                    }
                    
                    // Tell Mongoose the arrays were modified
                    user.markModified('academicVector');
                    user.markModified('skillVector');
                    user.markModified('assessments');

                    await user.save();
                    processedCount++;
                }
                
                upload.status = 'COMPLETED';
                upload.processedCount = processedCount;
                await upload.save();
                console.log(`Successfully processed upload ${upload._id}. Updated ${processedCount} students.`);
                
            } catch (err) {
                console.error(`Error processing upload ${upload._id}:`, err);
                upload.status = 'FAILED';
                upload.errors.push({ row: 0, reason: 'System error during processing: ' + err.message });
                await upload.save();
            }
        }
    } catch (error) {
        console.error('Error in assessment cron job:', error);
    }
};

// Run every 5 minutes
cron.schedule('*/5 * * * *', processPendingUploads);

console.log('Assessment Background Processor (Cron) initialized.');

module.exports = { processPendingUploads };
