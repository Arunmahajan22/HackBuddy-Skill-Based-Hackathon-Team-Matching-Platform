const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    hackathonName: {
      type: String,
      required: [true, 'Hackathon name is required.'],
      trim: true,
      minlength: [2, 'Hackathon name must be at least 2 characters.'],
      maxlength: [150, 'Hackathon name cannot exceed 150 characters.'],
    },
    description: {
      type: String,
      required: [true, 'Description is required.'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters.'],
      maxlength: [2000, 'Description cannot exceed 2000 characters.'],
    },
    requiredSkills: {
      type: [String],
      required: [true, 'Required skills array is required.'],
      validate: [
        (skills) => Array.isArray(skills) && skills.length > 0,
        'At least one required skill must be specified.',
      ],
      set: (skills) =>
        Array.isArray(skills)
          ? [...new Set(skills.map((skill) => String(skill).trim()).filter(Boolean))]
          : [],
    },
    teamSizeLimit: {
      type: Number,
      required: [true, 'Team size limit is required.'],
      min: [2, 'Team size limit must be at least 2.'],
      max: [20, 'Team size limit cannot exceed 20.'],
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Team creator is required.'],
    },
    members: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: true,
  },
);

// Pre-validate hook: Automatically ensure creator is in the members list
teamSchema.pre('validate', function addCreatorToMembers() {
  if (this.creator && Array.isArray(this.members) && !this.members.some((m) => m.equals(this.creator))) {
    this.members.unshift(this.creator);
  }
});

// Invariant: Member count must never exceed team size limit
teamSchema.path('members').validate(function respectsLimit(members) {
  return members.length <= this.teamSizeLimit;
}, 'Team members cannot exceed the specified team size limit.');

// Indexes for high-throughput query patterns
teamSchema.index({ hackathonName: 'text', description: 'text' });
teamSchema.index({ requiredSkills: 1, createdAt: -1 });
teamSchema.index({ creator: 1, createdAt: -1 });
teamSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Team', teamSchema);
