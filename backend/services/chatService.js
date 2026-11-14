const mongoose = require('mongoose');
const Team = require('../models/Team');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { stripHtml } = require('../utils/sanitize');

const MESSAGE_LIMIT = 2000;

const httpError = (status, message) => Object.assign(new Error(message), { status });
// Supports both ObjectIds and populated Mongoose documents.
const id = (value) => (value?._id || value).toString();
const pairKey = (first, second) => [id(first), id(second)].sort().join(':');

const cleanMessage = (value) => {
  if (typeof value !== 'string') throw httpError(422, 'Message content must be text.');
  const content = stripHtml(value);
  if (!content) throw httpError(422, 'Message cannot be empty.');
  if (content.length > MESSAGE_LIMIT) throw httpError(422, `Message cannot exceed ${MESSAGE_LIMIT} characters.`);
  return content;
};

const assertObjectId = (value, label = 'identifier') => {
  if (!mongoose.isValidObjectId(value)) throw httpError(400, `Invalid ${label}.`);
};

/**
 * Backend verification: Only active members of a team may access team chat.
 * Throws 404 if team does not exist.
 * Throws 403 if user is not in the team's member roster.
 */
const assertTeamMember = async (teamId, userId) => {
  assertObjectId(teamId, 'team identifier');
  assertObjectId(userId, 'user identifier');

  const team = await Team.findById(teamId).populate('members', 'name branch year skills avatarUrl lastSeen');
  if (!team) {
    throw httpError(404, 'Team not found.');
  }

  const isMember = team.members.some((member) => id(member) === id(userId));
  if (!isMember) {
    throw httpError(403, 'Access denied. You are not an authorized member of this team.');
  }

  return team;
};

/** Two people may chat directly only while they share a current accepted team roster. */
const assertCanChat = async (firstUserId, secondUserId) => {
  assertObjectId(firstUserId, 'user identifier');
  assertObjectId(secondUserId, 'user identifier');
  if (id(firstUserId) === id(secondUserId)) throw httpError(422, 'You cannot start a conversation with yourself.');
  const sharedTeam = await Team.exists({ members: { $all: [firstUserId, secondUserId] } });
  if (!sharedTeam) throw httpError(403, 'Direct chat is available only between members of the same accepted team.');
};

const assertParticipant = (conversation, userId) => {
  if (!conversation.participants.some((participant) => id(participant) === id(userId))) {
    throw httpError(403, 'You are not a participant in this conversation.');
  }
};

const otherParticipant = (conversation, userId) =>
  conversation.participants.find((participant) => id(participant) !== id(userId));

/**
 * Gets or creates the group conversation for a team.
 * Automatically synchronizes participants with the team's latest member roster.
 */
const getOrCreateTeamConversation = async (teamId, userId) => {
  const team = await assertTeamMember(teamId, userId);

  let conversation = await Conversation.findOne({ type: 'team', team: team._id });
  if (!conversation) {
    try {
      conversation = await Conversation.create({
        type: 'team',
        team: team._id,
        participants: team.members.map((m) => m._id),
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      conversation = await Conversation.findOne({ type: 'team', team: team._id });
    }
  } else {
    // Keep conversation participants in sync with current team roster
    const currentMemberIds = team.members.map((m) => id(m));
    const convParticipantIds = conversation.participants.map((p) => id(p));
    const isOutdated =
      currentMemberIds.length !== convParticipantIds.length ||
      currentMemberIds.some((mid) => !convParticipantIds.includes(mid));

    if (isOutdated) {
      conversation.participants = team.members.map((m) => m._id);
      await conversation.save();
    }
  }

  return { conversation, team };
};

/**
 * Sends a real-time message to a team group chat.
 * Strictly verifies team membership before writing to the database.
 */
const sendTeamMessage = async ({ teamId, senderId, content }) => {
  const team = await assertTeamMember(teamId, senderId);
  const messageContent = cleanMessage(content);

  const { conversation } = await getOrCreateTeamConversation(teamId, senderId);

  const message = await Message.create({
    conversation: conversation._id,
    team: team._id,
    sender: senderId,
    receiver: null,
    content: messageContent,
    readBy: [{ user: senderId, readAt: new Date() }],
  });

  conversation.lastMessage = messageContent;
  conversation.lastMessageAt = message.createdAt;
  conversation.lastMessageSender = senderId;
  await conversation.save();

  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'name branch year skills avatarUrl')
    .lean();

  return { conversation, message: populatedMessage, team };
};

/**
 * Retrieves paginated message history for a team group chat.
 * Strictly verifies team membership before retrieving messages.
 */
const getTeamMessages = async ({ teamId, userId, limit = 50 }) => {
  const team = await assertTeamMember(teamId, userId);
  const { conversation } = await getOrCreateTeamConversation(teamId, userId);

  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
  const messages = await Message.find({ conversation: conversation._id })
    .populate('sender', 'name branch year skills avatarUrl')
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean();

  return {
    team,
    conversation,
    messages: messages.reverse(),
  };
};

/**
 * Gets or creates a 1-to-1 direct conversation between two teammates.
 */
const getOrCreateConversation = async (userId, otherUserId) => {
  await assertCanChat(userId, otherUserId);
  const key = pairKey(userId, otherUserId);
  let conversation = await Conversation.findOne({ participantKey: key });
  if (!conversation) {
    try {
      conversation = await Conversation.create({
        type: 'direct',
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

/**
 * Sends a 1-to-1 direct message.
 */
const sendMessage = async ({ conversationId, senderId, content }) => {
  assertObjectId(conversationId, 'conversation identifier');
  const messageContent = cleanMessage(content);
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw httpError(404, 'Conversation not found.');
  assertParticipant(conversation, senderId);

  if (conversation.type === 'team') {
    return sendTeamMessage({ teamId: conversation.team, senderId, content });
  }

  const receiverId = otherParticipant(conversation, senderId);
  await assertCanChat(senderId, receiverId);

  const message = await Message.create({
    conversation: conversation._id,
    sender: senderId,
    receiver: receiverId,
    content: messageContent,
    readBy: [{ user: senderId, readAt: new Date() }],
  });

  conversation.lastMessage = messageContent;
  conversation.lastMessageAt = message.createdAt;
  conversation.lastMessageSender = senderId;
  await conversation.save();

  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'name branch year skills avatarUrl')
    .lean();

  return { conversation, message: populatedMessage };
};

module.exports = {
  MESSAGE_LIMIT,
  assertObjectId,
  assertTeamMember,
  assertParticipant,
  assertCanChat,
  cleanMessage,
  getOrCreateConversation,
  getOrCreateTeamConversation,
  getTeamMessages,
  sendTeamMessage,
  sendMessage,
  otherParticipant,
};
