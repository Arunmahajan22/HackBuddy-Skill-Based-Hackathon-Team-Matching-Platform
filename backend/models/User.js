const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sanitizeUrl, stripHtml } = require('../utils/sanitize');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters.'],
      maxlength: [80, 'Name cannot exceed 80 characters.'],
      set: (val) => stripHtml(String(val || '')),
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
      set: (val) => stripHtml(String(val || '')),
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
      set: (val) => stripHtml(String(val || '')),
    },
    github: {
      type: String,
      trim: true,
      maxlength: [255, 'GitHub URL cannot exceed 255 characters.'],
      default: '',
      set: (val) => (val ? sanitizeUrl(val) : ''),
    },
    avatarUrl: {
      type: String,
      trim: true,
      maxlength: [500, 'Avatar URL cannot exceed 500 characters.'],
      default: '',
      set: (val) => (val ? sanitizeUrl(val) : ''),
    },
    linkedin: {
      type: String,
      trim: true,
      maxlength: [255, 'LinkedIn URL cannot exceed 255 characters.'],
      default: '',
      set: (val) => (val ? sanitizeUrl(val) : ''),
    },
    portfolio: {
      type: String,
      trim: true,
      maxlength: [255, 'Portfolio URL cannot exceed 255 characters.'],
      default: '',
      set: (val) => (val ? sanitizeUrl(val) : ''),
    },
    skills: {
      type: [String],
      default: [],
      set: (skills) =>
        Array.isArray(skills)
          ? [...new Set(skills.map((skill) => stripHtml(String(skill).trim())).filter(Boolean))]
          : [],
    },
    interests: {
      type: [String],
      default: [],
      set: (interests) =>
        Array.isArray(interests)
          ? [...new Set(interests.map((interest) => stripHtml(String(interest).trim())).filter(Boolean))]
          : [],
    },
    preferredRoles: {
      type: [String],
      default: [],
      set: (roles) =>
        Array.isArray(roles)
          ? [...new Set(roles.map((role) => stripHtml(String(role).trim())).filter(Boolean))]
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
    hackathonExperience: {
      type: Number,
      min: [0, 'Hackathon experience cannot be negative.'],
      max: [100, 'Hackathon experience is too large.'],
      default: 0,
    },
    // Comprehensive availability information
    availability: {
      status: {
        type: String,
        enum: ['open', 'weekends', 'evenings', 'limited', 'unavailable'],
        default: 'open',
      },
      availableDays: {
        type: [String],
        default: ['Saturday', 'Sunday'],
        set: (days) =>
          Array.isArray(days)
            ? [...new Set(days.map((d) => stripHtml(String(d).trim())).filter(Boolean))]
            : ['Saturday', 'Sunday'],
      },
      timeSlots: {
        type: [String],
        default: ['evenings'],
        set: (slots) =>
          Array.isArray(slots)
            ? [...new Set(slots.map((s) => stripHtml(String(s).trim().toLowerCase())).filter(Boolean))]
            : ['evenings'],
      },
      preferredWorkingHours: {
        type: String,
        trim: true,
        maxlength: [100, 'Preferred working hours cannot exceed 100 characters.'],
        default: '10-20 hrs/week',
        set: (val) => stripHtml(String(val || '')),
      },
      timezone: {
        type: String,
        trim: true,
        maxlength: [50, 'Timezone cannot exceed 50 characters.'],
        default: 'UTC',
        set: (val) => stripHtml(String(val || '')),
      },
    },
    preferredTeamSize: {
      type: Number,
      min: [2, 'Preferred team size must be at least 2.'],
      max: [20, 'Preferred team size cannot exceed 20.'],
      default: 4,
    },
    projects: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
          maxlength: 100,
          set: (val) => stripHtml(String(val || '')),
        },
        description: {
          type: String,
          trim: true,
          maxlength: 500,
          default: '',
          set: (val) => stripHtml(String(val || '')),
        },
        url: {
          type: String,
          trim: true,
          maxlength: 255,
          default: '',
          set: (val) => (val ? sanitizeUrl(val) : ''),
        },
        technologies: {
          type: [String],
          default: [],
          set: (techs) =>
            Array.isArray(techs)
              ? [...new Set(techs.map((t) => stripHtml(String(t).trim())).filter(Boolean))]
              : [],
        },
      },
    ],
    // Updated only when the user's final active socket disconnects.
    lastSeen: {
      type: Date,
      default: null,
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

// Support assigning flat string to availability (e.g. { availability: 'weekends' })
userSchema.pre('validate', function normalizeAvailability() {
  if (typeof this.availability === 'string') {
    const rawStatus = this.availability;
    this.availability = {
      status: ['open', 'weekends', 'evenings', 'limited', 'unavailable'].includes(rawStatus)
        ? rawStatus
        : 'open',
      availableDays: rawStatus === 'weekends' ? ['Saturday', 'Sunday'] : ['Saturday', 'Sunday'],
      timeSlots: rawStatus === 'evenings' ? ['evenings'] : ['evenings'],
      preferredWorkingHours: '10-20 hrs/week',
      timezone: 'UTC',
    };
  }
});

// Indexes
userSchema.index({ skills: 1 });
userSchema.index({ 'availability.status': 1 });

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
