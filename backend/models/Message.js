const mongoose = require('mongoose');
const { stripHtml } = require('../utils/sanitize');

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
      set: (val) => stripHtml(String(val || '')),
    },
    readAt: { type: Date, default: null },
    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ team: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, readAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
