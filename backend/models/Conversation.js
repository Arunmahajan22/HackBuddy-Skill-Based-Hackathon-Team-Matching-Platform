const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
      validate: [(value) => Array.isArray(value) && value.length === 2, 'A direct conversation requires two participants.'],
    },
    // Sorted, immutable pair used to make direct conversations unique under concurrent creates.
    participantKey: { type: String, required: true, unique: true, select: false },
    lastMessage: { type: String, trim: true, maxlength: 2000, default: '' },
    lastMessageAt: { type: Date, default: null },
    lastMessageSender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

conversationSchema.index({ participants: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
