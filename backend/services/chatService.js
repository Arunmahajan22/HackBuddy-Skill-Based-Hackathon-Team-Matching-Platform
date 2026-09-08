const mongoose = require('mongoose');
const Team = require('../models/Team');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const MESSAGE_LIMIT = 2000;

const httpError = (status, message) => Object.assign(new Error(message), { status });
// Supports both ObjectIds and populated Mongoose documents.
const id = (value) => (value?._id || value).toString();
const pairKey = (first, second) => [id(first), id(second)].sort().join(':');

const cleanMessage = (value) => {
  if (typeof value !== 'string') throw httpError(422, 'Message content must be text.');
  // React renders text safely; remove control characters that have no useful chat meaning.
  const content = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  if (!content) throw httpError(422, 'Message cannot be empty.');
  if (content.length > MESSAGE_LIMIT) throw httpError(422, `Message cannot exceed ${MESSAGE_LIMIT} characters.`);
  return content;
};

const assertObjectId = (value, label = 'identifier') => {
  if (!mongoose.isValidObjectId(value)) throw httpError(400, `Invalid ${label}.`);
};

/** Two people may chat only while they share a current team roster. */
const assertCanChat = async (firstUserId, secondUserId) => {
  assertObjectId(firstUserId, 'user identifier');
  assertObjectId(secondUserId, 'user identifier');
  if (id(firstUserId) === id(secondUserId)) throw httpError(422, 'You cannot start a conversation with yourself.');
  const sharedTeam = await Team.exists({ members: { $all: [firstUserId, secondUserId] } });
  if (!sharedTeam) throw httpError(403, 'Chat is available only to members of the same accepted team.');
};

const assertParticipant = (conversation, userId) => {
  if (!conversation.participants.some((participant) => id(participant) === id(userId))) {
    throw httpError(403, 'You are not a participant in this conversation.');
  }
};

const otherParticipant = (conversation, userId) =>
  conversation.participants.find((participant) => id(participant) !== id(userId));

const getOrCreateConversation = async (userId, otherUserId) => {
  await assertCanChat(userId, otherUserId);
  const key = pairKey(userId, otherUserId);
  let conversation = await Conversation.findOne({ participantKey: key });
  if (!conversation) {
    try {
      conversation = await Conversation.create({
        participants: [userId, otherUserId],
        participantKey: key,
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      conversation = await Conversation.findOne({ participantKey: key });
    }
  }
  return conversation;
};

const sendMessage = async ({ conversationId, senderId, content }) => {
  assertObjectId(conversationId, 'conversation identifier');
  const messageContent = cleanMessage(content);
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw httpError(404, 'Conversation not found.');
  assertParticipant(conversation, senderId);
  const receiverId = otherParticipant(conversation, senderId);
  // A historical conversation cannot bypass a roster removal.
  await assertCanChat(senderId, receiverId);
  const message = await Message.create({ conversation: conversation._id, sender: senderId, receiver: receiverId, content: messageContent });
  conversation.lastMessage = messageContent;
  conversation.lastMessageAt = message.createdAt;
  conversation.lastMessageSender = senderId;
  await conversation.save();
  return { conversation, message };
};

module.exports = {
  MESSAGE_LIMIT,
  assertObjectId,
  assertParticipant,
  cleanMessage,
  getOrCreateConversation,
  otherParticipant,
  sendMessage,
};
