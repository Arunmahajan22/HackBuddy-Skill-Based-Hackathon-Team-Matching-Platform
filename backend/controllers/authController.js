const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/emailService');

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
const respondWithAuth = (res, user, statusCode, customMessage) => {
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
  delete userData.verificationToken;
  delete userData.verificationTokenExpiresAt;
  delete userData.lastVerificationEmailSentAt;

  return res.status(statusCode).json({
    success: true,
    message: customMessage,
    token,
    user: userData,
  });
};

/**
 * Register a new builder profile and send email verification.
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, branch, year, bio, github, skills, experienceLevel } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail }).lean();
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const user = new User({
      name,
      email: normalizedEmail,
      password,
      branch,
      year,
      bio,
      github,
      skills: Array.isArray(skills) ? skills : [],
      experienceLevel,
      isVerified: false,
    });

    // Generate secure email verification token (stored as SHA-256 hash in DB)
    const rawVerificationToken = user.generateVerificationToken();
    await user.save();

    // Send verification email via Nodemailer
    try {
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        token: rawVerificationToken,
      });
    } catch (emailError) {
      console.error('Failed to send verification email during registration:', emailError.message);
      // We still return 201 so user exists and can click "Resend verification" if needed
    }

    return res.status(201).json({
      success: true,
      message:
        'Registration successful! A verification email has been sent to your inbox. Please verify your email before logging in.',
      requiresVerification: true,
      email: user.email,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Verify user email address with cryptographically secure token.
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    const token = req.params.token || req.body.token;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        code: 'TOKEN_REQUIRED',
        message: 'A verification token is required.',
      });
    }

    // Hash incoming raw token with SHA-256 to compare against stored hash
    const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const user = await User.findOne({
      verificationToken: hashedToken,
    }).select('+verificationToken +verificationTokenExpiresAt');

    if (!user) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_TOKEN',
        message: 'Invalid or already used verification link. If you are already verified, please sign in.',
      });
    }

    // Check token expiration (24h)
    if (user.verificationTokenExpiresAt && user.verificationTokenExpiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'This verification link has expired. Please request a new verification email.',
        email: user.email,
      });
    }

    // Mark email as verified and invalidate token
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save({ validateBeforeSave: false });

    // Automatically authenticate the user upon successful verification
    return respondWithAuth(res, user, 200, 'Email verified successfully! Welcome to HackBuddy.');
  } catch (error) {
    return next(error);
  }
};

/**
 * Resend email verification link with rate limiting & cooldown protection.
 */
exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.',
      });
    }

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+verificationToken +verificationTokenExpiresAt +lastVerificationEmailSentAt',
    );

    // Generic success message to prevent user enumeration attacks
    const genericSuccessResponse = {
      success: true,
      message:
        'If an unverified account exists with that email address, a new verification link has been sent.',
    };

    if (!user) {
      return res.status(200).json(genericSuccessResponse);
    }

    if (user.isVerified) {
      return res.status(200).json({
        success: true,
        message: 'This account has already been verified. You can sign in directly.',
        alreadyVerified: true,
      });
    }

    // 60-second cooldown per account
    const COOLDOWN_MS = 60 * 1000;
    if (user.lastVerificationEmailSentAt) {
      const elapsed = Date.now() - new Date(user.lastVerificationEmailSentAt).getTime();
      if (elapsed < COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).json({
          success: false,
          code: 'COOLDOWN_ACTIVE',
          message: `Please wait ${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'} before requesting another verification email.`,
          cooldownSeconds: remainingSeconds,
        });
      }
    }

    // Generate new token & invalidate previous one
    const rawVerificationToken = user.generateVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send email
    try {
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        token: rawVerificationToken,
      });
    } catch (emailError) {
      console.error('Failed to resend verification email:', emailError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to send email. Please check your SMTP settings or try again later.',
      });
    }

    return res.status(200).json(genericSuccessResponse);
  } catch (error) {
    return next(error);
  }
};

/**
 * Login with email and password (with timing-attack defense & verification check).
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

    // Check if account email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Your email address has not been verified yet. Please check your inbox or request a new verification link.',
        isVerified: false,
        email: user.email,
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
