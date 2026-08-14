const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Request sender is required.'],
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: [true, 'Target team is required.'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'accepted', 'rejected'],
        message: '{VALUE} is not a valid request status.',
      },
      default: 'pending',
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters.'],
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
// 1. Invariant: A user can only send one request per team
requestSchema.index({ sender: 1, team: 1 }, { unique: true });

// 2. Query indexes for creator and candidate dashboards
requestSchema.index({ team: 1, createdAt: -1 });
requestSchema.index({ sender: 1, createdAt: -1 });
requestSchema.index({ team: 1, status: 1 });

module.exports = mongoose.model('Request', requestSchema);
