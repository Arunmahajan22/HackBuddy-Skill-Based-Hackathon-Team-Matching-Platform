const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { assertObjectId, assertParticipant, getOrCreateConversation, otherParticipant, sendMessage } = require('../services/chatService');
const { createNotification } = require('../services/notificationService');

const userFields = 'name branch year skills experienceLevel lastSeen';
const formatConversation = (conversation, currentUserId, unreadCount = 0, isOnline = false) => {
  const otherUser = conversation.participants.find((participant) => participant._id.toString() !== currentUserId.toString());
  return {
    _id: conversation._id,
    otherUser,
    lastMessage: conversation.lastMessage || '',
    lastMessageAt: conversation.lastMessageAt,
    lastMessageSender: conversation.lastMessageSender,
    unreadCount,
    isOnline,
  };
};

exports.createConversation = async (req, res, next) => {
  try {
    const conversation = await getOrCreateConversation(req.user._id, req.body.userId);
    const populated = await Conversation.findById(conversation._id).populate('participants', userFields).lean();
    return res.status(200).json({ success: true, conversation: formatConversation(populated, req.user._id, 0, req.app.get('io')?.isUserOnline(otherParticipant(populated, req.user._id))) });
  } catch (error) { return next(error); }
};

exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', userFields)
      .sort({ lastMessageAt: -1, updatedAt: -1 }).lean();
    const ids = conversations.map((conversation) => conversation._id);
    const unread = await Message.aggregate([
      { $match: { conversation: { $in: ids }, receiver: req.user._id, readAt: null } },
      { $group: { _id: '$conversation', count: { $sum: 1 } } },
    ]);
    const counts = new Map(unread.map((item) => [item._id.toString(), item.count]));
    const io = req.app.get('io');
    return res.status(200).json({
      success: true,
      conversations: conversations.map((conversation) => formatConversation(
        conversation, req.user._id, counts.get(conversation._id.toString()) || 0,
        Boolean(io?.isUserOnline(otherParticipant(conversation, req.user._id))),
      )),
    });
  } catch (error) { return next(error); }
};

exports.getMessages = async (req, res, next) => {
  try {
    assertObjectId(req.params.conversationId, 'conversation identifier');
    const conversation = await Conversation.findById(req.params.conversationId).populate('participants', userFields).lean();
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found.' });
    assertParticipant(conversation, req.user._id);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const messages = await Message.find({ conversation: conversation._id }).sort({ createdAt: -1 }).limit(limit).lean();
    return res.status(200).json({ success: true, conversation: formatConversation(conversation, req.user._id), messages: messages.reverse() });
  } catch (error) { return next(error); }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const result = await sendMessage({ conversationId: req.params.conversationId, senderId: req.user._id, content: req.body.content });
    const io = req.app.get('io');
    const payload = { conversationId: result.conversation._id, message: result.message.toObject() };
    io?.to(`conversation:${result.conversation._id}`).emit('message:new', payload);
    // Recipient tabs outside the active room still need the sidebar notification; room members get it once.
    io?.to(`user:${result.message.receiver}`).except(`conversation:${result.conversation._id}`).emit('message:new', payload);
    await createNotification({ io, recipient: result.message.receiver, type: 'chat_message', title: 'New message', message: result.message.content.slice(0, 160), relatedEntity: { entityType: 'conversation', entityId: result.conversation._id, link: `/chat?conversation=${result.conversation._id}` } });
    return res.status(201).json({ success: true, message: result.message });
  } catch (error) { return next(error); }
};

exports.markRead = async (req, res, next) => {
  try {
    assertObjectId(req.params.conversationId, 'conversation identifier');
    const conversation = await Conversation.findById(req.params.conversationId).lean();
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found.' });
    assertParticipant(conversation, req.user._id);
    const readAt = new Date();
    const result = await Message.updateMany({ conversation: conversation._id, receiver: req.user._id, readAt: null }, { $set: { readAt } });
    const otherId = otherParticipant(conversation, req.user._id);
    req.app.get('io')?.to(`user:${otherId}`).emit('message:read', { conversationId: conversation._id, readerId: req.user._id, readAt });
    return res.status(200).json({ success: true, markedRead: result.modifiedCount });
  } catch (error) { return next(error); }
};
