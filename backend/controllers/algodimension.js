require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

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

module.exports = {
    createdimension,
    getgithubdata,
    getleetcodedata,
    getLinkedInData,
    getLinkedInPosts,
    filterAchievementsWithGemini
};
