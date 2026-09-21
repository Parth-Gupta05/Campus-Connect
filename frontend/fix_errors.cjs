const fs = require('fs');

// 1. Fix StudentDashboard closing tags
let dashboard = fs.readFileSync('src/pages/StudentDashboard.jsx', 'utf8');
dashboard = dashboard.replace(/<button onClick=\{\(\) => setActiveTab\('identities'\)\} className="text-amber-500 font-semibold hover:underline shrink-0 flex items-center gap-1 cursor-pointer">([\s\S]*?)<\/Link>/g, 
  '<button onClick={() => setActiveTab(\'identities\')} className="text-amber-500 font-semibold hover:underline shrink-0 flex items-center gap-1 cursor-pointer">$1</button>');

dashboard = dashboard.replace(/<button onClick=\{\(\) => setActiveTab\('identities'\)\} className="mt-1 text-xs font-sans text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">([\s\S]*?)<\/Link>/g, 
  '<button onClick={() => setActiveTab(\'identities\')} className="mt-1 text-xs font-sans text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">$1</button>');

dashboard = dashboard.replace(/<button onClick=\{\(\) => setActiveTab\('portfolio'\)\} className="text-xs text-gray-700 hover:text-gray-1000 font-mono hover:underline cursor-pointer">([\s\S]*?)<\/Link>/g, 
  '<button onClick={() => setActiveTab(\'portfolio\')} className="text-xs text-gray-700 hover:text-gray-1000 font-mono hover:underline cursor-pointer">$1</button>');

fs.writeFileSync('src/pages/StudentDashboard.jsx', dashboard);

// 2. Fix ProfileWorkspace imports
let workspace = fs.readFileSync('src/components/profile/ProfileWorkspace.jsx', 'utf8');
workspace = workspace.replace(/\.\.\/components\/profile\//g, './');
fs.writeFileSync('src/components/profile/ProfileWorkspace.jsx', workspace);

console.log('Fixes applied successfully');
