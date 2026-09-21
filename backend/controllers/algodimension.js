require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const axios = require('axios');
const pdfParse = require('pdf-parse');
const mongoose = require('mongoose');

// Import models
const User = require('../models/User');
const Applicant = require('../models/Applicants');
const Opportunity = require('../models/Opportunities');
const Resume = require('../models/Resume');

/**
 * Calculates the cosine similarity between two vectors.
 */
function calculateCosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += Math.pow(vecA[i], 2);
        normB += Math.pow(vecB[i], 2);
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Maps merged user data into the 10-dimensional skill vector using a rule-based methodology.
 * Normalizes all dimensions to a [0, 1] scale using predefined heuristic ceilings.
 */
function computeRuleBasedSkillVector(parsedResume, scrapedData) {
    // Predefined maximums for Min-Max Normalization to [0,1]
    const MAX_CAPS = {
        d1: 50,  // Technical Skills (skill count + repos)
        d2: 100, // Problem Solving (LeetCode total solved)
        d3: 40,  // Analytical (LeetCode Med/Hard + Complex projects)
        d4: 10,  // Communication (Descriptions length/quality)
        d5: 5,   // Teamwork (Experiences + Collaborations)
        d6: 5,   // Leadership (Leadership roles/keywords)
        d7: 15,  // Initiative (Projects + Hackathons + Active days)
        d8: 20,  // Domain Specialization (Concentration of top language/framework)
        d9: 5,   // Consistency (Years of experience + streaks)
        d10: 10  // Achievement Level (Certificates + Badges + Contests)
    };

    const raw = { d1: 0, d2: 0, d3: 0, d4: 0, d5: 0, d6: 0, d7: 0, d8: 0, d9: 0, d10: 0 };

    // --- 1. Technical Skills (d1) ---
    raw.d1 += (parsedResume.skills || []).length;
    if (scrapedData?.github?.repositories) {
        raw.d1 += scrapedData.github.repositories.length;
    }

    // --- 2. Problem Solving (d2) ---
    if (scrapedData?.leetcode?.solved?.solvedProblem) {
        raw.d2 += scrapedData.leetcode.solved.solvedProblem;
    }

    // --- 3. Analytical Ability (d3) ---
    if (scrapedData?.leetcode?.solved) {
        raw.d3 += (scrapedData.leetcode.solved.mediumSolved || 0) * 1.5;
        raw.d3 += (scrapedData.leetcode.solved.hardSolved || 0) * 3;
    }
    raw.d3 += (parsedResume.projects || []).length * 2;

    // --- 4. Communication Skills (d4) ---
    const expDescriptions = (parsedResume.experience || []).map(e => e.description || '').join(' ');
    const projDescriptions = (parsedResume.projects || []).map(p => p.description || '').join(' ');
    raw.d4 += (expDescriptions.length + projDescriptions.length) > 500 ? 5 : 2;

    // --- 5. Teamwork & Collaboration (d5) ---
    raw.d5 += (parsedResume.experience || []).length * 1.5;
    if (scrapedData?.github?.profile?.following > 0) raw.d5 += 1; // Basic proxy for collaboration

    // --- 6. Leadership (d6) ---
    const leadershipKeywords = ['lead', 'managed', 'mentored', 'directed', 'head', 'coordinator'];
    (parsedResume.experience || []).forEach(exp => {
        const roleLower = (exp.role || '').toLowerCase();
        const descLower = (exp.description || '').toLowerCase();
        if (leadershipKeywords.some(kw => roleLower.includes(kw) || descLower.includes(kw))) {
            raw.d6 += 2;
        }
    });

    // --- 7. Initiative & Engagement (d7) ---
    raw.d7 += (parsedResume.projects || []).length;
    if (scrapedData?.leetcode?.calendar?.totalActiveDays) {
        raw.d7 += (scrapedData.leetcode.calendar.totalActiveDays / 10); // 1 point per 10 active days
    }

    // --- 8. Domain Specialization (d8) ---
    if (scrapedData?.leetcode?.languages?.languageProblemCount?.length > 0) {
        raw.d8 += scrapedData.leetcode.languages.languageProblemCount[0].problemsSolved / 5;
    }

    // --- 9. Consistency (Longitudinal Participation) (d9) ---
    raw.d9 += (parsedResume.experience || []).length;
    if (scrapedData?.leetcode?.calendar?.streak) {
        raw.d9 += (scrapedData.leetcode.calendar.streak / 5);
    }

    // --- 10. Achievement Level (d10) ---
    if (parsedResume.certificates) {
        raw.d10 += parsedResume.certificates.length;
    }
    if (scrapedData?.leetcode?.badges?.badgesCount) {
        raw.d10 += scrapedData.leetcode.badges.badgesCount * 2;
    }

    // Min-Max Normalization to [0, 1] mapping
    const normalize = (val, max) => Math.min(Math.max(val / max, 0), 1);

    return [
        normalize(raw.d1, MAX_CAPS.d1),
        normalize(raw.d2, MAX_CAPS.d2),
        normalize(raw.d3, MAX_CAPS.d3),
        normalize(raw.d4, MAX_CAPS.d4),
        normalize(raw.d5, MAX_CAPS.d5),
        normalize(raw.d6, MAX_CAPS.d6),
        normalize(raw.d7, MAX_CAPS.d7),
        normalize(raw.d8, MAX_CAPS.d8),
        normalize(raw.d9, MAX_CAPS.d9),
        normalize(raw.d10, MAX_CAPS.d10),
    ];
}

/**
 * Main function to generate the skill vector and calculate the match score.
 * 
 * @param {string} userId - The ID of the User
 * @param {string} opportunityId - The ID of the Opportunity
 * @returns {Promise<Object>} The updated Applicant document
 */
const evaluateApplicantMatch = async (userId, opportunityId) => {
    try {
        // 1. Load Applicant, User, and Opportunity
        const applicant = await Applicant.findOne({ userId, opportunityId });
        if (!applicant) throw new Error('Applicant record not found');

        const user = await User.findById(userId);
        if (!user) throw new Error('User record not found');

        const opportunity = await Opportunity.findById(opportunityId);
        if (!opportunity) throw new Error('Opportunity record not found');

        if (!opportunity.jobVector || opportunity.jobVector.length === 0) {
            console.log(`[MATCH EVAL] Opportunity ${opportunityId} missing vector. Generating on-the-fly...`);
            const { vector: rawVector, jobDomainSpecificity } = await generateRequirementVector(opportunity);
            const normalizedVector = normalizeRequirementVector(rawVector);
            opportunity.jobVector = Object.values(normalizedVector);
            opportunity.jobDomainSpecificity = jobDomainSpecificity / 100;
            opportunity.vectorProcessed = true;
            await opportunity.save();
        }

        // 2, 3 & 4. Get Resume and compute/cache resumeVector
        let parsedResumeData = { skills: [], education: [], experience: [], projects: [] };
        let resume = null;
        let resumeVector = [];

        if (applicant.resumeId) {
            resume = await Resume.findById(applicant.resumeId);
        } else if (applicant.resumeUrl || user.resumeUrl) {
            // Backwards compatibility for old records without resumeId but with resumeUrl
            // Try to find if a Resume object was created for this URL
            const targetUrl = applicant.resumeUrl || user.resumeUrl;
            resume = await Resume.findOne({ fileUrl: targetUrl, userId });
        }

        if (resume && resume.resumeVector && resume.resumeVector.length > 0) {
            // Use cached vector! No need to recompute.
            console.log(`[MATCH EVAL] Using cached resumeVector for Resume ${resume._id}`);
            resumeVector = resume.resumeVector;
        } else {
            console.log(`[MATCH EVAL] Computing resumeVector...`);
            if (resume && resume.parsedData) {
                parsedResumeData = resume.parsedData;
            }

            // Merge resumeDetails from User document if available (for backwards compatibility)
            if (user.resumeDetails) {
                if (user.resumeDetails.skills && user.resumeDetails.skills.length > 0) {
                    parsedResumeData.skills = Array.from(new Set([...(parsedResumeData.skills || []), ...user.resumeDetails.skills]));
                }
                if (user.resumeDetails.certificates) {
                    parsedResumeData.certificates = user.resumeDetails.certificates;
                }
            }

            // 5 & 6. Merge resume data with user.scrapedData and Compute the 10-dimensional vector
            resumeVector = computeRuleBasedSkillVector(parsedResumeData, user.scrapedData);

            // Save the computed vector on the Resume document to cache it
            if (resume) {
                resume.resumeVector = resumeVector;
                await resume.save();
                console.log(`[MATCH EVAL] Cached resumeVector to Resume ${resume._id}`);
            }
        }

        // 7. Calculate Domain Relevance and Pruning Multiplier
        let candidateDomainRelevance = 0;
        let pruningMultiplier = 1;
        let prunedResumeVector = [...resumeVector];

        if (opportunity.jobDomainSpecificity !== undefined && opportunity.jobDomainSpecificity > 0) {
            candidateDomainRelevance = await evaluateCandidateDomainRelevance(opportunity, parsedResumeData);
            
            const J = opportunity.jobDomainSpecificity;
            const C_curved = Math.sqrt(candidateDomainRelevance);
            pruningMultiplier = 1 - (J * (1 - C_curved));

            // Prune domain-sensitive dimensions: Tech Skills (0), Problem Solving (1), Analytical (2), Domain Depth (7)
            prunedResumeVector[0] *= pruningMultiplier;
            prunedResumeVector[1] *= pruningMultiplier;
            prunedResumeVector[2] *= pruningMultiplier;
            prunedResumeVector[7] *= pruningMultiplier;
        }

        // 8. Compute cosine similarity with Opportunity.jobVector & Calculate matchScore
        const similarity = calculateCosineSimilarity(prunedResumeVector, opportunity.jobVector);
        const matchScore = Math.min(Math.max(Math.round(similarity * 100), 0), 100);

        // 9. Evaluate Requirements
        let failedRequirements = [];
        if (opportunity.requirements && opportunity.requirements.length > 0) {
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

            for (let reqObj of opportunity.requirements) {
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

        // 10. Populate matchDetails
        applicant.matchScore = matchScore;
        applicant.matchScoreCalculated = true;
        applicant.requirementsReview = failedRequirements;
        if (failedRequirements.length > 0) {
            applicant.status = 'rejected';
        }

        applicant.matchDetails = {
            vectorSimilarity: similarity,
            skillMatchScore: matchScore,
            candidateDomainRelevance: candidateDomainRelevance,
            pruningMultiplier: pruningMultiplier,
            reasoning: 'Matched based on rule-based algorithmic analysis.'
        };

        // 10. Save and Return the updated Applicant document
        await applicant.save();
        return applicant;

    } catch (error) {
        console.error('Error evaluating applicant match:', error);
        throw error;
    }
};

/**
 * Express Controller wrapper for evaluateApplicantMatch route
 */
const evaluateApplicantMatchController = async (req, res) => {
    try {
        const userId = req.body.userId || req.params.userId;
        const opportunityId = req.body.opportunityId || req.params.opportunityId;

        if (!userId || !opportunityId) {
            return res.status(400).json({
                status: 'fail',
                message: 'Both userId and opportunityId are required'
            });
        }

        const updatedApplicant = await evaluateApplicantMatch(userId, opportunityId);

        return res.status(200).json({
            status: 'success',
            message: 'Applicant match evaluated successfully',
            applicant: updatedApplicant
        });
    } catch (error) {
        console.error('Error in evaluateApplicantMatchController:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to evaluate applicant match score',
            details: error.message
        });
    }
};

/**
 * Evaluates compatibility score between a student (or uploaded resume) and an opportunity.
 * Does NOT require an existing Applicant record.
 */
const calculateOpportunityCompatibility = async (userId, opportunityId, resumeId = null, customResumeData = null) => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        const opportunity = await Opportunity.findById(opportunityId);
        if (!opportunity) throw new Error('Opportunity not found');

        if (!opportunity.jobVector || opportunity.jobVector.length === 0) {
            console.log(`[COMPATIBILITY] Generating jobVector on-the-fly for ${opportunityId}...`);
            const { vector: rawVector, jobDomainSpecificity } = await generateRequirementVector(opportunity);
            const normalizedVector = normalizeRequirementVector(rawVector);
            opportunity.jobVector = Object.values(normalizedVector);
            opportunity.jobDomainSpecificity = jobDomainSpecificity / 100;
            opportunity.vectorProcessed = true;
            await opportunity.save();
        }

        // 2. Resolve Resume & parsed data
        let resume = null;
        let resumeVector = [];
        let parsedResumeData = { skills: [], education: [], experience: [], projects: [] };

        if (customResumeData && customResumeData.skills) {
            parsedResumeData = customResumeData;
        } else if (resumeId) {
            resume = await Resume.findOne({ _id: resumeId, userId });
        } else if (user.resumes && user.resumes.length > 0) {
            resume = await Resume.findById(user.resumes[0]);
        } else if (user.resumeUrl) {
            resume = await Resume.findOne({ fileUrl: user.resumeUrl, userId });
        }

        if (resume && resume.resumeVector && resume.resumeVector.length > 0 && !customResumeData) {
            resumeVector = resume.resumeVector;
            if (resume.parsedData) parsedResumeData = resume.parsedData;
        } else {
            if (resume && resume.parsedData) {
                parsedResumeData = resume.parsedData;
            }

            if (user.resumeDetails) {
                if (user.resumeDetails.skills && user.resumeDetails.skills.length > 0) {
                    parsedResumeData.skills = Array.from(new Set([...(parsedResumeData.skills || []), ...user.resumeDetails.skills]));
                }
                if (user.resumeDetails.certificates) {
                    parsedResumeData.certificates = user.resumeDetails.certificates;
                }
            }

            resumeVector = computeRuleBasedSkillVector(parsedResumeData, user.scrapedData);

            if (resume && !customResumeData) {
                resume.resumeVector = resumeVector;
                await resume.save();
            }
        }

        // 3. Skills match breakdown (Used for Keyword-based Domain Relevance)
        const candidateSkills = new Set((parsedResumeData.skills || []).map(s => (s || '').toLowerCase().trim()));
        const reqSkills = opportunity.requiredSkills || [];
        const matchingSkills = reqSkills.filter(s => candidateSkills.has((s || '').toLowerCase().trim()));
        const missingSkills = reqSkills.filter(s => !candidateSkills.has((s || '').toLowerCase().trim()));

        // 4. Calculate Domain Relevance and Pruning Multiplier
        let candidateDomainRelevance = reqSkills.length > 0 ? matchingSkills.length / reqSkills.length : 1;
        let pruningMultiplier = 1;
        let prunedResumeVector = [...resumeVector];

        if (opportunity.jobDomainSpecificity !== undefined && opportunity.jobDomainSpecificity > 0) {
            const J = opportunity.jobDomainSpecificity;
            const C_curved = Math.sqrt(candidateDomainRelevance);
            pruningMultiplier = 1 - (J * (1 - C_curved));

            console.log("\n[PRUNING DEBUG] Job Domain Specificity (J):", J);
            console.log("[PRUNING DEBUG] Candidate Domain Relevance (Keyword Match):", candidateDomainRelevance);
            console.log("[PRUNING DEBUG] Pruning Multiplier (M):", pruningMultiplier.toFixed(2));
            console.log("[PRUNING DEBUG] Original Candidate Vector:", resumeVector.map(v => v.toFixed(2)));

            prunedResumeVector[0] *= pruningMultiplier;
            prunedResumeVector[1] *= pruningMultiplier;
            prunedResumeVector[2] *= pruningMultiplier;
            prunedResumeVector[7] *= pruningMultiplier;
            
            console.log("[PRUNING DEBUG] Pruned Candidate Vector:", prunedResumeVector.map(v => v.toFixed(2)));
            console.log("[PRUNING DEBUG] Job Vector:", opportunity.jobVector.map(v => v.toFixed(2)));
        }

        // 5. Compute cosine similarity & matchScore
        const similarity = calculateCosineSimilarity(prunedResumeVector, opportunity.jobVector);
        const matchScore = Math.min(Math.max(Math.round(similarity * 100), 0), 100);

        let reasoning = '';
        if (matchScore >= 80) {
            reasoning = 'Exceptional alignment! Your technical skills and problem solving heavily overlap with this role.';
        } else if (matchScore >= 60) {
            reasoning = 'Strong compatibility! You meet core requirements with high relevance in key competencies.';
        } else if (matchScore >= 40) {
            reasoning = 'Moderate compatibility. Good foundational background with potential to bridge remaining requirements.';
        } else {
            reasoning = 'Lower compatibility based on current parsed skills. Consider highlighting related domain projects.';
        }


        // 6. If user already applied, keep the applicant record updated too
        const existingApp = await Applicant.findOne({ userId, opportunityId });
        if (existingApp) {
            existingApp.matchScore = matchScore;
            existingApp.matchScoreCalculated = true;
            existingApp.matchDetails = {
                vectorSimilarity: similarity,
                skillMatchScore: matchScore,
                candidateDomainRelevance,
                pruningMultiplier,
                reasoning
            };
            await existingApp.save();
        }

        return {
            matchScore,
            similarity: Number(similarity.toFixed(3)),
            candidateDomainRelevance,
            pruningMultiplier,
            matchingSkills,
            missingSkills,
            totalRequired: reqSkills.length,
            reasoning,
            resumeTitle: resume?.fileName || (customResumeData ? 'Uploaded Resume' : 'Profile Skills')
        };
    } catch (err) {
        console.error('Error in calculateOpportunityCompatibility:', err);
        throw err;
    }
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
    model: "gemini-3.6-flash"
});

async function evaluateCandidateDomainRelevance(opportunity, parsedResumeData) {
    const prompt = `
You are an AI assistant responsible for analyzing job candidates for a Smart Campus Talent Matching Platform.

Your task is to evaluate the candidate's domain relevance to the specific opportunity domain.
Rate the relevance from 0.0 to 1.0, where:
0.0 means the candidate has NO relevant projects/skills for this specific job's domain.
1.0 means the candidate is highly specialized and experienced in the exact domain required by the job.

Base your judgement on the overlap between the opportunity required skills/description and the candidate's skills and projects.

Opportunity Title: ${opportunity.title}
Opportunity Required Skills: ${opportunity.requiredSkills ? opportunity.requiredSkills.join(", ") : ''}
Job Description: ${opportunity.jobDescription}

Candidate Skills: ${(parsedResumeData.skills || []).join(", ")}
Candidate Projects: 
${(parsedResumeData.projects || []).map(p => `- ${p.title}: ${p.description}`).join('\n')}

Return ONLY valid JSON in this exact structure:
{
  "candidateDomainRelevance": number
}
Do not return markdown or code fences.
`;
    try {
        const result = await model.generateContent(prompt);
        let responseText = result.response.text().trim();
        if (responseText.startsWith('\`\`\`')) {
            responseText = responseText.replace(/^\`\`\`(json)?/, '').replace(/\`\`\`$/, '').trim();
        }
        const parsed = JSON.parse(responseText);
        return parsed.candidateDomainRelevance || 0;
    } catch (e) {
        console.error("Error evaluating candidate domain relevance:", e);
        return 0; // default to 0 on failure
    }
}

async function generateRequirementVector(opportunity) {

    const prompt = `
You are an AI assistant responsible for analyzing job opportunities for a Smart Campus Talent Matching Platform.

Your task is to analyze the complete opportunity details and generate a requirement vector.

The requirement vector consists of the following 10 dimensions.

1. Technical Skills
2. Problem Solving
3. Analytical Ability
4. Communication Skills
5. Teamwork & Collaboration
6. Leadership
7. Initiative & Engagement
8. Domain Specialization
9. Consistency (Long-Term Learning / Continuous Participation)
10. Achievement Level

In addition to the 10 dimensions, also calculate 'jobDomainSpecificity' (0 to 100). 
If this is a highly specialized role (like DevOps, ML Engineer), score it high (81-100). 
If it's a generalist role (Management Trainee, Junior Analyst), score it low (0-30).

For EACH dimension assign a score between 0 and 100.

Scoring Guidelines:

- 0-20   : Not required
- 21-40  : Low importance
- 41-60  : Moderate importance
- 61-80  : High importance
- 81-100 : Extremely important

The scores should reflect how important each dimension is for succeeding in this opportunity.

Base your judgement ONLY on the provided opportunity information.

Opportunity Details:

Title:
${opportunity.title}

Company:
${opportunity.company}

Location:
${opportunity.location}

Opportunity Type:
${opportunity.opportunityType}

Required Skills:
${opportunity.requiredSkills.join(", ")}

Job Description:
${opportunity.jobDescription}

Return ONLY valid JSON in this exact structure:

{
  "vector": {
    "technicalSkills": number,
    "problemSolving": number,
    "analyticalAbility": number,
    "communicationSkills": number,
    "teamworkCollaboration": number,
    "leadership": number,
    "initiativeEngagement": number,
    "domainSpecialization": number,
    "consistency": number,
    "achievementLevel": number
  },
  "jobDomainSpecificity": number
}

Do not return explanations.
Do not return markdown.
Do not return code fences.
Return JSON only.
`;

    const result = await model.generateContent(prompt);
    
    // Clean up potential markdown code fences from the response
    let responseText = result.response.text().trim();
    if (responseText.startsWith('\`\`\`')) {
        responseText = responseText.replace(/^\`\`\`(json)?/, '').replace(/\`\`\`$/, '').trim();
    }

    const parsed = JSON.parse(responseText);

    return { 
        vector: parsed.vector, 
        jobDomainSpecificity: parsed.jobDomainSpecificity 
    };
}

function normalizeRequirementVector(vector) {
    const normalized = {};

    for (const key in vector) {
        normalized[key] = Number((vector[key] / 100).toFixed(2));
    }

    return normalized;
}

const createOpportunityVector = async (req, res) => {
    try {
        const opportunityId = req.body.opportunityId || req.params.id || req.params.opportunityId;

        if (!opportunityId) {
            return res.status(400).json({
                status: 'fail',
                message: 'Opportunity ID is required'
            });
        }

        const opportunity = await Opportunity.findById(opportunityId);
        if (!opportunity) {
            return res.status(404).json({
                status: 'fail',
                message: 'Opportunity not found'
            });
        }

        // Generate requirement vector using Gemini
        const { vector: rawVector, jobDomainSpecificity } = await generateRequirementVector(opportunity);

        // Normalize requirement vector scores (0 to 1)
        const normalizedVector = normalizeRequirementVector(rawVector);

        // Convert normalized vector values to array for jobVector schema field
        const vectorArray = Object.values(normalizedVector);

        // Update opportunity document
        opportunity.jobVector = vectorArray;
        opportunity.jobDomainSpecificity = jobDomainSpecificity / 100;
        opportunity.vectorProcessed = true;
        await opportunity.save();

        return res.status(200).json({
            status: 'success',
            message: 'Opportunity requirement vector generated successfully',
            opportunityId: opportunity._id,
            vectorProcessed: opportunity.vectorProcessed,
            jobVector: opportunity.jobVector,
            jobDomainSpecificity: opportunity.jobDomainSpecificity,
            normalizedVector
        });
    } catch (error) {
        console.error('Error in createOpportunityVector:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to generate opportunity requirement vector',
            details: error.message
        });
    }
};



const createdimension = async (req, res) => {
    try {
        const {
            linkedIn,
            github
        } = req.body;

        if (!github) {
            return res.status(400).json({
                status: 'fail',
                message: 'GitHub username is required'
            });
        }

        const githubData = await getgithubdata(github);

        return res.status(200).json({
            status: 'success',
            data: {
                githubData
            }
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'Something went wrong while fetching GitHub data'
        });
    }
};



function calcRValues(user, linkedin, leetcode) {
    const activities = [];

    /* ---------------------- Resume Projects --------------------- */

    if (user?.resumeDetails?.projects) {

        user.resumeDetails.projects.forEach(project => {

            activities.push({

                source: "resume",

                activityType: "resume_project",

                title: project.title,

                rtype: TYPE_WEIGHTS.resume_project,

                rrole: ROLE_WEIGHTS.developer,

                rachievement: 1.10

            });

        });

    }

    /* -------------------- Linkedin Projects --------------------- */

    if (linkedin?.projects) {

        linkedin.projects.forEach(project => {

            activities.push({

                source: "linkedin",

                activityType: "linkedin_project",

                title: project.title,

                rtype: TYPE_WEIGHTS.linkedin_project,

                rrole: ROLE_WEIGHTS.developer,

                rachievement: 1.10

            });

        });

    }

    /* -------------------- Experience --------------------- */

    if (linkedin?.experience) {

        linkedin.experience.forEach(exp => {

            const role = detectRole(exp.position);

            activities.push({

                source: "linkedin",

                activityType: "internship",

                title: exp.companyName,

                rtype: TYPE_WEIGHTS.internship,

                rrole: ROLE_WEIGHTS[role] || ROLE_WEIGHTS.participant,

                rachievement: internshipAchievement(exp)

            });

        });

    }

    /* --------------------- Certificates --------------------- */

    if (user?.resumeDetails?.certificates) {

        user.resumeDetails.certificates.forEach(cert => {

            activities.push({

                source: "resume",

                activityType: "certificate",

                title: cert.title,

                rtype: TYPE_WEIGHTS.certificate,

                rrole: ROLE_WEIGHTS.participant,

                rachievement: certificateAchievement(cert)

            });

        });

    }

    /* -------------------- Leetcode ---------------------- */

    if (leetcode?.profile) {

        for (let i = 0; i < (leetcode.profile.easySolved || 0); i++) {

            activities.push({

                source: "leetcode",

                activityType: "leetcode_easy",

                rtype: TYPE_WEIGHTS.leetcode_easy,

                rrole: ROLE_WEIGHTS.participant,

                rachievement: leetcodeAchievement("easy")

            });

        }

        for (let i = 0; i < (leetcode.profile.mediumSolved || 0); i++) {

            activities.push({

                source: "leetcode",

                activityType: "leetcode_medium",

                rtype: TYPE_WEIGHTS.leetcode_medium,

                rrole: ROLE_WEIGHTS.participant,

                rachievement: leetcodeAchievement("medium")

            });

        }

        for (let i = 0; i < (leetcode.profile.hardSolved || 0); i++) {

            activities.push({

                source: "leetcode",

                activityType: "leetcode_hard",

                rtype: TYPE_WEIGHTS.leetcode_hard,

                rrole: ROLE_WEIGHTS.participant,

                rachievement: leetcodeAchievement("hard")

            });

        }

    }

    return activities;
}


const getgithubdata = async (githubuserid) => {
    if (!githubuserid) return null;

    const headers = {
        'User-Agent': 'Campus-Connect-Backend',
        'Accept': 'application/vnd.github.v3+json'
    };

    if (GITHUB_TOKEN) {
        headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
    }

    try {
        // 1. Fetch user profile
        const userRes = await fetch(`https://api.github.com/users/${githubuserid}`, { headers });

        if (!userRes.ok) {
            if (userRes.status === 403 && userRes.headers.get('x-ratelimit-remaining') === '0') {
                console.warn(`[GitHub API] Rate limit exceeded. Returning mock fallback data for '${githubuserid}'.`);
                return fallbackMockData(githubuserid);
            }
            if (userRes.status === 404) {
                throw new Error(`GitHub user '${githubuserid}' not found`);
            }
            throw new Error(`GitHub API error: ${userRes.status} ${userRes.statusText}`);
        }

        const profile = await userRes.json();

        // 1.5 Fetch special profile README (from repo with same name as username)
        let profileReadmeContent = null;
        try {
            const profileReadmeRes = await fetch(`https://api.github.com/repos/${githubuserid}/${githubuserid}/readme`, { headers });
            if (profileReadmeRes.ok) {
                const profileReadmeData = await profileReadmeRes.json();
                if (profileReadmeData.content) {
                    profileReadmeContent = Buffer.from(profileReadmeData.content, 'base64').toString('utf-8');
                }
            }
        } catch (err) {
            console.log(`No special profile README found for ${githubuserid}: ${err.message}`);
        }

        // 2. Fetch user repositories
        const reposRes = await fetch(`https://api.github.com/users/${githubuserid}/repos?per_page=100&sort=updated`, { headers });
        if (!reposRes.ok) {
            if (reposRes.status === 403 && reposRes.headers.get('x-ratelimit-remaining') === '0') {
                console.warn(`[GitHub API] Rate limit exceeded during repos fetch. Returning mock fallback data for '${githubuserid}'.`);
                return fallbackMockData(githubuserid);
            }
            throw new Error(`GitHub API repositories fetch error: ${reposRes.status} ${reposRes.statusText}`);
        }
        const repos = await reposRes.json();

        // 3. For each repository, try to get the README content
        const reposWithReadme = await Promise.all(
            repos.map(async (repo) => {
                let readmeContent = null;
                try {
                    const readmeRes = await fetch(`https://api.github.com/repos/${githubuserid}/${repo.name}/readme`, { headers });
                    if (readmeRes.ok) {
                        const readmeData = await readmeRes.json();
                        if (readmeData.content) {
                            // Decode base64 readme content
                            readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');
                        }
                    }
                } catch (err) {
                    // Fail silently or log error for individual repos
                    console.log(`No README or failed to load for ${repo.name}: ${err.message}`);
                }

                return {
                    name: repo.name,
                    description: repo.description,
                    html_url: repo.html_url,
                    language: repo.language,
                    stargazers_count: repo.stargazers_count,
                    forks_count: repo.forks_count,
                    default_branch: repo.default_branch || 'main',
                    readme: readmeContent
                };
            })
        );

        return {
            profile: {
                login: profile.login,
                name: profile.name,
                avatar_url: profile.avatar_url,
                html_url: profile.html_url,
                bio: profile.bio,
                company: profile.company,
                location: profile.location,
                public_repos: profile.public_repos,
                followers: profile.followers,
                following: profile.following,
                profile_readme: profileReadmeContent,
            },
            repositories: reposWithReadme
        };
    } catch (error) {
        if (error.message && error.message.includes('rate limit')) {
            console.warn(`[GitHub API] General rate limit error caught. Returning mock fallback data for '${githubuserid}'.`);
            return fallbackMockData(githubuserid);
        }
        console.error(`Error in getgithubdata for ${githubuserid}:`, error);
        throw error;
    }
};

const getleetcodedata = async (leetcodeuserid, profileOnly = false) => {
    if (!leetcodeuserid) return null;
    const cleanUsername = leetcodeuserid.trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?leetcode\.com\/(u\/)?/, '').replace(/\/$/, '');
    if (!cleanUsername) return null;

    // 1. Try official LeetCode GraphQL API first (fast, reliable, avoids third-party 429 rate limits)
    try {
        const query = `
          query getUserData($username: String!) {
            allQuestionsCount {
              difficulty
              count
            }
            matchedUser(username: $username) {
              username
              githubUrl
              linkedinUrl
              profile {
                realName
                aboutMe
                userAvatar
                reputation
                ranking
                school
                countryName
                company
                skillTags
              }
              submitStats: submitStatsGlobal {
                acSubmissionNum {
                  difficulty
                  count
                  submissions
                }
                totalSubmissionNum {
                  difficulty
                  count
                  submissions
                }
              }
              badges {
                id
                displayName
                icon
                creationDate
              }
              userCalendar {
                streak
                totalActiveDays
                submissionCalendar
              }
            }
            userContestRanking(username: $username) {
              attendedContestsCount
              rating
              globalRanking
              totalParticipants
              topPercentage
              badge {
                name
              }
            }
            recentSubmissionList(username: $username, limit: 15) {
              title
              titleSlug
              timestamp
              statusDisplay
              lang
            }
            matchedUserSkill: matchedUser(username: $username) {
              tagProblemCounts {
                advanced {
                  tagName
                  tagSlug
                  problemsSolved
                }
                intermediate {
                  tagName
                  tagSlug
                  problemsSolved
                }
                fundamental {
                  tagName
                  tagSlug
                  problemsSolved
                }
              }
            }
          }
        `;

        const res = await fetch('https://leetcode.com/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Referer': 'https://leetcode.com',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            body: JSON.stringify({ query, variables: { username: cleanUsername } })
        });

        if (res.ok) {
            const json = await res.json();
            const matched = json?.data?.matchedUser;
            if (matched) {
                const acSubmissions = matched.submitStats?.acSubmissionNum || [];
                const allSolved = acSubmissions.find(s => s.difficulty === 'All')?.count || 0;
                const easySolved = acSubmissions.find(s => s.difficulty === 'Easy')?.count || 0;
                const mediumSolved = acSubmissions.find(s => s.difficulty === 'Medium')?.count || 0;
                const hardSolved = acSubmissions.find(s => s.difficulty === 'Hard')?.count || 0;

                const allQuestions = json?.data?.allQuestionsCount || [];
                const totalAll = allQuestions.find(q => q.difficulty === 'All')?.count || 4051;
                const totalEasy = allQuestions.find(q => q.difficulty === 'Easy')?.count || 964;
                const totalMedium = allQuestions.find(q => q.difficulty === 'Medium')?.count || 2113;
                const totalHard = allQuestions.find(q => q.difficulty === 'Hard')?.count || 974;

                const totalSubmissions = matched.submitStats?.totalSubmissionNum || [];
                const totalAcSubmissions = acSubmissions.find(s => s.difficulty === 'All')?.submissions || 0;
                const totalUserSubmissions = totalSubmissions.find(s => s.difficulty === 'All')?.submissions || 0;
                const acceptanceRate = totalUserSubmissions > 0 ? parseFloat(((totalAcSubmissions / totalUserSubmissions) * 100).toFixed(1)) : null;

                let parsedCalendar = {};
                try {
                    parsedCalendar = matched.userCalendar?.submissionCalendar 
                        ? JSON.parse(matched.userCalendar.submissionCalendar) 
                        : {};
                } catch (e) {}

                const profile = {
                    username: matched.username,
                    name: matched.profile?.realName || '',
                    realName: matched.profile?.realName || '',
                    about: matched.profile?.aboutMe || '',
                    aboutMe: matched.profile?.aboutMe || '',
                    avatar: matched.profile?.userAvatar || '',
                    userAvatar: matched.profile?.userAvatar || '',
                    ranking: matched.profile?.ranking || 0,
                    reputation: matched.profile?.reputation || 0,
                    country: matched.profile?.countryName || '',
                    company: matched.profile?.company || '',
                    school: matched.profile?.school || '',
                    skillTags: matched.profile?.skillTags || [],
                    totalSolved: allSolved,
                    easySolved,
                    mediumSolved,
                    hardSolved,
                    totalQuestions: totalAll,
                    totalEasy,
                    totalMedium,
                    totalHard,
                    acceptanceRate,
                    submissionCalendar: parsedCalendar,
                    recentSubmissions: json.data?.recentSubmissionList || []
                };

                if (profileOnly) {
                    return { profile };
                }

                return {
                    profile,
                    solved: {
                        solvedProblem: allSolved,
                        easySolved,
                        mediumSolved,
                        hardSolved,
                        totalEasy,
                        totalMedium,
                        totalHard,
                        totalQuestions: totalAll,
                        acceptanceRate,
                        totalSubmissionNum: totalSubmissions,
                        acSubmissionNum: acSubmissions
                    },
                    calendar: {
                        streak: matched.userCalendar?.streak || 0,
                        totalActiveDays: matched.userCalendar?.totalActiveDays || 0,
                        submissionCalendar: matched.userCalendar?.submissionCalendar || '{}'
                    },
                    contest: json.data?.userContestRanking || null,
                    badges: matched.badges || [],
                    skills: json.data?.matchedUserSkill?.tagProblemCounts || { fundamental: [], intermediate: [], advanced: [] },
                    submission: json.data?.recentSubmissionList || []
                };
            }
        }
    } catch (graphError) {
        console.warn('Direct LeetCode GraphQL fetch failed, attempting fallback API:', graphError.message);
    }

    // 2. Fallback to alfa-leetcode-api if direct GraphQL failed
    const endpoints = profileOnly ? {
        profile: `https://alfa-leetcode-api.onrender.com/${cleanUsername}/profile`
    } : {
        profile: `https://alfa-leetcode-api.onrender.com/${cleanUsername}/profile`,
        badges: `https://alfa-leetcode-api.onrender.com/${cleanUsername}/badges`,
        solved: `https://alfa-leetcode-api.onrender.com/${cleanUsername}/solved`,
        contest: `https://alfa-leetcode-api.onrender.com/${cleanUsername}/contest`,
        submission: `https://alfa-leetcode-api.onrender.com/${cleanUsername}/submission`,
        calendar: `https://alfa-leetcode-api.onrender.com/${cleanUsername}/calendar`,
        skills: `https://alfa-leetcode-api.onrender.com/${cleanUsername}/skill`,
        languages: `https://alfa-leetcode-api.onrender.com/${cleanUsername}/language`
    };

    try {
        const keys = Object.keys(endpoints);
        const results = await Promise.allSettled(
            keys.map(async (key) => {
                const res = await fetch(endpoints[key]);
                if (!res.ok) {
                    throw new Error(`Failed to fetch ${key}: ${res.statusText}`);
                }
                return res.json();
            })
        );

        const leetcodeData = {};
        keys.forEach((key, index) => {
            const result = results[index];
            if (result.status === 'fulfilled') {
                leetcodeData[key] = result.value;
            } else {
                console.warn(`Error fetching LeetCode data for ${key}:`, result.reason.message);
                leetcodeData[key] = null;
            }
        });

        // Verify that we got at least some basic profile/solved information back
        if (!leetcodeData.profile && !leetcodeData.solved && !profileOnly) {
            throw new Error(`Could not retrieve any profile data for LeetCode user '${cleanUsername}'`);
        } else if (profileOnly && !leetcodeData.profile) {
            throw new Error(`Could not retrieve profile data for LeetCode verification '${cleanUsername}'`);
        }

        return leetcodeData;
    } catch (error) {
        console.error(`Error in getleetcodedata for ${cleanUsername}:`, error.message);
        throw error;
    }
};

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const ACTOR_ID = "harvestapi~linkedin-profile-scraper";

async function getLinkedInData(linkedinUrl) {
    try {
        // linkedinUserId examples:
        // "satyanadella"
        // "karan-gupta-123456789"

        const input = {
            urls: [linkedinUrl]
        };

        // Start Actor
        const runResponse = await fetch(
            `https://api.apify.com/v2/actors/${ACTOR_ID}/runs?token=${APIFY_TOKEN}&waitForFinish=120`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(input)
            }
        );

        const run = await runResponse.json();

        if (!run.data) {
            console.error("Apify Actor Run Response:", run);
            throw new Error(`Actor failed to start: ${run.message || (run.error && run.error.message) || JSON.stringify(run)}`);
        }

        console.log(`Actor Run Status: ${run.data.status}`);
        console.log(`Dataset ID: ${run.data.defaultDatasetId}`);

        const datasetId = run.data.defaultDatasetId;

        // Fetch results
        const datasetResponse = await fetch(
            `https://api.apify.com/v2/datasets/${datasetId}/items?clean=true&token=${APIFY_TOKEN}`
        );

        const profiles = await datasetResponse.json();
        console.log("Dataset items length:", profiles.length);
        console.log("Dataset items:", JSON.stringify(profiles, null, 2));

        if (profiles.length === 0) {
            console.log("Fetching actor run log...");
            const logRes = await fetch(`https://api.apify.com/v2/actor-runs/${run.data.id}/log?token=${APIFY_TOKEN}`);
            if (logRes.ok) {
                const logText = await logRes.text();
                console.log("--- ACTOR RUN LOG ---");
                console.log(logText.slice(-2000)); // Print last 2000 characters of log
                console.log("---------------------");
            }
        }

        return profiles[0] || null;

    } catch (err) {
        console.error("Error in getLinkedInData:", err);
        return null;
    }
}



const fallbackMockData = (githubuserid) => ({
    profile: {
        login: githubuserid,
        name: `${githubuserid} (Mock Profile - Rate Limited)`,
        avatar_url: "https://github.com/identicons/git.png",
        html_url: `https://github.com/api-fallback/${githubuserid}`,
        bio: "This is a mock bio because the GitHub API rate limit was exceeded. Configure GITHUB_TOKEN in your environment to get live data.",
        company: "Mock Company",
        location: "Mock Location",
        public_repos: 2,
        followers: 10,
        following: 10,
        profile_readme: `# Hello, I'm ${githubuserid}!\nThis is a mock special profile README.`,
    },
    repositories: [
        {
            name: "mock-repo-1",
            description: "This is a mock repository description.",
            html_url: `https://github.com/api-fallback/${githubuserid}/mock-repo-1`,
            language: "JavaScript",
            stargazers_count: 5,
            forks_count: 2,
            readme: "# Mock Repo 1\nThis is a mock readme content."
        },
        {
            name: "mock-repo-2",
            description: "Another mock repository description.",
            html_url: `https://github.com/api-fallback/${githubuserid}/mock-repo-2`,
            language: "HTML",
            stargazers_count: 2,
            forks_count: 0,
            readme: "# Mock Repo 2\nThis is another mock readme."
        }
    ]
});

const getLinkedInPosts = async (linkedinUrl) => {
    console.log(`Skipping real LinkedIn posts fetch via Apify for: ${linkedinUrl} (Temporarily disabled)`);
    return [];

    /*
    const APIFY_TOKEN = process.env.APIFY_TOKEN;
    // Replace this ID with the correct one from your Apify store if this actor is deprecated
    const POST_ACTOR_ID = "curious_coder~linkedin-post-scraper";

    if (!APIFY_TOKEN) {
        console.warn('APIFY_TOKEN missing, skipping real post scraping.');
        return [];
    }

    try {
        const input = {
            profileUrls: [linkedinUrl]
        };

        const runResponse = await fetch(
          `https://api.apify.com/v2/actors/${POST_ACTOR_ID}/runs?token=${APIFY_TOKEN}&waitForFinish=120`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input)
          }
        );

        const run = await runResponse.json();
        if (!run.data) {
            throw new Error(`Apify post scraper failed to start: ${JSON.stringify(run)}`);
        }

        const datasetId = run.data.defaultDatasetId;

        const datasetResponse = await fetch(
          `https://api.apify.com/v2/datasets/${datasetId}/items?clean=true&token=${APIFY_TOKEN}`
        );

        const posts = await datasetResponse.json();
        console.log(`Fetched ${posts.length} posts from LinkedIn.`);

        // Map the posts to the generic schema expected by our AI filter
        return posts.map(post => {
            return {
                text: post.text || "",
                images: post.images || [],
                date: post.time || new Date().toISOString()
            };
        }).filter(p => p.text.length > 10);

    } catch (error) {
        console.error('Error fetching LinkedIn posts via Apify:', error);
        return [];
    }
    */
};

const filterAchievementsWithGemini = async (posts) => {
    if (!posts || posts.length === 0) return [];
    if (!process.env.GEMINI_API_KEY) {
        console.warn('GEMINI_API_KEY missing, skipping AI filtering.');
        return [];
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

        const prompt = `
        You are an AI assistant that filters a user's LinkedIn posts to identify purely professional, academic, or technical achievements.
        An achievement is typically: winning a competition/hackathon, completing a certification/course, launching a major project, getting a promotion, or receiving an award.
        It is NOT: general opinions, memes, simple updates (e.g. "having coffee"), or asking questions.
        
        Analyze the following list of posts. For each post that IS a genuine achievement, extract a short, punchy title (max 5 words), a 1-sentence description, the image URL, and the date.
        If a post is NOT an achievement, ignore it completely.

        Return ONLY a JSON array of objects. Do not wrap in markdown \`\`\`json.
        Format:
        [
          { "title": "...", "description": "...", "imageUrl": "...", "date": "..." }
        ]

        POSTS:
        ${JSON.stringify(posts, null, 2)}
        `;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text().trim();
        if (responseText.startsWith('```json')) responseText = responseText.replace(/```json/g, '');
        if (responseText.startsWith('```')) responseText = responseText.replace(/```/g, '');

        const parsed = JSON.parse(responseText);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Error filtering achievements with Gemini:', error);
        return [];
    }
};

const getGithubContributions = async (githubuserid) => {
    if (!githubuserid) return null;
    const cleanLogin = githubuserid.trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '');
    if (!cleanLogin) return null;

    const token = process.env.GITHUB_TOKEN || GITHUB_TOKEN;
    if (!token) {
        console.warn('GITHUB_TOKEN not configured in backend environment.');
        return null;
    }

    const query = `
      query($login: String!) {
        user(login: $login) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                  color
                }
              }
            }
          }
        }
      }
    `;

    try {
        const res = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Campus-Connect-Backend'
            },
            body: JSON.stringify({ query, variables: { login: cleanLogin } })
        });

        if (!res.ok) {
            console.error('Failed to fetch github contributions via GraphQL status:', res.status);
            return null;
        }

        const data = await res.json();
        if (data.errors || !data.data?.user) {
            if (data.errors) console.error('GitHub GraphQL returned errors:', data.errors);
            return null;
        }

        const calendar = data.data.user.contributionsCollection.contributionCalendar;
        const result = [];

        calendar.weeks.forEach(week => {
            week.contributionDays.forEach(day => {
                let level = 0;
                if (day.contributionCount > 0 && day.contributionCount <= 3) level = 1;
                else if (day.contributionCount > 3 && day.contributionCount <= 6) level = 2;
                else if (day.contributionCount > 6 && day.contributionCount <= 9) level = 3;
                else if (day.contributionCount > 9) level = 4;

                result.push({
                    date: day.date,
                    count: day.contributionCount,
                    level: level
                });
            });
        });

        return result;
    } catch (err) {
        console.error('Error fetching github contributions:', err);
        return null;
    }
};

module.exports = {
    createdimension,
    createOpportunityVector,
    generateRequirementVector,
    normalizeRequirementVector,
    evaluateApplicantMatch,
    evaluateApplicantMatchController,
    getgithubdata,
    getleetcodedata,
    getLinkedInData,
    getLinkedInPosts,
    filterAchievementsWithGemini,
    getGithubContributions,
    calculateOpportunityCompatibility
};
