/**
 * Explainable, deterministic teammate compatibility scoring.
 * Evaluates technical skills, complementary roles, shared interests,
 * experience level, and availability / schedule compatibility.
 */
const ROLE_SKILLS = {
  frontend: ['react', 'next.js', 'nextjs', 'vue', 'angular', 'javascript', 'typescript', 'html', 'css', 'tailwind', 'tailwind css'],
  backend: ['node', 'node.js', 'express', 'mongodb', 'postgres', 'postgresql', 'sql', 'graphql', 'java', 'go', 'django', 'flask'],
  ai: ['ai', 'ai/ml', 'ai / ml', 'machine learning', 'ml', 'pytorch', 'tensorflow', 'data science', 'python'],
  design: ['ui/ux', 'ui', 'ux', 'figma', 'product design', 'design'],
  devops: ['docker', 'aws', 'azure', 'gcp', 'kubernetes', 'ci/cd', 'devops'],
  mobile: ['react native', 'flutter', 'android', 'ios', 'swift', 'kotlin'],
  blockchain: ['solidity', 'web3', 'ethereum', 'blockchain'],
};

const ROLE_LABELS = {
  frontend: 'Frontend',
  backend: 'Backend',
  ai: 'AI/ML',
  design: 'Design',
  devops: 'DevOps',
  mobile: 'Mobile',
  blockchain: 'Blockchain',
};

const normalize = (value) => String(value || '').trim().toLowerCase();
const unique = (values) => [...new Set((values || []).map(normalize).filter(Boolean))];

const displayName = {
  ai: 'AI',
  ml: 'ML',
  'ai/ml': 'AI/ML',
  'ai / ml': 'AI/ML',
  'ui/ux': 'UI/UX',
  ux: 'UX',
  ui: 'UI',
  'node.js': 'Node.js',
  mongodb: 'MongoDB',
  postgresql: 'PostgreSQL',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  graphql: 'GraphQL',
  github: 'GitHub',
  devops: 'DevOps',
};

const title = (value) => displayName[normalize(value)] || String(value).replace(/\b\w/g, (letter) => letter.toUpperCase());

const rolesFor = (profile) => {
  const values = unique([...(profile.skills || []), ...(profile.preferredRoles || [])]);
  return Object.entries(ROLE_SKILLS)
    .filter(([, terms]) => terms.some((term) => values.includes(term)))
    .map(([role]) => role);
};

const shared = (first, second) => first.filter((item) => second.includes(item));
const levelDistance = (first, second) =>
  Math.abs(
    ['beginner', 'intermediate', 'advanced'].indexOf(normalize(first)) -
    ['beginner', 'intermediate', 'advanced'].indexOf(normalize(second))
  );

/**
 * Extracts and normalizes availability object from user profile.
 * Supports both string enum ('open', 'weekends') and nested availability subdocuments.
 */
const extractAvailability = (user = {}) => {
  if (!user || !user.availability) {
    return {
      status: 'open',
      availableDays: [],
      timeSlots: [],
      preferredWorkingHours: '',
      timezone: 'UTC',
    };
  }

  if (typeof user.availability === 'string') {
    return {
      status: normalize(user.availability) || 'open',
      availableDays: user.availability === 'weekends' ? ['Saturday', 'Sunday'] : [],
      timeSlots: user.availability === 'evenings' ? ['evenings'] : [],
      preferredWorkingHours: '',
      timezone: 'UTC',
    };
  }

  const raw = user.availability;
  return {
    status: normalize(raw.status) || 'open',
    availableDays: Array.isArray(raw.availableDays)
      ? raw.availableDays.map(title).filter(Boolean)
      : [],
    timeSlots: Array.isArray(raw.timeSlots)
      ? raw.timeSlots.map(normalize).filter(Boolean)
      : [],
    preferredWorkingHours: String(raw.preferredWorkingHours || '').trim(),
    timezone: String(raw.timezone || 'UTC').trim(),
  };
};

const calculateMatchScore = (currentUser = {}, candidate = {}) => {
  const currentSkills = unique(currentUser.skills || []);
  const candidateSkills = unique(candidate.skills || []);
  const currentInterests = unique(currentUser.interests || []);
  const candidateInterests = unique(candidate.interests || []);
  const currentRoles = rolesFor(currentUser);
  const candidateRoles = rolesFor(candidate);
  const complementaryRoles = candidateRoles.filter((role) => !currentRoles.includes(role));
  const sharedSkills = shared(currentSkills, candidateSkills);
  const sharedInterests = shared(currentInterests, candidateInterests);

  const reasons = [];
  let score = 0;

  const hasBaseProfile =
    currentSkills.length > 0 ||
    candidateSkills.length > 0 ||
    currentInterests.length > 0 ||
    candidateInterests.length > 0 ||
    currentRoles.length > 0 ||
    candidateRoles.length > 0;

  // 1. Complementary Roles (Valued highest for hackathon diversity)
  if (complementaryRoles.length) {
    score += Math.min(45, complementaryRoles.length * 22);
    const own = currentRoles[0] ? ROLE_LABELS[currentRoles[0]] : title(currentSkills[0] || 'your');
    const theirs = ROLE_LABELS[complementaryRoles[0]];
    reasons.push(`Complementary ${own} + ${theirs} strengths`);
  }

  // 2. Complementary Skills (Distinct technologies brought to stack)
  const complementarySkills = candidateSkills.filter((skill) => !currentSkills.includes(skill)).slice(0, 3);
  if (complementarySkills.length && currentSkills.length) {
    score += Math.min(10, complementarySkills.length * 3);
    reasons.push(`Brings ${complementarySkills.slice(0, 2).map(title).join(' and ')} to your stack`);
  }

  // 3. Shared Hackathon Interests
  if (sharedInterests.length) {
    score += Math.min(18, sharedInterests.length * 9);
    reasons.push(`Shared interest in ${sharedInterests.slice(0, 2).map(title).join(' and ')}`);
  }

  // 4. Shared Technical Skills (Baseline fluency)
  if (sharedSkills.length) {
    score += Math.min(5, sharedSkills.length * 2);
    reasons.push(`Shared ${sharedSkills.slice(0, 2).map(title).join(' and ')} foundation`);
  }

  // 5. Experience Level Compatibility
  if (currentUser.experienceLevel && candidate.experienceLevel && hasBaseProfile) {
    const distance = levelDistance(currentUser.experienceLevel, candidate.experienceLevel);
    const experiencePoints = distance === 0 ? 8 : distance === 1 ? 6 : 3;
    score += experiencePoints;
    reasons.push(
      distance === 0
        ? 'Similar experience level for smooth collaboration'
        : 'Compatible experience levels for peer learning',
    );
  }

  // 6. Availability & Schedule Compatibility
  const userAvail = extractAvailability(currentUser);
  const candAvail = extractAvailability(candidate);

  const sharedDays = userAvail.availableDays.filter((d) =>
    candAvail.availableDays.some((cd) => normalize(cd) === normalize(d)),
  );
  const sharedTimeSlots = userAvail.timeSlots.filter((s) => candAvail.timeSlots.includes(s));

  if (hasBaseProfile) {
    if (candAvail.status === 'unavailable') {
      score = Math.max(0, score - 30);
      reasons.push('Candidate is currently marked as unavailable');
    } else {
      // Status matching bonus
      if (userAvail.status === candAvail.status && candAvail.status !== 'limited') {
        score += 8;
        if (candAvail.status === 'weekends') {
          reasons.push('Both prioritize weekend hackathon sprints');
        } else if (candAvail.status === 'evenings') {
          reasons.push('Both prefer evening collaboration sessions');
        } else if (candAvail.status === 'open') {
          reasons.push('Both actively open to collaborate');
        }
      } else if (candAvail.status === 'open' || userAvail.status === 'open') {
        score += 4;
      }

      // Shared available days
      if (sharedDays.length >= 2) {
        score += 8;
        reasons.push(`Shared availability on ${sharedDays.slice(0, 3).join(', ')}`);
      } else if (sharedDays.length === 1) {
        score += 4;
        reasons.push(`Overlapping schedule on ${sharedDays[0]}`);
      }

      // Shared time slots
      if (sharedTimeSlots.length >= 1) {
        score += 6;
        reasons.push(`Matching working hours (${sharedTimeSlots.map(title).join(', ')})`);
      }
    }
  }

  const availabilityMatch = {
    status: candAvail.status,
    isAvailable: candAvail.status !== 'unavailable',
    sharedDays,
    sharedTimeSlots: sharedTimeSlots.map(title),
    preferredWorkingHours: candAvail.preferredWorkingHours || '10-20 hrs/week',
    timezone: candAvail.timezone || 'UTC',
  };

  return {
    matchScore: Math.max(0, Math.min(100, Math.round(score))),
    reasons: reasons.slice(0, 6),
    strongestComplementarySkills: complementarySkills.map(title),
    availabilityMatch,
  };
};

module.exports = {
  calculateMatchScore,
  rolesFor,
  extractAvailability,
};
