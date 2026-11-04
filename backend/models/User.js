const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters.'],
      maxlength: [80, 'Name cannot exceed 80 characters.'],
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address.'],
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: [8, 'Password must be at least 8 characters.'],
      select: false,
    },
    branch: {
      type: String,
      required: [true, 'Branch / Department is required.'],
      trim: true,
      maxlength: [100, 'Branch cannot exceed 100 characters.'],
    },
    year: {
      type: Number,
      required: [true, 'Academic year is required.'],
      min: [1, 'Year must be at least 1.'],
      max: [10, 'Year cannot exceed 10.'],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters.'],
      default: '',
    },
    github: {
      type: String,
      trim: true,
      maxlength: [255, 'GitHub URL cannot exceed 255 characters.'],
      default: '',
    },
    skills: {
      type: [String],
      default: [],
      set: (skills) =>
        Array.isArray(skills)
          ? [...new Set(skills.map((skill) => String(skill).trim()).filter(Boolean))]
          : [],
    },
    experienceLevel: {
      type: String,
      required: [true, 'Experience level is required.'],
      enum: {
        values: ['beginner', 'intermediate', 'advanced'],
        message: '{VALUE} is not a supported experience level.',
      },
    },
    // Email Authentication & Verification fields
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      select: false,
    },
    verificationTokenExpiresAt: {
      type: Date,
      select: false,
    },
    lastVerificationEmailSentAt: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.verificationToken;
        delete ret.verificationTokenExpiresAt;
        delete ret.lastVerificationEmailSentAt;
        return ret;
      },
    },
  },
);

// Indexes
userSchema.index({ skills: 1 });

// Password hashing hook with 12 salt rounds
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  if (!candidatePassword || !this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Generates a cryptographically secure, random 32-byte hex verification token.
 * Stores the SHA-256 hashed digest in the database and returns the raw unhashed token for the email.
 *
 * @returns {string} Raw unhashed verification token
 */
userSchema.methods.generateVerificationToken = function generateVerificationToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');

  // Store SHA-256 hash in database
  this.verificationToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  // Token expires in 24 hours
  this.verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  this.lastVerificationEmailSentAt = new Date();

  return rawToken;
};

module.exports = mongoose.model('User', userSchema);
