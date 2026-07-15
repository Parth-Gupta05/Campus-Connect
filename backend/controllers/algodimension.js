require('dotenv').config();
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
    getleetcodedata
};
