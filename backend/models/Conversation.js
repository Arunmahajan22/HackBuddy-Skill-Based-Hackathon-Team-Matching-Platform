const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['direct', 'team'],
      default: 'direct',
      index: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
      index: true,
    },
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
      validate: [
        function (value) {
          if (!Array.isArray(value)) return false;
          if (this.type === 'direct') {
            return value.length === 2;
          }
          return value.length >= 1;
        },
        'A conversation must have valid participants.',
      ],
    },
    // Sorted, immutable pair used to make direct conversations unique under concurrent creates.
    participantKey: {
      type: String,
      unique: true,
      sparse: true,
      select: false,
    },
    lastMessage: { type: String, trim: true, maxlength: 2000, default: '' },
    lastMessageAt: { type: Date, default: null },
    lastMessageSender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

conversationSchema.index({ participants: 1, lastMessageAt: -1 });
conversationSchema.index({ type: 1, team: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
