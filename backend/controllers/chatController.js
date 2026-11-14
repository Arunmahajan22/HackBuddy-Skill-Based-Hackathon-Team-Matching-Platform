const Team = require('../models/Team');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const {
  assertObjectId,
  assertParticipant,
  assertTeamMember,
  getOrCreateConversation,
  getOrCreateTeamConversation,
  getTeamMessages,
  sendTeamMessage,
  otherParticipant,
  sendMessage,
} = require('../services/chatService');
const { createNotification } = require('../services/notificationService');

const userFields = 'name branch year skills avatarUrl experienceLevel lastSeen';

const formatConversation = (conversation, currentUserId, unreadCount = 0, isOnline = false) => {
  if (conversation.type === 'team') {
    return {
      _id: conversation._id,
      type: 'team',
      team: conversation.team,
      lastMessage: conversation.lastMessage || '',
      lastMessageAt: conversation.lastMessageAt,
      lastMessageSender: conversation.lastMessageSender,
      unreadCount,
      isOnline: true,
    };
  }

  const otherUser = (conversation.participants || []).find(
    (participant) => participant._id.toString() !== currentUserId.toString(),
  );

  return {
    _id: conversation._id,
    type: 'direct',
    otherUser,
    lastMessage: conversation.lastMessage || '',
    lastMessageAt: conversation.lastMessageAt,
    lastMessageSender: conversation.lastMessageSender,
    unreadCount,
    isOnline,
  };
};

/**
 * Initiates or returns a 1-to-1 direct conversation with an accepted teammate.
 */
exports.createConversation = async (req, res, next) => {
  try {
    const conversation = await getOrCreateConversation(req.user._id, req.body.userId);
    const populated = await Conversation.findById(conversation._id)
      .populate('participants', userFields)
      .lean();

    const otherUser = otherParticipant(populated, req.user._id);
    const isOnline = Boolean(req.app.get('io')?.isUserOnline(otherUser?._id || otherUser));

    return res.status(200).json({
      success: true,
      conversation: formatConversation(populated, req.user._id, 0, isOnline),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Returns all active conversations for the authenticated user,
 * including both team group chats and 1-to-1 direct teammate conversations.
 */
exports.getConversations = async (req, res, next) => {
  try {
    // 1. Ensure team conversations exist for all teams the user has joined
    const userTeams = await Team.find({ members: req.user._id })
      .select('hackathonName description creator members createdAt')
      .populate('members', userFields)
      .lean();

    for (const team of userTeams) {
      await getOrCreateTeamConversation(team._id, req.user._id);
    }

    // 2. Fetch all direct and team conversations the user participates in
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', userFields)
      .populate({
        path: 'team',
        select: 'hackathonName description creator members createdAt',
        populate: { path: 'members', select: userFields },
      })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();

    const ids = conversations.map((conversation) => conversation._id);

    // 3. Count unread messages
    const unread = await Message.aggregate([
      {
        $match: {
          conversation: { $in: ids },
          $or: [
            { receiver: req.user._id, readAt: null },
            { team: { $ne: null }, 'readBy.user': { $ne: req.user._id } },
          ],
        },
      },
      { $group: { _id: '$conversation', count: { $sum: 1 } } },
    ]);

    const counts = new Map(unread.map((item) => [item._id.toString(), item.count]));
    const io = req.app.get('io');

    return res.status(200).json({
      success: true,
      conversations: conversations.map((conversation) => {
        const otherUser = conversation.type === 'direct' ? otherParticipant(conversation, req.user._id) : null;
        const isOnline = otherUser ? Boolean(io?.isUserOnline(otherUser._id || otherUser)) : false;
        return formatConversation(
          conversation,
          req.user._id,
          counts.get(conversation._id.toString()) || 0,
          isOnline,
        );
      }),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Retrieves a specific team's chat metadata.
 * Validates backend team membership.
 */
exports.getTeamChat = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { conversation, team } = await getOrCreateTeamConversation(teamId, req.user._id);

    return res.status(200).json({
      success: true,
      team,
      conversation: formatConversation(conversation, req.user._id),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Retrieves paginated messages for a team chat.
 * Strictly verifies team membership before returning messages.
 */
exports.getTeamMessages = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const result = await getTeamMessages({
      teamId,
      userId: req.user._id,
      limit: req.query.limit,
    });

    return res.status(200).json({
      success: true,
      team: result.team,
      conversation: formatConversation(result.conversation, req.user._id),
      messages: result.messages,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Sends a real-time message to a team chat.
 * Strictly verifies team membership before persisting and broadcasting.
 */
exports.sendTeamMessage = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { content } = req.body;

    const result = await sendTeamMessage({
      teamId,
      senderId: req.user._id,
      content,
    });

    const io = req.app.get('io');
    const payload = {
      teamId: result.team._id.toString(),
      conversationId: result.conversation._id.toString(),
      message: result.message,
    };

    // Broadcast in real time to the team room
    io?.to(`team:${result.team._id}`).emit('message:new', payload);
    io?.to(`conversation:${result.conversation._id}`).emit('message:new', payload);

    // Notify team members who are not currently active in the team room
    const otherMembers = result.team.members.filter(
      (member) => member._id.toString() !== req.user._id.toString(),
    );

    for (const member of otherMembers) {
      io?.to(`user:${member._id}`)
        .except(`team:${result.team._id}`)
        .emit('message:new', payload);

      createNotification({
        io,
        recipient: member._id,
        type: 'chat_message',
        title: `New message in ${result.team.hackathonName}`,
        message: `${req.user.name}: ${result.message.content.slice(0, 140)}`,
        relatedEntity: {
          entityType: 'team',
          entityId: result.team._id,
          link: `/chat?team=${result.team._id}`,
        },
      }).catch(() => {});
    }

    return res.status(201).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Retrieves messages for a direct conversation.
 */
exports.getMessages = async (req, res, next) => {
  try {
    assertObjectId(req.params.conversationId, 'conversation identifier');
    const conversation = await Conversation.findById(req.params.conversationId)
      .populate('participants', userFields)
      .lean();

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    assertParticipant(conversation, req.user._id);

    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const messages = await Message.find({ conversation: conversation._id })
      .populate('sender', 'name branch year skills avatarUrl')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      conversation: formatConversation(conversation, req.user._id),
      messages: messages.reverse(),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Sends a direct message to a conversation.
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const result = await sendMessage({
      conversationId: req.params.conversationId,
      senderId: req.user._id,
      content: req.body.content,
    });

    const io = req.app.get('io');
    const payload = {
      conversationId: result.conversation._id.toString(),
      message: result.message,
    };

    io?.to(`conversation:${result.conversation._id}`).emit('message:new', payload);

    if (result.message.receiver) {
      io?.to(`user:${result.message.receiver}`)
        .except(`conversation:${result.conversation._id}`)
        .emit('message:new', payload);

      await createNotification({
        io,
        recipient: result.message.receiver,
        type: 'chat_message',
        title: `Message from ${req.user.name}`,
        message: result.message.content.slice(0, 160),
        relatedEntity: {
          entityType: 'conversation',
          entityId: result.conversation._id,
          link: `/chat?conversation=${result.conversation._id}`,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Marks messages in a conversation as read.
 */
exports.markRead = async (req, res, next) => {
  try {
    assertObjectId(req.params.conversationId, 'conversation identifier');
    const conversation = await Conversation.findById(req.params.conversationId).lean();
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    assertParticipant(conversation, req.user._id);
    const readAt = new Date();

    if (conversation.type === 'team') {
      await Message.updateMany(
        { conversation: conversation._id, 'readBy.user': { $ne: req.user._id } },
        { $push: { readBy: { user: req.user._id, readAt } } },
      );
      req.app.get('io')?.to(`team:${conversation.team}`).emit('team:messages:read', {
        teamId: conversation.team,
        conversationId: conversation._id,
        userId: req.user._id,
      });
    } else {
      await Message.updateMany(
        { conversation: conversation._id, receiver: req.user._id, readAt: null },
        { $set: { readAt } },
      );
      const otherId = otherParticipant(conversation, req.user._id);
      if (otherId) {
        req.app.get('io')?.to(`user:${otherId}`).emit('message:read', {
          conversationId: conversation._id,
          readerId: req.user._id,
          readAt,
        });
      }
    }

    return res.status(200).json({ success: true, message: 'Messages marked as read.' });
  } catch (error) {
    return next(error);
  }
};
