# Real-time Chat API and Socket.IO Events

Chat in HackBuddy supports both **1-on-1 Direct Messaging** between accepted teammates and **Team Group Chat** for all verified members of a hackathon team.

## Database Design

- `Conversation`:
  - `type`: `'direct' | 'team'`
  - `participants`: Array of User ObjectIds (exactly 2 for direct chats, all active members + creator for team chats).
  - `team`: ObjectId reference to `Team` (for `type: 'team'`).
  - `participantKey`: Sparse unique compound string for direct conversations to prevent duplicates under race conditions.
  - `lastMessage`: Denormalized summary (`text`, `sender`, `createdAt`) for rapid sidebar rendering without secondary lookups.
- `Message`:
  - `conversation`: ObjectId reference to `Conversation`.
  - `team`: Optional ObjectId reference to `Team` for team chat messages.
  - `sender`: ObjectId reference to `User` (strictly derived server-side from session).
  - `receiver`: Optional ObjectId reference to `User` (populated for direct messages).
  - `content`: Sanitized message text (HTML tags stripped, control characters removed, 1–2000 chars).
  - `readBy`: Array of user ObjectIds who have read the message (for group chats).
  - `readAt`: Nullable timestamp for 1-on-1 read receipts.
- Presence:
  - Online/offline presence is maintained in Socket.IO's in-memory room tracking. `User.lastSeen` is only written when the user's last active socket disconnects, avoiding excessive database writes.

## REST API Endpoints

All endpoints require authentication via the `protect` middleware (HttpOnly cookie or Bearer JWT).

| Method | Path | Authorization | Purpose |
| --- | --- | --- | --- |
| GET | `/api/chat/conversations` | Protected | Sidebar metadata, unread counts, latest previews, and presence |
| POST | `/api/chat/conversations` | Protected | Opens/retrieves a direct conversation; body: `{ userId }` (requires shared team) |
| GET | `/api/chat/conversations/:id/messages?limit=50` | Protected (Participant) | Reads recent 1–100 messages for a conversation |
| POST | `/api/chat/conversations/:id/messages` | Protected (Participant) | Sends and persists direct message; body: `{ content }` |
| POST | `/api/chat/conversations/:id/read` | Protected (Participant) | Marks unread inbound messages read |
| GET | `/api/chat/teams/:teamId` | Protected (Team Member) | Retrieves or creates group conversation for an authorized team |
| GET | `/api/chat/teams/:teamId/messages?limit=50` | Protected (Team Member) | Reads recent 1–100 messages for a team chat |
| POST | `/api/chat/teams/:teamId/messages` | Protected (Team Member) | Sends and persists message to team chat; body: `{ content }` |

All routes strictly verify membership via `assertTeamMember` or participant validation. Attempting to access a team chat without being a creator or member returns `403 Forbidden`.

## Socket.IO Real-Time Events

The socket handshake authenticates via the `hackbuddy_token` cookie or Bearer token, sets `socket.data.userId`, and auto-joins the private room `user:<userId>`.

### Direct Chat Events
| Direction | Event | Payload | Notes |
| --- | --- | --- | --- |
| client → server | `conversation:join` | `conversationId` | Checks conversation participant membership |
| client → server | `conversation:leave` | `conversationId` | Leaves `conversation:<id>` room |
| client → server | `message:send` | `{ conversationId, content }` | Sanitizes, persists to DB, emits to conversation & recipient room |
| server → client | `message:new` | `{ conversationId, message }` | Delivered to room and recipient |
| client → server | `typing:start` / `stop` | `{ conversationId }` | 1.2-second debounce; broadcasts `typing:update` |
| server → client | `presence:update` | `{ userId, isOnline, lastSeen }` | Real-time presence updates |

### Team Group Chat Events
| Direction | Event | Payload | Notes |
| --- | --- | --- | --- |
| client → server | `team:join` | `teamId` | Backend checks `Team.members` & `creator` before joining `team:<teamId>` |
| client → server | `team:leave` | `teamId` | Leaves `team:<teamId>` room |
| client → server | `team:message:send` | `{ teamId, content }` | Validates membership, sanitizes text, persists to DB, broadcasts to team |
| server → client | `team:message:new` | `{ teamId, conversationId, message }` | Delivered in real-time to all online team members |
| client → server | `team:typing:start` / `stop` | `teamId` | Broadcasts typing indicators to team room |
| server → client | `team:typing:update` | `{ teamId, userId, isTyping }` | Sent to other active team members in room |
