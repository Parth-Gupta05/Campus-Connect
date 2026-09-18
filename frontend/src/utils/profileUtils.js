export const calculateProfileCompleteness = (profile) => {
  const missingSections = [];
  const rd = profile.resumeDetails || {};
  
  const skills = rd.skills || [];
  const experience = rd.experience || [];
  const projects = rd.projects || [];
  const achievements = rd.achievements || [];
  const certificates = rd.certificates || [];
  const education = rd.education || [];

  const hasCertificates = certificates.length > 0;
  const hasIncompleteCerts = certificates.some((c) => !c.isComplete);

  // Core Resume sections
  if (skills.length === 0) missingSections.push('Skills');
  if (experience.length === 0) missingSections.push('Experience');
  if (projects.length === 0) missingSections.push('Projects');
  if (achievements.length === 0 && (!hasCertificates || hasIncompleteCerts)) {
    missingSections.push('Achievements/Certificates');
  }

  // Education constraint: must have the 3 default levels filled
  const requiredDegrees = ['High School (10th Std)', '11th and 12th or Diploma', 'Undergrad Degree'];
  let hasAllRequiredEducation = true;
  
  for (const requiredDegree of requiredDegrees) {
    const found = education.find(e => 
      e.degree === requiredDegree && 
      e.institution && e.institution.trim() !== '' && 
      e.duration && e.duration.trim() !== ''
    );
    if (!found) {
      hasAllRequiredEducation = false;
      missingSections.push(`Education: ${requiredDegree}`);
    }
  }

  // Integrations constraints
  if (!profile.githubVerified) missingSections.push('GitHub Connection');
  if (!profile.leetcodeVerified) missingSections.push('LeetCode Connection');
  if (!profile.uid) missingSections.push('Student UID');

  // We explicitly IGNORE portfolioUrl for completion

  // Calculate percentage
  let profileStrength = 0;
  
  // Weights (Total 100%)
  if (skills.length > 0) profileStrength += 10;
  if (experience.length > 0) profileStrength += 10;
  if (projects.length > 0) profileStrength += 15;
  if (achievements.length > 0 || (hasCertificates && !hasIncompleteCerts)) profileStrength += 10;
  
  if (hasAllRequiredEducation) {
    profileStrength += 25; // Massive chunk for completing all 3 required education fields
  } else {
    // Partial points for education fields filled
    const validEduCount = education.filter(e => 
      requiredDegrees.includes(e.degree) && 
      e.institution && e.institution.trim() !== '' && 
      e.duration && e.duration.trim() !== ''
    ).length;
    profileStrength += (validEduCount * 8); // e.g. 8 + 8 + 8 = 24 roughly
  }

  if (profile.githubVerified) profileStrength += 10;
  if (profile.leetcodeVerified) profileStrength += 10;
  if (profile.uid) profileStrength += 10;

  // Cap at 100
  if (profileStrength > 100) profileStrength = 100;

  return { profileStrength, missingSections };
};
