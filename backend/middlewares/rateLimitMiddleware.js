const rateLimit = require('express-rate-limit');

/**
 * Standard rate limiter helper returning consistent JSON errors.
 */
const createLimiter = (options) =>
  rateLimit({
    standardHeaders: 'draft-7', // returns RateLimit-* headers per IETF draft
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        message: options.message || 'Too many requests. Please try again later.',
      });
    },
    ...options,
  });

/**
 * Global rate limiter across all API routes.
 * 300 requests per 15 minutes per IP.
 */
const globalApiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many API requests from this IP. Please try again in 15 minutes.',
});

/**
 * Strict rate limiter for sensitive authentication endpoints (login/register).
 * Defeats brute force and credential stuffing attacks (15 attempts per 15 min).
 */
const authRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many login or registration attempts. Please wait 15 minutes before trying again.',
});

/**
 * Action rate limiter for write operations (creating teams, sending requests).
 * Prevents spamming and database exhaustion (30 actions per 15 min).
 */
const actionRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'You have submitted too many requests recently. Please slow down.',
});

module.exports = {
  globalApiLimiter,
  authRateLimiter,
  actionRateLimiter,
};
