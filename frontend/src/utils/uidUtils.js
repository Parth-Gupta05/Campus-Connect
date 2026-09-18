export const BRANCH_MAPPING = {
  COMP: "B.E. Computer Engineering",
  IT: "B.E. Information Technology",
  AIDS: "B.Tech Artificial Intelligence and Data Science",
  AIML: "B.Tech Artificial Intelligence and Machine Learning",
  MECH: "B.E. Mechanical Engineering",
  MME: "B.E - Mechanical and Mechatronics Engineering (Additive Manufacturing)",
  IOT: "B.Tech Computer Science & Engineering(IoT)",
  CIVIL: "B.E. Civil Engineering",
  EXTC: "B.E. Electronics and Telecommunication Engineering",
  ECS: "B.E. Electronics and Computer Science",
  CSE: "B.E. Computer Science and Engineering (Cyber Security)"
};

export const BRANCHES = Object.values(BRANCH_MAPPING);

export const calculateYearFromSem = (currentSem) => {
  if (currentSem <= 2) return 'FE';
  if (currentSem <= 4) return 'SE';
  if (currentSem <= 6) return 'TE';
  return 'BE';
};

export const parseUID = (uid) => {
  if (!uid) return null;
  const match = uid.match(/^(\d{2})-([A-Za-z]+)([A-Za-z])(\d+)-(\d{2})$/);
  if (!match) return null;

  const admissionYear = '20' + match[1];
  const shortCode = match[2].toUpperCase();
  const division = match[3].toUpperCase();
  const rollNo = match[4];
  const graduationYear = '20' + match[5];

  const fullBranch = BRANCH_MAPPING[shortCode] || shortCode;

  const currentYearFull = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11
  
  const yearsDiff = currentYearFull - parseInt(admissionYear);
  let currentSem = 1;

  if (currentMonth >= 6) { // Assuming July onwards is odd semester
    currentSem = (yearsDiff * 2) + 1;
  } else {
    currentSem = (yearsDiff * 2);
  }

  // Bound it just in case
  if (currentSem > 8) currentSem = 8;
  if (currentSem < 1) currentSem = 1;

  let currentYear = calculateYearFromSem(currentSem);

  return {
    admissionYear,
    graduationYear,
    shortCode,
    branch: fullBranch,
    division,
    rollNo,
    currentYear,
    currentSem
  };
};

export const generateUID = (profileData) => {
  if (!profileData) return '';
  const { admissionYear, branch, division, rollNo, graduationYear } = profileData;
  
  // Find short code from branch
  const entry = Object.entries(BRANCH_MAPPING).find(([key, val]) => val === branch);
  const shortCode = entry ? entry[0] : profileData.shortCode || 'UNK';

  const adYY = admissionYear.toString().slice(-2);
  const gradYY = graduationYear.toString().slice(-2);
  const div = division.toUpperCase().charAt(0);
  
  return `${adYY}-${shortCode}${div}${rollNo}-${gradYY}`;
};
