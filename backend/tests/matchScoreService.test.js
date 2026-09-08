const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateMatchScore } = require('../services/matchScoreService');

const profile = (overrides = {}) => ({ skills: [], interests: [], preferredRoles: [], experienceLevel: 'intermediate', ...overrides });

test('complementary frontend and backend skills outrank identical skills', () => {
  const frontend = profile({ skills: ['React', 'TypeScript'], preferredRoles: ['frontend'] });
  const backend = profile({ skills: ['Node.js', 'MongoDB'], preferredRoles: ['backend'] });
  const identical = profile({ skills: ['React', 'TypeScript'], preferredRoles: ['frontend'] });
  const complementary = calculateMatchScore(frontend, backend);
  const overlap = calculateMatchScore(frontend, identical);
  assert.ok(complementary.matchScore > overlap.matchScore);
  assert.ok(complementary.reasons.some((reason) => reason.includes('Complementary')));
});

test('shared interests produce an explainable score contribution', () => {
  const result = calculateMatchScore(profile({ interests: ['AI', 'Climate'] }), profile({ interests: ['ai', 'Fintech'] }));
  assert.ok(result.matchScore >= 20);
  assert.ok(result.reasons.some((reason) => reason.includes('Shared interest in AI')));
});

test('no common interests does not invent an interest reason', () => {
  const result = calculateMatchScore(profile({ interests: ['Health'] }), profile({ interests: ['Gaming'] }));
  assert.ok(!result.reasons.some((reason) => reason.includes('Shared interest')));
});

test('missing skills remains safe and bounded', () => {
  const result = calculateMatchScore(profile({ skills: undefined }), profile({ skills: undefined }));
  assert.ok(result.matchScore >= 0 && result.matchScore <= 100);
  assert.deepEqual(result.strongestComplementarySkills, []);
});

test('empty profiles result in zero rather than a misleading match', () => {
  const result = calculateMatchScore({ skills: [], interests: [], preferredRoles: [] }, { skills: [], interests: [], preferredRoles: [] });
  assert.equal(result.matchScore, 0);
  assert.deepEqual(result.reasons, []);
});

test('a candidate collection can be sorted by descending score', () => {
  const current = profile({ skills: ['React'], preferredRoles: ['frontend'] });
  const candidates = [profile({ skills: ['React'] }), profile({ skills: ['Node.js'], preferredRoles: ['backend'] }), profile({ skills: ['Figma'], preferredRoles: ['design'] })];
  const scores = candidates.map((candidate) => calculateMatchScore(current, candidate).matchScore).sort((a, b) => b - a);
  assert.ok(scores[0] >= scores[1] && scores[1] >= scores[2]);
});
