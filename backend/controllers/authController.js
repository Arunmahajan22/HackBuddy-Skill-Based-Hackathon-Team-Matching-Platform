const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Precomputed dummy bcrypt hash (12 rounds) to prevent user-enumeration timing attacks
const DUMMY_HASH = '$2a$12$e88yP2G8h4HhX6r5hD6aJeR39W34P0E7Y2rX32W99s7779X31W89G';

/**
 * Signs a JWT for a user ID.
 */
const createToken = (userId) =>
  jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Attaches the auth cookie and returns the unified response.
 */
const respondWithAuth = (res, user, statusCode) => {
  const token = createToken(user._id.toString());
  const isProduction = process.env.NODE_ENV === 'production';

  // Set secure HTTP-only cookie (immune to JavaScript XSS access)
  res.cookie('hackbuddy_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });

  const userData = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
  delete userData.password;

  return res.status(statusCode).json({
    success: true,
    token,
    user: userData,
  });
};

/**
 * Register a new builder profile.
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, branch, year, bio, github, skills, interests, preferredRoles, experienceLevel } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail }).lean();
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      branch,
      year,
      bio,
      github,
      skills: Array.isArray(skills) ? skills : [],
      interests: Array.isArray(interests) ? interests : [],
      preferredRoles: Array.isArray(preferredRoles) ? preferredRoles : [],
      experienceLevel,
    });

    return respondWithAuth(res, user, 201);
  } catch (error) {
    return next(error);
  }
};

/**
 * Login with email and password (with timing-attack defense).
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    // Constant-time execution defense: always execute bcrypt.compare
    if (!user) {
      await bcrypt.compare(password || '', DUMMY_HASH);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    return respondWithAuth(res, user, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Rehydrate session for authenticated client.
 */
exports.getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

/**
 * Logout and clear HTTP-only auth cookie.
 */
exports.logout = (_req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('hackbuddy_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};
