# Chat System

HackBuddy uses Socket.IO on the existing Node HTTP server for direct chat. The browser provides the JWT in `handshake.auth.token` (or may use the existing Bearer/cookie fallback); Socket.IO verifies it before allowing a connection and stores the authenticated ID in `socket.data.userId`.

Each connection automatically joins `user:<id>`. A client joins `conversation:<id>` only after `conversation:join` verifies it is a participant. A conversation has exactly two participants and a unique sorted `participantKey` to prevent duplicate direct conversations.

## Persistence and authorization

`Message` stores conversation, sender, receiver, content, timestamps, and `readAt`. The server derives sender from HTTP/socket authentication and receiver from the conversation; clients cannot supply either. Before every send, the service checks membership and verifies the two users still share a team, which is the accepted-match boundary.

## Events

- `conversation:join`, `conversation:leave`
- `message:send` → `message:new`
- `messages:read` → `message:read`
- `typing:start` / `typing:stop` → `typing:update`
- `presence:update`

The UI debounces typing stop by 1.2 seconds. Presence is held in Socket.IO rooms; `User.lastSeen` is written only after the final active socket disconnects, avoiding database writes for every connection event. Unread counts are derived from unread inbound `Message` records. Chat messages also create a persisted notification for the receiver.
