require('dotenv').config();
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const TYPE_WEIGHTS = {
    certificate: 0.90,
    online_course: 1.00,

    resume_project: 1.10,
    github_repository: 1.15,
    linkedin_project: 1.20,

    leetcode_easy: 1.00,
    leetcode_medium: 1.15,
    leetcode_hard: 1.35,

    internship: 1.35,
    open_source: 1.40,
    freelance: 1.45,
    research_paper: 1.55,
    patent: 1.70,
    startup: 1.80
};

const ROLE_WEIGHTS = {
    participant: 1.00,
    contributor: 1.10,
    team_member: 1.20,
    developer: 1.25,
    core_member: 1.30,
    maintainer: 1.35,
    team_lead: 1.45,
    project_lead: 1.55,
    organizer: 1.60,
    founder: 1.70
};

function githubAchievement(repo) {

    let value = 1.0;

    const stars = repo.stargazers_count || 0;
    const forks = repo.forks_count || 0;

    if (stars >= 500) value = 1.60;
    else if (stars >= 101) value = 1.40;
    else if (stars >= 51) value = 1.25;
    else if (stars >= 11) value = 1.15;
    else if (stars >= 1) value = 1.05;

    if (forks >= 50)
        value += 0.10;
    else if (forks >= 10)
        value += 0.05;

    if (repo.readme)
        value += 0.05;

    return Number(value.toFixed(2));
}

function leetcodeAchievement(level) {

    switch (level) {
        case "easy":
            return 1.00;

        case "medium":
            return 1.20;

        case "hard":
            return 1.45;

        default:
            return 1.00;
    }

}

function certificateAchievement(cert) {

    const issuer = (cert.issuer || "").toLowerCase();

    if (
        issuer.includes("google") ||
        issuer.includes("aws") ||
        issuer.includes("microsoft") ||
        issuer.includes("oracle") ||
        issuer.includes("ibm")
    )
        return 1.35;

    return 1.10;

}

function internshipAchievement(exp) {

    if (
        exp.description &&
        exp.description.toLowerCase().includes("ppo")
    )
        return 1.30;

    return 1.00;

}

function detectRole(text = "") {

    text = text.toLowerCase();

    if (text.includes("founder")) return "founder";

    if (text.includes("organizer")) return "organizer";

    if (text.includes("project lead")) return "project_lead";

    if (text.includes("team lead")) return "team_lead";

    if (text.includes("maintainer")) return "maintainer";

    if (text.includes("core")) return "core_member";

    if (text.includes("developer")) return "developer";

    if (text.includes("contributor")) return "contributor";

    if (text.includes("member")) return "team_member";

    return "participant";

}

function calcRValues({ github, linkedin, leetcode, user }) {

    const activities = [];

    /* ----------------------- Github ---------------------- */

    if (github?.repositories) {

        github.repositories.forEach(repo => {

            activities.push({

                source: "github",

                activityType: "github_repository",

                title: repo.name,

                rtype: TYPE_WEIGHTS.github_repository,

                rrole: ROLE_WEIGHTS.maintainer,

                rachievement: githubAchievement(repo)

            });

        });

    }

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

                rrole: ROLE_WEIGHTS[role],

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

module.exports = calcRValues;

const createdimension = async (req, res) => {
    try {

    } catch (error) {

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

module.exports = {
    createdimension,
    getgithubdata,
    getleetcodedata,
    getLinkedInData
};
