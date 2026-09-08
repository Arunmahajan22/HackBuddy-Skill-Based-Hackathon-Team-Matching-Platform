const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    avatarUrl: { type: String, trim: true, maxlength: [500, 'Avatar URL cannot exceed 500 characters.'], default: '' },
    linkedin: { type: String, trim: true, maxlength: [255, 'LinkedIn URL cannot exceed 255 characters.'], default: '' },
    portfolio: { type: String, trim: true, maxlength: [255, 'Portfolio URL cannot exceed 255 characters.'], default: '' },
    skills: {
      type: [String],
      default: [],
      set: (skills) =>
        Array.isArray(skills)
          ? [...new Set(skills.map((skill) => String(skill).trim()).filter(Boolean))]
          : [],
    },
    interests: {
      type: [String],
      default: [],
      set: (interests) => Array.isArray(interests)
        ? [...new Set(interests.map((interest) => String(interest).trim()).filter(Boolean))]
        : [],
    },
    preferredRoles: {
      type: [String],
      default: [],
      set: (roles) => Array.isArray(roles)
        ? [...new Set(roles.map((role) => String(role).trim()).filter(Boolean))]
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
    hackathonExperience: { type: Number, min: [0, 'Hackathon experience cannot be negative.'], max: [100, 'Hackathon experience is too large.'], default: 0 },
    availability: { type: String, enum: ['open', 'weekends', 'evenings', 'limited', 'unavailable'], default: 'open' },
    preferredTeamSize: { type: Number, min: [2, 'Preferred team size must be at least 2.'], max: [20, 'Preferred team size cannot exceed 20.'], default: 4 },
    projects: [{
      title: { type: String, required: true, trim: true, maxlength: 100 },
      description: { type: String, trim: true, maxlength: 500, default: '' },
      url: { type: String, trim: true, maxlength: 255, default: '' },
      technologies: { type: [String], default: [] },
    }],
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

module.exports = mongoose.model('User', userSchema);
