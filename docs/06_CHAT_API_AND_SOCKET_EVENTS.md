# Real-time Chat API and Socket.IO Events

Chat extends the existing JWT-authenticated Express, Socket.IO, and MongoDB architecture. It is intentionally limited to two users that are current members of at least one common team. An accepted join request adds the requester to `Team.members`, so acceptance immediately becomes the authorization grant; there is no second, duplicative match table.

## Database design

- `Conversation` stores exactly two `participants`, the normalized unique `participantKey`, and a denormalized last-message summary for fast sidebar ordering.
- `Message` stores `conversation`, server-derived `sender` and `receiver`, `content`, `createdAt`, and nullable `readAt`.
- `Conversation.participantKey` is unique, preventing duplicate direct conversations even under simultaneous creation. `Message` indexes support conversation history and unread-count queries.
- `User.lastSeen` is only written when the user's last active socket disconnects. Current presence stays in Socket.IO's in-memory rooms, avoiding a database update for every presence event.

## REST API

All endpoints are authenticated through the existing `protect` middleware (cookie or Bearer JWT).

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/chat/conversations` | Sidebar metadata, unread counts, latest previews, and presence |
| POST | `/api/chat/conversations` | Opens/gets a direct conversation; body: `{ userId }` |
| GET | `/api/chat/conversations/:conversationId/messages?limit=50` | Reads the most recent 1–100 messages |
| POST | `/api/chat/conversations/:conversationId/messages` | Sends persisted message; body: `{ content }` |
| POST | `/api/chat/conversations/:conversationId/read` | Marks unread inbound messages read |

All conversation routes verify membership. Creating and sending additionally verify that both people still share a team. Content is trimmed, stripped of control characters, must be non-empty, and is capped at 2,000 characters. Sender and receiver are always derived server-side.

## Socket.IO

The existing socket handshake accepts the same JWT from `auth.token`, `Authorization: Bearer`, or the `hackbuddy_token` cookie. The server verifies it before connection and places the socket only in its authenticated `user:<id>` room. A client cannot choose its identity or private user room.

| Direction | Event | Payload | Notes |
| --- | --- | --- | --- |
| client → server | `conversation:join` | `conversationId` | Membership is checked before joining `conversation:<id>` |
| client → server | `conversation:leave` | `conversationId` | Leaves active room |
| client → server | `message:send` | `{ conversationId, content }` | Persists first, emits only after success; acknowledgment returns result |
| server → client | `message:new` | `{ conversationId, message }` | Delivered to active conversation and recipient private room |
| client → server | `messages:read` | `{ conversationId }` | Marks inbound messages read |
| server → client | `message:read` | `{ conversationId, readerId, readAt }` | Read receipt signal |
| client → server | `typing:start` / `typing:stop` | `{ conversationId }` | Client uses a 1.2-second debounce; events are not persisted |
| server → client | `typing:update` | `{ conversationId, userId, isTyping }` | Sent only to other sockets in room |
| server → client | `presence:update` | `{ userId, isOnline, lastSeen }` | Contacts receive online/offline changes |

Socket send, typing, read, and room join handlers independently recheck conversation membership. This means a forged room ID or sender ID cannot insert into or observe someone else's chat.

## Manual two-user verification flow

1. Register a creator and a second user. The creator creates a team; the second user applies; the creator accepts.
2. On the creator dashboard, select **Message teammate**. Verify the chat opens; no chat should open before acceptance or with an unrelated account.
3. Open the same chat from the second user (or a second browser session), send messages in both directions, and verify instant delivery, persistence after refresh, sidebar preview, and unread badge.
4. Type without sending and verify the indicator clears shortly after stopping. Close the second session and verify it shows offline/last seen; reconnect and verify online.
