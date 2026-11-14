const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Team = require('../models/Team');
const {
  assertParticipant,
  assertTeamMember,
  sendTeamMessage,
  sendMessage,
} = require('../services/chatService');
const { createNotification } = require('../services/notificationService');

const acknowledge = (callback, payload) => {
  if (typeof callback === 'function') callback(payload);
};

module.exports = (io, socket) => {
  const userId = socket.data.userId;

  // ==========================================
  // 1. TEAM CHAT SOCKET EVENTS
  // ==========================================

  /**
   * Join a team group chat room with strict backend membership validation.
   */
  socket.on('team:join', async (teamId, callback) => {
    try {
      const team = await assertTeamMember(teamId, userId);
      socket.join(`team:${teamId}`);
      acknowledge(callback, { ok: true, teamId });
    } catch (error) {
      acknowledge(callback, {
        ok: false,
        message: error.message || 'Unable to join team chat.',
      });
    }
  });

  /**
   * Leave a team group chat room.
   */
  socket.on('team:leave', (teamId) => {
    socket.leave(`team:${teamId}`);
  });

  /**
   * Send a message to a team chat room.
   * Strictly validates membership on backend before saving and broadcasting.
   */
  socket.on('team:message:send', async ({ teamId, content } = {}, callback) => {
    try {
      const result = await sendTeamMessage({
        teamId,
        senderId: userId,
        content,
      });

      const payload = {
        teamId: result.team._id.toString(),
        conversationId: result.conversation._id.toString(),
        message: result.message,
      };

      // Broadcast to all team members in the active team room
      io.to(`team:${result.team._id}`).emit('message:new', payload);
      io.to(`conversation:${result.conversation._id}`).emit('message:new', payload);

      // Notify team members not currently in the team room
      const sender = await Team.findById(result.team._id)
        .populate('members', 'name')
        .lean();
      const currentSenderName =
        sender?.members?.find((m) => m._id.toString() === userId.toString())?.name || 'A teammate';

      const otherMembers = (result.team.members || []).filter(
        (member) => (member._id || member).toString() !== userId.toString(),
      );

      for (const member of otherMembers) {
        const memberId = (member._id || member).toString();
        io.to(`user:${memberId}`)
          .except(`team:${result.team._id}`)
          .emit('message:new', payload);

        createNotification({
          io,
          recipient: memberId,
          type: 'chat_message',
          title: `New message in ${result.team.hackathonName}`,
          message: `${currentSenderName}: ${result.message.content.slice(0, 140)}`,
          relatedEntity: {
            entityType: 'team',
            entityId: result.team._id,
            link: `/chat?team=${result.team._id}`,
          },
        }).catch(() => {});
      }

      acknowledge(callback, { ok: true, message: result.message });
    } catch (error) {
      acknowledge(callback, {
        ok: false,
        message: error.message || 'Message could not be sent.',
      });
    }
  });

  /**
   * Team chat typing indicators.
   */
  socket.on('team:typing:start', async ({ teamId } = {}) => {
    try {
      await assertTeamMember(teamId, userId);
      socket.to(`team:${teamId}`).emit('team:typing:update', {
        teamId,
        userId,
        isTyping: true,
      });
    } catch (_error) {
      /* ignore unauthorized transient typing events */
    }
  });

  socket.on('team:typing:stop', async ({ teamId } = {}) => {
    try {
      await assertTeamMember(teamId, userId);
      socket.to(`team:${teamId}`).emit('team:typing:update', {
        teamId,
        userId,
        isTyping: false,
      });
    } catch (_error) {
      /* ignore unauthorized transient typing events */
    }
  });

  // ==========================================
  // 2. DIRECT (1-ON-1) CHAT SOCKET EVENTS
  // ==========================================

  socket.on('conversation:join', async (conversationId, callback) => {
    try {
      const conversation = await Conversation.findById(conversationId).lean();
      if (!conversation) throw Object.assign(new Error('Conversation not found.'), { status: 404 });

      if (conversation.type === 'team') {
        await assertTeamMember(conversation.team, userId);
      } else {
        assertParticipant(conversation, userId);
      }

      socket.join(`conversation:${conversationId}`);
      acknowledge(callback, { ok: true });
    } catch (error) {
      acknowledge(callback, { ok: false, message: error.message || 'Unable to join conversation.' });
    }
  });

  socket.on('conversation:leave', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on('message:send', async ({ conversationId, content } = {}, callback) => {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) throw new Error('Conversation not found.');

      if (conversation.type === 'team') {
        const result = await sendTeamMessage({
          teamId: conversation.team,
          senderId: userId,
          content,
        });

        const payload = {
          teamId: result.team._id.toString(),
          conversationId: result.conversation._id.toString(),
          message: result.message,
        };

        io.to(`team:${result.team._id}`).emit('message:new', payload);
        io.to(`conversation:${result.conversation._id}`).emit('message:new', payload);
        acknowledge(callback, { ok: true, message: result.message });
        return;
      }

      const result = await sendMessage({ conversationId, senderId: userId, content });
      const payload = { conversationId: result.conversation._id.toString(), message: result.message };

      io.to(`conversation:${result.conversation._id}`).emit('message:new', payload);
      if (result.message.receiver) {
        io.to(`user:${result.message.receiver}`)
          .except(`conversation:${result.conversation._id}`)
          .emit('message:new', payload);

        await createNotification({
          io,
          recipient: result.message.receiver,
          type: 'chat_message',
          title: 'New message',
          message: result.message.content.slice(0, 160),
          relatedEntity: {
            entityType: 'conversation',
            entityId: result.conversation._id,
            link: `/chat?conversation=${result.conversation._id}`,
          },
        });
      }

      acknowledge(callback, { ok: true, message: payload.message });
    } catch (error) {
      acknowledge(callback, { ok: false, message: error.message || 'Message could not be sent.' });
    }
  });

  socket.on('typing:start', async ({ conversationId } = {}) => {
    try {
      const conversation = await Conversation.findById(conversationId).lean();
      if (!conversation) return;
      assertParticipant(conversation, userId);
      socket.to(`conversation:${conversationId}`).emit('typing:update', { conversationId, userId, isTyping: true });
    } catch (_error) {
      /* ignore unauthorized transient typing events */
    }
  });

  socket.on('typing:stop', async ({ conversationId } = {}) => {
    try {
      const conversation = await Conversation.findById(conversationId).lean();
      if (!conversation) return;
      assertParticipant(conversation, userId);
      socket.to(`conversation:${conversationId}`).emit('typing:update', { conversationId, userId, isTyping: false });
    } catch (_error) {
      /* ignore unauthorized transient typing events */
    }
  });

  socket.on('messages:read', async ({ conversationId } = {}, callback) => {
    try {
      const conversation = await Conversation.findById(conversationId).lean();
      if (!conversation) throw new Error('Conversation not found.');
      assertParticipant(conversation, userId);
      const readAt = new Date();

      if (conversation.type === 'team') {
        await Message.updateMany(
          { conversation: conversationId, 'readBy.user': { $ne: userId } },
          { $push: { readBy: { user: userId, readAt } } },
        );
        io.to(`team:${conversation.team}`).emit('team:messages:read', {
          teamId: conversation.team,
          conversationId,
          userId,
        });
      } else {
        await Message.updateMany(
          { conversation: conversationId, receiver: userId, readAt: null },
          { $set: { readAt } },
        );
        io.to(`conversation:${conversationId}`).emit('message:read', { conversationId, readerId: userId, readAt });
      }

      acknowledge(callback, { ok: true });
    } catch (error) {
      acknowledge(callback, { ok: false, message: error.message });
    }
  });
};
