const fs = require('fs');
const content = fs.readFileSync('src/pages/StudentProfile.jsx', 'utf-8');

function extractTab(startStr, endStr, componentName) {
  let startIdx = content.indexOf(startStr);
  if (startIdx === -1) {
    console.error(`Could not find start for ${componentName}`);
    return;
  }
  // move back to the start of the comment block
  startIdx = content.lastIndexOf('{/*', startIdx);
  
  let endIdx = content.indexOf(endStr, startIdx + 100); // look for the next TAB or the end
  if (endIdx === -1) {
    // If not found, look for the end of the main section
    endIdx = content.indexOf('</main>', startIdx);
    if (endIdx === -1) {
      console.error(`Could not find end for ${componentName}`);
      return;
    }
  } else {
    // move back to just before the next comment block
    endIdx = content.lastIndexOf('{/*', endIdx);
    if (endIdx === -1 || endIdx < startIdx) {
      endIdx = content.indexOf(endStr, startIdx + 100); // fallback
    }
  }

  let tabCode = content.substring(startIdx, endIdx);
  
  // Try to remove the outer {activeTab === ... && ( ... )}
  tabCode = tabCode.replace(/\{activeTab === '[^']+' && \(\s*([\s\S]*?)\s*\)\}/, '$1');
  
  fs.writeFileSync(`src/components/profile/${componentName}.jsx`, 
    `import React from 'react';\nimport { Link } from 'react-router-dom';\nimport { MessageSquare, Code2, Briefcase, GraduationCap, FolderGit2, ExternalLink, Award, ShieldCheck, CheckCircle2, Download, FileSpreadsheet, Plus } from 'lucide-react';\nimport { FaGithub, FaLinkedin } from 'react-icons/fa';\nimport { SiLeetcode } from 'react-icons/si';\nimport RichContentRenderer from '../RichContentRenderer';\nimport { formatExternalUrl } from '../../utils/profileUtils';\n\nexport default function ${componentName}({ profile, skills, experience, education, projects, achievements, about, missingSections, profileStrength, userPlacementPosts, setShowEditor, setSelectedAchievement, setLinkingAccount, handleGenerateCodeAndVerify }) {\n  return (\n    <>\n${tabCode}\n    </>\n  );\n}`
  );
  console.log(`Extracted ${componentName}`);
}

extractTab(
  "TAB 1: PORTFOLIO & CAREER",
  "TAB 2: HONORS",
  "PortfolioTab"
);

extractTab(
  "TAB 2: HONORS",
  "TAB 3: PLACEMENT STORIES",
  "HonorsTab"
);

extractTab(
  "TAB 3: PLACEMENT STORIES",
  "TAB 4: CONNECTED IDENTITIES",
  "PlacementsTab"
);

extractTab(
  "TAB 4: CONNECTED IDENTITIES",
  "</Layout>",
  "VerificationTab"
);
