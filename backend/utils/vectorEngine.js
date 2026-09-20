/**
 * Vector Engine
 * Calculates foundational capability scores from external platforms (LeetCode, GitHub)
 * and merges them with verified academic test scores using the "Verified Boost" formula.
 */

// Mapping of the 9 dimensions
// 0: DSA, 1: SQL, 2: PROGRAMMING, 3: OOP, 4: DBMS
// 5: COMPUTER NETWORKS, 6: OPERATING SYSTEMS, 7: APTITUDE, 8: COMMUNICATION

/**
 * Calculates raw capability scores [0-100] based entirely on external platform data.
 * If data is missing for a dimension, returns -1.
 * 
 * @param {Object} scrapedData - The user's scrapedData object from DB
 * @returns {Array<number>} An array of 9 scores.
 */
function calculatePlatformBaseline(scrapedData) {
    const platformVector = Array(9).fill(-1);
    if (!scrapedData) return platformVector;

    // --- 0. DSA (via LeetCode) ---
    if (scrapedData.leetcode && scrapedData.leetcode.solved) {
        const easy = scrapedData.leetcode.solved.easySolved || 0;
        const med = scrapedData.leetcode.solved.mediumSolved || 0;
        const hard = scrapedData.leetcode.solved.hardSolved || 0;
        
        // Weight: Easy=1, Med=2.5, Hard=5. Target score of 400 points = 100% DSA score.
        const weightedPoints = (easy * 1) + (med * 2.5) + (hard * 5);
        let dsaScore = (weightedPoints / 400) * 100;
        
        platformVector[0] = Math.min(Math.round(dsaScore), 100);
    }

    // --- 2. PROGRAMMING (via GitHub) ---
    if (scrapedData.github && scrapedData.github.profile) {
        const repos = scrapedData.github.profile.public_repos || 0;
        const followers = scrapedData.github.profile.followers || 0;
        
        // Target: 20 repos + 10 followers = 100% Programming score
        let progScore = (repos * 4) + (followers * 2);
        
        platformVector[2] = Math.min(Math.round(progScore), 100);
    }

    // --- 8. COMMUNICATION (via LinkedIn - if available) ---
    if (scrapedData.linkedin && scrapedData.linkedin.profile) {
        // Simple proxy: having a detailed linkedin profile
        const connections = scrapedData.linkedin.profile.connections || 0;
        let commScore = (connections / 500) * 100; // 500+ connections = 100 score
        platformVector[8] = Math.min(Math.round(commScore), 100);
    }

    return platformVector;
}

/**
 * Merges the Academic Test Vector with the Platform Baseline Vector using Verified Boost.
 * Formula: Final = Test + (Platform * 0.20) [Capped at 100]
 * 
 * @param {Array<number>} testVector - The 9 scores from the academic assessment (or -1 if unassessed)
 * @param {Array<number>} platformVector - The 9 scores from external platforms (or -1 if missing)
 * @returns {Array<number>} The merged 9-dimensional skillVector
 */
function mergeWithVerifiedBoost(testVector, platformVector) {
    const mergedVector = Array(9).fill(-1);

    for (let i = 0; i < 9; i++) {
        const testScore = testVector[i] !== undefined ? testVector[i] : -1;
        const platformScore = platformVector[i] !== undefined ? platformVector[i] : -1;

        if (testScore === -1 && platformScore === -1) {
            // Neither exists
            mergedVector[i] = -1;
        } else if (testScore === -1 && platformScore !== -1) {
            // No test taken yet, use scaled platform score as a temporary proxy
            // If they only have platform, we shouldn't give them 100% without verified test.
            // Let's cap the pure platform score at 75 to force them to take the test for a perfect score.
            mergedVector[i] = Math.min(Math.round(platformScore), 75);
        } else if (testScore !== -1 && platformScore === -1) {
            // No platform data, rely entirely on the test
            mergedVector[i] = testScore;
        } else {
            // Both exist: Verified Boost!
            const boostedScore = testScore + (platformScore * 0.20);
            mergedVector[i] = Math.min(Math.round(boostedScore), 100);
        }
    }

    return mergedVector;
}

module.exports = {
    calculatePlatformBaseline,
    mergeWithVerifiedBoost
};
