/**
 * Front-end safe URL sanitizer.
 * Guarantees external links only use http or https protocols.
 * Prevents javascript:, data:, or malformed URI execution vectors in anchor hrefs.
 */
export const getSafeUrl = (url) => {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim();
  if (/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(trimmed)) {
    return trimmed;
  }
  return '#';
};
