/**
 * Explainable, deterministic teammate compatibility scoring. This is pure business
 * logic so it is inexpensive to unit test and never depends on a client-provided score.
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

const ROLE_LABELS = { frontend: 'Frontend', backend: 'Backend', ai: 'AI/ML', design: 'Design', devops: 'DevOps', mobile: 'Mobile', blockchain: 'Blockchain' };
const normalize = (value) => String(value || '').trim().toLowerCase();
const unique = (values) => [...new Set(values.map(normalize).filter(Boolean))];
const displayName = { ai: 'AI', ml: 'ML', 'ai/ml': 'AI/ML', 'ai / ml': 'AI/ML', 'ui/ux': 'UI/UX', ux: 'UX', ui: 'UI', 'node.js': 'Node.js', mongodb: 'MongoDB', postgresql: 'PostgreSQL', typescript: 'TypeScript', javascript: 'JavaScript', graphql: 'GraphQL', github: 'GitHub', devops: 'DevOps' };
const title = (value) => displayName[normalize(value)] || String(value).replace(/\b\w/g, (letter) => letter.toUpperCase());

const rolesFor = (profile) => {
  const values = unique([...(profile.skills || []), ...(profile.preferredRoles || [])]);
  return Object.entries(ROLE_SKILLS).filter(([, terms]) => terms.some((term) => values.includes(term))).map(([role]) => role);
};

const shared = (first, second) => first.filter((item) => second.includes(item));
const levelDistance = (first, second) => Math.abs(['beginner', 'intermediate', 'advanced'].indexOf(normalize(first)) - ['beginner', 'intermediate', 'advanced'].indexOf(normalize(second)));

const calculateMatchScore = (currentUser, candidate) => {
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

  // Roles absent from the current profile are deliberately valued more than overlap.
  if (complementaryRoles.length) {
    score += Math.min(50, complementaryRoles.length * 25);
    const own = currentRoles[0] ? ROLE_LABELS[currentRoles[0]] : title(currentSkills[0] || 'your');
    const theirs = ROLE_LABELS[complementaryRoles[0]];
    reasons.push(`Complementary ${own} + ${theirs} strengths`);
  }
  const complementarySkills = candidateSkills.filter((skill) => !currentSkills.includes(skill)).slice(0, 3);
  if (complementarySkills.length && currentSkills.length) {
    score += Math.min(10, complementarySkills.length * 3);
    reasons.push(`Brings ${complementarySkills.slice(0, 2).map(title).join(' and ')} to your stack`);
  }
  if (sharedInterests.length) {
    score += Math.min(20, sharedInterests.length * 10);
    reasons.push(`Shared interest in ${sharedInterests.slice(0, 2).map(title).join(' and ')}`);
  }
  if (sharedSkills.length) {
    // Some shared fluency helps collaboration but never dominates complementary roles.
    score += Math.min(5, sharedSkills.length * 2);
    reasons.push(`Shared ${sharedSkills.slice(0, 2).map(title).join(' and ')} foundation`);
  }
  if (currentUser.experienceLevel && candidate.experienceLevel) {
    const distance = levelDistance(currentUser.experienceLevel, candidate.experienceLevel);
    const experiencePoints = distance === 0 ? 10 : distance === 1 ? 8 : 4;
    score += experiencePoints;
    reasons.push(distance === 0 ? 'Similar experience level for smooth collaboration' : 'Compatible experience levels for peer learning');
  }

  return {
    matchScore: Math.max(0, Math.min(100, Math.round(score))),
    reasons: reasons.slice(0, 4),
    strongestComplementarySkills: complementarySkills.map(title),
  };
};

module.exports = { calculateMatchScore, rolesFor };
