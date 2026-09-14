/**
 * AICTE Activity Points Calculation Engine & Category Definitions
 * Based on the Official AICTE Activity Point Programme guidelines & Club Matrix Ledgers.
 */

// Official 15 AICTE Activity Categories from the AICTE Activity Book
const AICTE_CATEGORIES = [
  {
    id: 1,
    title: 'Helping local schools to achieve good results',
    shortTitle: 'School Education Support',
    maxPoints: 20,
    description: 'Tutoring local students, organizing STEM workshops, improving library or lab facilities in local schools.'
  },
  {
    id: 2,
    title: 'Preparing actionable business proposal for enhancing village income',
    shortTitle: 'Village Business Proposal',
    maxPoints: 20,
    description: 'Developing practical micro-enterprise and entrepreneurial blueprints for rural communities.'
  },
  {
    id: 3,
    title: 'Developing Sustainable Water management system',
    shortTitle: 'Water Conservation',
    maxPoints: 20,
    description: 'Rainwater harvesting, watershed management, rejuvenation of local ponds and water bodies.'
  },
  {
    id: 4,
    title: 'Tourism Promotion/Innovation',
    shortTitle: 'Tourism Innovation',
    maxPoints: 20,
    description: 'Promoting eco-tourism, cultural heritage mapping, digital guides and tourism app development.'
  },
  {
    id: 5,
    title: 'Promotion of Appropriate Technologies',
    shortTitle: 'Technology Promotion',
    maxPoints: 20,
    description: 'Workshops, hackathons, seminars, hands-on tech demos, and technical literacy sessions.'
  },
  {
    id: 6,
    title: 'Reduction in Energy Consumption',
    shortTitle: 'Energy Conservation',
    maxPoints: 20,
    description: 'Energy audits, solar power awareness, promoting energy-efficient appliances and green practices.'
  },
  {
    id: 7,
    title: 'To Skill rural population',
    shortTitle: 'Rural Skill Development',
    maxPoints: 20,
    description: 'Vocational training, computer literacy camps, digital tools orientation for rural youth.'
  },
  {
    id: 8,
    title: 'Facilitating 100% Digitized money transactions',
    shortTitle: 'Digital Financial Literacy',
    maxPoints: 20,
    description: 'Promoting UPI, digital banking safety, cyber fraud awareness, and merchant onboarding.'
  },
  {
    id: 9,
    title: 'Setting of information imparting system for agriculture',
    shortTitle: 'Agri-Tech Information',
    maxPoints: 20,
    description: 'Weather advisory portals, market pricing alerts, smart irrigation methods for local farmers.'
  },
  {
    id: 10,
    title: 'Developing & managing efficient garbage disposal systems',
    shortTitle: 'Waste Management',
    maxPoints: 20,
    description: 'Campus composting, e-waste drives, plastic recycling drives, waste segregation awareness.'
  },
  {
    id: 11,
    title: 'To assist the marketing of rural produce',
    shortTitle: 'Rural Marketing Help',
    maxPoints: 20,
    description: 'E-commerce listing for local artisans and farmers, branding, packaging, supply chain support.'
  },
  {
    id: 12,
    title: 'Food preservation/packaging',
    shortTitle: 'Food Preservation',
    maxPoints: 20,
    description: 'Training in safe food storage, dehydration, hygienic packaging, reducing post-harvest wastage.'
  },
  {
    id: 13,
    title: 'Automation of local activities',
    shortTitle: 'Local Automation',
    maxPoints: 20,
    description: 'Software, IoT devices, or scripts automating manual processes for campus, labs, or community.'
  },
  {
    id: 14,
    title: 'Spreading public awareness under rural outreach program',
    shortTitle: 'Rural Outreach Awareness',
    maxPoints: 20,
    description: 'Health hygiene drives, tree plantation campaigns, social welfare awareness initiatives.'
  },
  {
    id: 15,
    title: 'Contribution to any national level initiative of Government of India',
    shortTitle: 'National Initiatives',
    maxPoints: 20,
    description: 'Swachh Bharat, Digital India, Unnat Bharat Abhiyan, Fit India, or disaster relief campaigns.'
  }
];

// Per-club custom hierarchy overrides for clubs with bespoke titles
const CLUB_CUSTOM_HIERARCHIES = {
  'CSI': {
    'Core': 'Core',
    'WC': 'WC',
    'Creative WC': 'WC',
    'Technical WC': 'WC',
    'Webmaster': 'Core',
    'Lead': 'Core',
    'Co-Lead': 'Core'
  }
};

/**
 * Resolves a member's functional tier ('Core', 'WC', or 'Member')
 * Supports explicit tiers, club-specific hardcoded overrides, and smart keyword detection.
 */
function resolveMemberTier(clubName = '', roleTitle = '', explicitTier = null) {
  if (explicitTier && ['Core', 'WC', 'Member'].includes(explicitTier)) {
    return explicitTier;
  }

  const role = (roleTitle || '').trim();
  const cleanRole = role.toLowerCase();

  // Check per-club overrides
  const clubOverrides = CLUB_CUSTOM_HIERARCHIES[clubName] || {};
  if (clubOverrides[role]) return clubOverrides[role];

  // Core indicators: Executive leadership & Core Committee
  if (/core|president|lead|co-lead|head|chairperson|secretary|treasurer|director|convenor|executive|officer/i.test(cleanRole)) {
    return 'Core';
  }

  // Working Committee (WC) indicators
  if (/wc|working committee|associate|coordinator|committee/i.test(cleanRole)) {
    return 'WC';
  }

  return 'Member';
}

/**
 * Calculates AICTE points and hours awarded:
 * - 4 hours of event = 1 AICTE point
 * - Events <= 4 hours are rounded up to 1 point (no decimal points)
 * - Events > 4 hours: ceil(durationHours / 4)
 * - Multiplier:
 *     - Core Member: 2x (auto-attendance without QR)
 *     - Working Committee (WC): 2x (upon QR check-in)
 *     - Member / General Attendee: 1x (upon QR check-in)
 */
function calculateAictePoints(durationHours, tier = 'Member') {
  const hours = Math.max(0.5, Number(durationHours) || 2);
  const isDouble = tier === 'Core' || tier === 'WC';
  const multiplier = isDouble ? 2 : 1;

  // Ceiling division: <= 4 hrs = 1 pt, 5-8 hrs = 2 pts, 9-12 hrs = 3 pts...
  const basePoints = Math.max(1, Math.ceil(hours / 4));
  const finalPoints = basePoints * multiplier;
  const recordedHours = hours * multiplier;

  return {
    rawHours: hours,
    recordedHours,
    basePoints,
    multiplier,
    points: finalPoints
  };
}

/**
 * Calculates which academic semester a student was in on a given event date
 * based on their university admission year.
 */
function calculateSemesterForDate(admissionYearStr, eventDate) {
  if (!admissionYearStr) return { sem: 1, label: 'FE Sem I', year: 'FE' };

  const admYear = parseInt(admissionYearStr, 10);
  const dateObj = new Date(eventDate);
  const eventYear = dateObj.getFullYear();
  const eventMonth = dateObj.getMonth(); // 0 (Jan) - 11 (Dec)

  const yearsDiff = Math.max(0, eventYear - admYear);
  let sem = 1;

  // July-Dec: Odd semester ((yearsDiff * 2) + 1)
  // Jan-June: Even semester (yearsDiff * 2)
  if (eventMonth >= 6) {
    sem = (yearsDiff * 2) + 1;
  } else {
    sem = Math.max(1, yearsDiff * 2);
  }

  // Cap semester between 1 and 8
  sem = Math.min(8, Math.max(1, sem));

  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][sem - 1];
  let year = 'FE';
  if (sem <= 2) year = 'FE';
  else if (sem <= 4) year = 'SE';
  else if (sem <= 6) year = 'TE';
  else year = 'BE';

  return {
    sem,
    label: `${year} Sem ${roman}`,
    year,
    roman
  };
}

module.exports = {
  AICTE_CATEGORIES,
  CLUB_CUSTOM_HIERARCHIES,
  resolveMemberTier,
  calculateAictePoints,
  calculateSemesterForDate
};
