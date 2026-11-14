const test = require('node:test');
const assert = require('node:assert/strict');
const { stripHtml, sanitizeUrl, sanitizeText, sanitizeStringArray } = require('../utils/sanitize');

test('stripHtml neutralizes malicious script and html tags', () => {
  const malicious = '<script>alert("xss")</script>Hello <b>World</b><img src=x onerror="alert(1)">';
  const clean = stripHtml(malicious);
  assert.equal(clean, 'Hello World');
  assert.ok(!clean.includes('<script>'));
  assert.ok(!clean.includes('onerror'));
  assert.ok(!clean.includes('alert'));
});

test('sanitizeUrl strictly blocks javascript: and pseudo-protocols', () => {
  assert.equal(sanitizeUrl('javascript:alert(document.cookie)'), '');
  assert.equal(sanitizeUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='), '');
  assert.equal(sanitizeUrl('vbscript:msgbox("xss")'), '');
  assert.equal(sanitizeUrl('https://github.com/developer'), 'https://github.com/developer');
  assert.equal(sanitizeUrl('http://portfolio.dev'), 'http://portfolio.dev');
});

test('sanitizeText removes control characters and bounds length', () => {
  const textWithControl = 'Clean\u0000Text\u001FWith\u0007Controls';
  const cleaned = sanitizeText(textWithControl, 30);
  assert.equal(cleaned, 'CleanTextWithControls');
});

test('sanitizeStringArray strips HTML and deduplicates entries', () => {
  const input = ['<script>xss</script>React', 'Node.js', 'React', '<b>Node.js</b>'];
  const cleaned = sanitizeStringArray(input);
  assert.deepEqual(cleaned, ['React', 'Node.js']);
});
