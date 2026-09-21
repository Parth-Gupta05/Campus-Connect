const fs = require('fs');
let content = fs.readFileSync('src/pages/StudentDashboard.jsx', 'utf8');

// 1. Add Import
content = content.replace(
  "import AcademicVaultModal from '../components/AcademicVaultModal';",
  "import AcademicVaultModal from '../components/AcademicVaultModal';\nimport ProfileWorkspace from '../components/profile/ProfileWorkspace';\nimport { FolderGit2, MessageSquare } from 'lucide-react';\n"
);

// 2. Add Tabs to Dashboard Header
const oldTabsEnd = `              <button
                type="button"
                onClick={() => setActiveTab('vault')}
                className={\`pb-3 transition-colors border-b-2 -mb-px cursor-pointer flex items-center gap-1.5 shrink-0 \${
                  activeTab === 'vault'
                    ? 'border-gray-1000 text-gray-1000 font-semibold'
                    : 'border-transparent text-gray-700 hover:text-gray-1000'
                }\`}
              >
                <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Resume Vault</span>
                <span className={\`px-1.5 py-0.2 rounded-full font-mono text-[10px] \${
                  resumes.length >= 5 
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold' 
                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                }\`}>
                  {resumes.length}/5
                </span>
              </button>
            </div>`;

const newTabsEnd = `              <button
                type="button"
                onClick={() => setActiveTab('vault')}
                className={\`pb-3 transition-colors border-b-2 -mb-px cursor-pointer flex items-center gap-1.5 shrink-0 \${
                  activeTab === 'vault'
                    ? 'border-gray-1000 text-gray-1000 font-semibold'
                    : 'border-transparent text-gray-700 hover:text-gray-1000'
                }\`}
              >
                <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Resume Vault</span>
                <span className={\`px-1.5 py-0.2 rounded-full font-mono text-[10px] \${
                  resumes.length >= 5 
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold' 
                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                }\`}>
                  {resumes.length}/5
                </span>
              </button>
              <div className="w-px h-5 bg-gray-400 mx-2 hidden md:block"></div>
              <button
                type="button"
                onClick={() => setActiveTab('portfolio')}
                className={\`pb-3 transition-colors border-b-2 -mb-px cursor-pointer flex items-center gap-1.5 shrink-0 \${activeTab === 'portfolio'
                    ? 'border-gray-1000 text-gray-1000 font-semibold'
                    : 'border-transparent text-gray-700 hover:text-gray-1000'
                  }\`}
              >
                <FolderGit2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Portfolio &amp; Career</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('honors')}
                className={\`pb-3 transition-colors border-b-2 -mb-px cursor-pointer flex items-center gap-1.5 shrink-0 \${activeTab === 'honors'
                    ? 'border-gray-1000 text-gray-1000 font-semibold'
                    : 'border-transparent text-gray-700 hover:text-gray-1000'
                  }\`}
              >
                <Award className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Honors &amp; Credentials</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('placements')}
                className={\`pb-3 transition-colors border-b-2 -mb-px cursor-pointer flex items-center gap-1.5 shrink-0 \${activeTab === 'placements'
                    ? 'border-gray-1000 text-gray-1000 font-semibold'
                    : 'border-transparent text-gray-700 hover:text-gray-1000'
                  }\`}
              >
                <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Placement Stories</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('identities')}
                className={\`pb-3 transition-colors border-b-2 -mb-px cursor-pointer flex items-center gap-1.5 \${activeTab === 'identities'
                    ? 'border-gray-1000 text-gray-1000 font-semibold'
                    : 'border-transparent text-gray-700 hover:text-gray-1000'
                  }\`}
              >
                <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Verification</span>
              </button>
            </div>`;

content = content.replace(oldTabsEnd, newTabsEnd);

// 3. Render ProfileWorkspace
const oldEnd = `        </div>
      </div>
    </>
  );
}`;

const newEnd = `        </div>
        
        {/* Profile Tabs Content */}
        {['portfolio', 'honors', 'placements', 'identities'].includes(activeTab) && (
          <ProfileWorkspace activeDashboardTab={activeTab} />
        )}
      </div>
    </>
  );
}`;

content = content.replace(oldEnd, newEnd);

// 4. Remove Profile link in the header action button block
// Since the Profile is now in Dashboard, the "Go to Profile" button is redundant. We should replace it with "Public Profile".
const oldProfileLink = `                <Link
                  to="/profile"
                  className="h-8 px-3 rounded-md bg-gray-1000 text-background-100 hover:opacity-90 text-xs font-medium transition-opacity flex items-center gap-1 shadow-xs"
                >
                  <span>Profile</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>`;

const newProfileLink = `                <Link
                  to={\`/student/\${profile?.uid}\`}
                  target="_blank"
                  rel="noreferrer"
                  className="h-8 px-3 rounded-md bg-gray-1000 text-background-100 hover:opacity-90 text-xs font-medium transition-opacity flex items-center gap-1 shadow-xs"
                >
                  <span>Public Profile</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </Link>`;

content = content.replace(oldProfileLink, newProfileLink);

fs.writeFileSync('src/pages/StudentDashboard.jsx', content);
console.log('StudentDashboard updated successfully');
