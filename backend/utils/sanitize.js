/**
 * Input sanitization and XSS mitigation utilities.
 * Defense-in-depth protection for user-submitted content.
 */

// Strip HTML tags and dangerous markup
const stripHtml = (value) => {
  if (typeof value !== 'string') return '';
  return value
    // Remove script tags and contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove style tags and contents
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove generic HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove dangerous inline event handlers like onerror=, onload=
    .replace(/on\w+\s*=/gi, '')
    // Remove null bytes and control characters
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
};

/**
 * Validates and sanitizes a URL.
 * Only allows http and https protocols.
 * Disallows javascript:, data:, vbscript: pseudo-protocols.
 */
const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  // Reject javascript:, data:, vbscript:, etc.
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
    return '';
  }
  // Require valid http:// or https:// prefix
  if (/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(trimmed)) {
    return trimmed;
  }
  return '';
};

/**
 * Sanitizes plain text content (e.g. chat messages, notes, bios).
 */
const sanitizeText = (text, maxLength = 2000) => {
  if (typeof text !== 'string') return '';
  const cleaned = stripHtml(text);
  return cleaned.slice(0, maxLength);
};

/**
 * Sanitizes an array of string items (e.g. skills, interests).
 */
const sanitizeStringArray = (arr, maxItems = 50, maxItemLength = 50) => {
  if (!Array.isArray(arr)) return [];
  const cleaned = arr
    .map((item) => stripHtml(String(item || '')))
    .filter(Boolean)
    .slice(0, maxItems)
    .map((item) => item.slice(0, maxItemLength));
  return [...new Set(cleaned)];
};

module.exports = {
  stripHtml,
  sanitizeUrl,
  sanitizeText,
  sanitizeStringArray,
};
