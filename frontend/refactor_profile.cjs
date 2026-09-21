const fs = require('fs');

let content = fs.readFileSync('src/components/profile/ProfileWorkspace.jsx', 'utf8');

// 1. Add ProfileHeader import
content = content.replace(
  "import VerificationSection from './VerificationSection';",
  "import VerificationSection from './VerificationSection';\nimport ProfileHeader from './ProfileHeader';"
);

// 2. Change function signature
content = content.replace(
  "export default function ProfileWorkspace() {",
  "export default function ProfileWorkspace({ activeDashboardTab }) {"
);

// 3. Remove activeTab state
content = content.replace(
  "  const [activeTab, setActiveTab] = useState('portfolio');\n",
  ""
);

// 4. Replace main container opening and header section
const oldHeaderStart = `      {/* Main Container */}
      <main className="flex-1 min-w-0">

        <div className="max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-8">

          {/* ===================================================================
              PROFILE HEADER & IDENTITY OVERVIEW
              =================================================================== */}`;

const newHeaderStart = `      {/* Main Container */}
      <div className="w-full space-y-8">
        {/* Modals and Overlays are rendered globally within this component */}
        {activeDashboardTab !== 'overview' && activeDashboardTab !== 'coding' && activeDashboardTab !== 'campus' && activeDashboardTab !== 'vault' && (
          <ProfileHeader
            profile={profile}
            education={education}
            uploadingAvatar={uploadingAvatar}
            handleAvatarUpload={handleAvatarUpload}
            setShowEditor={setShowEditor}
            handleShareProfile={handleShareProfile}
            setShowPdf={setShowPdf}
          />
        )}`;

content = content.replace(oldHeaderStart, newHeaderStart);

// 5. Remove the entire `<section>` containing the old header and the old tab bar
// The easiest way is to use regex or string indexing
const sectionStart = content.indexOf('<section className="rounded-xl border border-gray-400 bg-background-200 p-6 shadow-2xs space-y-6">');
if (sectionStart !== -1) {
  const tabStart = content.indexOf('{/* ===================================================================\n              TAB 1: PORTFOLIO & CAREER', sectionStart);
  if (tabStart !== -1) {
    content = content.substring(0, sectionStart) + content.substring(tabStart);
  }
}

// 6. Replace activeTab references with activeDashboardTab
content = content.replace(/{activeTab === 'portfolio' && \(/g, "{activeDashboardTab === 'portfolio' && (");
content = content.replace(/{activeTab === 'honors' && \(/g, "{activeDashboardTab === 'honors' && (");
content = content.replace(/{activeTab === 'placements' && \(/g, "{activeDashboardTab === 'placements' && (");
content = content.replace(/{activeTab === 'identities' && \(/g, "{activeDashboardTab === 'identities' && (");

// 7. Fix closing tags
content = content.replace(
  `        </div>
      </main>
    </>
  );
}`,
  `      </div>
    </>
  );
}`
);

fs.writeFileSync('src/components/profile/ProfileWorkspace.jsx', content);
console.log('ProfileWorkspace updated successfully');
