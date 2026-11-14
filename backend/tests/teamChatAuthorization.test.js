const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const {
  cleanMessage,
  assertObjectId,
} = require('../services/chatService');
const { extractAvailability } = require('../services/matchScoreService');

test('cleanMessage strips script tags, dangerous HTML, and preserves clean text', () => {
  const malicious = '<script>alert("hacked")</script>Hey team, let us meet on Discord!<img src=x onerror=alert(1)>';
  const cleaned = cleanMessage(malicious);
  assert.equal(cleaned, 'Hey team, let us meet on Discord!');
  assert.ok(!cleaned.includes('<script>'));
  assert.ok(!cleaned.includes('onerror'));
});

test('cleanMessage rejects empty or whitespace-only messages', () => {
  assert.throws(() => cleanMessage(''), {
    message: 'Message cannot be empty.',
  });
  assert.throws(() => cleanMessage('   '), {
    message: 'Message cannot be empty.',
  });
  assert.throws(() => cleanMessage('<script></script>'), {
    message: 'Message cannot be empty.',
  });
});

test('cleanMessage rejects oversized messages exceeding 2000 characters', () => {
  const giant = 'a'.repeat(2001);
  assert.throws(() => cleanMessage(giant), {
    message: /cannot exceed 2000 characters/,
  });
});

test('assertObjectId rejects invalid MongoDB ObjectIds', () => {
  assert.throws(() => assertObjectId('not-a-valid-id', 'test identifier'), {
    message: 'Invalid test identifier.',
  });
  assert.doesNotThrow(() => assertObjectId(new mongoose.Types.ObjectId().toString()));
});

test('extractAvailability extracts availability from string or object correctly', () => {
  const fromString = extractAvailability({ availability: 'weekends' });
  assert.equal(fromString.status, 'weekends');
  assert.deepEqual(fromString.availableDays, ['Saturday', 'Sunday']);

  const fromObject = extractAvailability({
    availability: {
      status: 'evenings',
      availableDays: ['Monday', 'Wednesday', 'Friday'],
      timeSlots: ['evenings'],
      preferredWorkingHours: '20 hrs/week',
      timezone: 'EST',
    },
  });
  assert.equal(fromObject.status, 'evenings');
  assert.deepEqual(fromObject.availableDays, ['Monday', 'Wednesday', 'Friday']);
  assert.deepEqual(fromObject.timeSlots, ['evenings']);
  assert.equal(fromObject.preferredWorkingHours, '20 hrs/week');
  assert.equal(fromObject.timezone, 'EST');
});
