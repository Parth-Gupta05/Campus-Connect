const { getgithubdata, getleetcodedata, getLinkedInData } = require("./backend/controllers/algodimension");
const fs = require('fs').promises;

async function run() {
    try {
        // Fetch and save GitHub data
        const githubData = await getgithubdata("Shreevathsa05");
        await fs.writeFile('data.txt', JSON.stringify(githubData, null, 2), 'utf-8');
        console.log("GitHub data saved to data.txt successfully.");

        // Fetch and save LeetCode data
        // const leetcodeData = await getleetcodedata("karangupta_2111");
        // await fs.writeFile('leetdata.txt', JSON.stringify(leetcodeData, null, 2), 'utf-8');
        // console.log("LeetCode data saved to leetdata.txt successfully.");

        // Fetch and save LinkedIn data
        const linkedinData = await getLinkedInData("https://www.linkedin.com/in/asmit-bagkar-79a2a4303/");
        await fs.writeFile('linkedindata.txt', JSON.stringify(linkedinData, null, 2), 'utf-8');
        console.log("LinkedIn data saved to linkedindata.txt successfully.");
    } catch (error) {
        console.error("Error executing test:", error);
    }
}

run();

