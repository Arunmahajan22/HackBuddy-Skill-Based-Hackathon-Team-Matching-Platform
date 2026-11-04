const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const registerChatHandlers = require('./chatHandlers');

/**
 * Extracts authentication token from socket handshake (auth object, header, or cookie).
 */
const extractSocketToken = (socket) => {
  if (socket.handshake.auth?.token) {
    return socket.handshake.auth.token;
  }
  if (socket.handshake.headers?.authorization) {
    const parts = socket.handshake.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      return parts[1];
    }
  }
  if (socket.handshake.headers?.cookie) {
    const match = socket.handshake.headers.cookie.match(/hackbuddy_token=([^;]+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  }
  return null;
};

/**
 * Initializes and configures Socket.IO server with JWT authentication and partitioned rooms.
 */
const initializeSockets = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });
  // Available to REST controllers even before any WebSocket has connected.
  io.isUserOnline = (id) => Boolean(io.sockets.adapter.rooms.get(`user:${id.toString()}`)?.size);

  // Socket Authentication Middleware
  io.use((socket, next) => {
    try {
      const token = extractSocketToken(socket);
      if (!token) {
        return next(new Error('Authentication token required.'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.userId = decoded.sub;
      return next();
    } catch (_error) {
      return next(new Error('Invalid or expired authentication token.'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    const userRoom = `user:${userId}`;

    // Track presence in memory: no database write occurs for every socket event.
    const wasOnline = io.sockets.adapter.rooms.get(userRoom)?.size > 0;
    socket.join(userRoom);

    const notifyContactsOfPresence = async (isOnline, lastSeen = null) => {
      const conversations = await Conversation.find({ participants: userId }).select('participants').lean();
      conversations.forEach((conversation) => {
        conversation.participants
          .filter((participant) => participant.toString() !== userId)
          .forEach((participant) => io.to(`user:${participant}`).emit('presence:update', { userId, isOnline, lastSeen }));
      });
    };
    if (!wasOnline) notifyContactsOfPresence(true).catch(() => {});

    // Explicit user room join verification
    socket.on('user:join', (requestedUserId, acknowledge) => {
      if (requestedUserId !== userId) {
        if (typeof acknowledge === 'function') {
          acknowledge({ ok: false, message: 'Unauthorized room access.' });
        }
        return;
      }
      socket.join(`user:${requestedUserId}`);
      if (typeof acknowledge === 'function') {
        acknowledge({ ok: true });
      }
    });

    socket.on('disconnect', (_reason) => {
      // Socket.IO removes this socket from its rooms before the disconnect event.
      setTimeout(async () => {
        if (io.isUserOnline(userId)) return;
        const lastSeen = new Date();
        // One write only after all tabs/devices have disconnected, rather than per presence event.
        await User.updateOne({ _id: userId }, { $set: { lastSeen } }).catch(() => {});
        notifyContactsOfPresence(false, lastSeen).catch(() => {});
      }, 0);
    });

    registerChatHandlers(io, socket);
  });

  return io;
};

module.exports = initializeSockets;
