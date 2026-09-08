const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true, enum: ['join_request', 'request_accepted', 'request_rejected', 'chat_message', 'team_invitation', 'email_verification', 'system'] },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    relatedEntity: {
      entityType: { type: String, trim: true, maxlength: 50, default: '' },
      entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
      link: { type: String, trim: true, maxlength: 300, default: '' },
    },
    readAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

notificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
