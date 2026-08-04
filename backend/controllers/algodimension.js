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

    // If opportunity job vector is missing, compute it on-the-fly
    if (!opportunity.jobVector || opportunity.jobVector.length === 0) {
      console.log(`[MATCH EVAL] Opportunity ${opportunityId} missing vector. Generating on-the-fly...`);
      const rawVector = await generateRequirementVector(opportunity);
      const normalizedVector = normalizeRequirementVector(rawVector);
      opportunity.jobVector = Object.values(normalizedVector);
      opportunity.vectorProcessed = true;
      await opportunity.save();
    }

    // 2, 3 & 4. Parse Resume using Gemini if available
    let parsedResumeData = { skills: [], education: [], experience: [], projects: [] };
    const targetResumeUrl = applicant.resumeUrl || user.resumeUrl;

    if (targetResumeUrl && process.env.GEMINI_API_KEY) {
      try {
        const response = await axios.get(targetResumeUrl, { responseType: 'arraybuffer', timeout: 10000 });
        const pdfBuffer = response.data;
        const pdfData = await pdfParse(pdfBuffer);
        const resumeText = pdfData.text || '';

        if (resumeText.trim()) {
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

          const prompt = `
          You are an expert resume parser. I have provided the text extracted from a resume.
          Extract the following information from the resume.
          Return ONLY a valid JSON object matching this schema exactly without markdown wrapping:
          {
            "skills": ["skill1", "skill2"],
            "education": [{"institution": "...", "degree": "...", "startYear": "...", "endYear": "..."}],
            "experience": [{"company": "...", "role": "...", "startDate": "...", "endDate": "...", "description": "..."}],
            "projects": [{"title": "...", "link": "...", "description": "..."}]
          }

          RESUME TEXT:
          ${resumeText}
          `;

          const result = await model.generateContent([prompt]);
          let responseText = result.response.text();
          responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

          try {
            parsedResumeData = JSON.parse(responseText);
          } catch (parseError) {
            console.warn('[MATCH EVAL] Failed to parse Gemini response as JSON:', responseText);
          }
        }
      } catch (resumeErr) {
        console.warn('[MATCH EVAL] Resume fetch/parsing skipped or failed (using profile data):', resumeErr.message);
      }
    }

    // Merge resumeDetails from User document if available
    if (user.resumeDetails) {
      if (user.resumeDetails.skills && user.resumeDetails.skills.length > 0) {
        parsedResumeData.skills = Array.from(new Set([...(parsedResumeData.skills || []), ...user.resumeDetails.skills]));
      }
      if (user.resumeDetails.certificates) {
        parsedResumeData.certificates = user.resumeDetails.certificates;
      }
    }

    // 5 & 6. Merge resume data with user.scrapedData and Compute the 10-dimensional applicant vector
    const applicantVector = computeRuleBasedSkillVector(parsedResumeData, user.scrapedData);

    // 7 & 8. Compute cosine similarity with Opportunity.jobVector & Calculate matchScore
    const similarity = calculateCosineSimilarity(applicantVector, opportunity.jobVector);
    const matchScore = Math.min(Math.max(Math.round(similarity * 100), 0), 100);

    // 9. Populate matchDetails
    applicant.applicantVector = applicantVector;
    applicant.matchScore = matchScore;
    applicant.matchScoreCalculated = true;
    applicant.matchDetails = {
      vectorSimilarity: similarity,
      skillMatchScore: matchScore,
      reasoning: `Matched based on rule-based algorithmic analysis of technical proficiency, problem-solving history, and longitudinal engagement metrics. Similarity score mapped to ${matchScore}%.`
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

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
});

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

Return ONLY valid JSON.

{
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
}

Do not return explanations.
Do not return markdown.
Do not return code fences.
Return JSON only.
`;

    const result = await model.generateContent(prompt);

    const response = result.response.text();

    const vector = JSON.parse(response);

    return vector;
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
        const rawVector = await generateRequirementVector(opportunity);

        // Normalize requirement vector scores (0 to 1)
        const normalizedVector = normalizeRequirementVector(rawVector);

        // Convert normalized vector values to array for jobVector schema field
        const vectorArray = Object.values(normalizedVector);

        // Update opportunity document
        opportunity.jobVector = vectorArray;
        opportunity.vectorProcessed = true;
        await opportunity.save();

        return res.status(200).json({
            status: 'success',
            message: 'Opportunity requirement vector generated successfully',
            opportunityId: opportunity._id,
            vectorProcessed: opportunity.vectorProcessed,
            jobVector: opportunity.jobVector,
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

const getleetcodedata = async (leetcodeuserid) => {
    if (!leetcodeuserid) return null;

    const endpoints = {
        profile: `https://alfa-leetcode-api.onrender.com/${leetcodeuserid}/profile`,
        badges: `https://alfa-leetcode-api.onrender.com/${leetcodeuserid}/badges`,
        solved: `https://alfa-leetcode-api.onrender.com/${leetcodeuserid}/solved`,
        contest: `https://alfa-leetcode-api.onrender.com/${leetcodeuserid}/contest`,
        submission: `https://alfa-leetcode-api.onrender.com/${leetcodeuserid}/submission`,
        calendar: `https://alfa-leetcode-api.onrender.com/${leetcodeuserid}/calendar`,
        skills: `https://alfa-leetcode-api.onrender.com/${leetcodeuserid}/skill`,
        languages: `https://alfa-leetcode-api.onrender.com/${leetcodeuserid}/language`
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
        if (!leetcodeData.profile && !leetcodeData.solved) {
            throw new Error(`Could not retrieve any profile data for LeetCode user '${leetcodeuserid}'`);
        }

        return leetcodeData;
    } catch (error) {
        console.error(`Error in getleetcodedata for ${leetcodeuserid}:`, error);
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
    if (!GITHUB_TOKEN) return null;

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
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Campus-Connect-Backend'
            },
            body: JSON.stringify({ query, variables: { login: githubuserid } })
        });
        
        if (!res.ok) {
            console.error('Failed to fetch github contributions via GraphQL', res.status);
            return null;
        }
        
        const data = await res.json();
        if (data.errors || !data.data?.user) return null;

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
    getGithubContributions
};
