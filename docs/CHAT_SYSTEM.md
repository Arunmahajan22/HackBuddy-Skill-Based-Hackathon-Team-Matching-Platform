# Chat System (Direct & Team Group Chat)

HackBuddy implements a real-time messaging architecture using Socket.IO on top of the Express HTTP server, backed by MongoDB for persistence.

## Architecture

- **Direct 1-on-1 Chat:** Supported between users who share at least one accepted team membership.
- **Team Group Chat:** Supported for all members of an accepted hackathon team and its creator.
- **Handshake Authentication:** The socket handshake validates user identity via HttpOnly cookies (`hackbuddy_token`) or Bearer headers. Unverified accounts or invalid tokens are rejected before the connection is established.
- **Partitioned Rooms:** Sockets join isolated rooms:
  - `user:<userId>` for direct notifications and direct chat routing.
  - `team:<teamId>` for team group conversations, joined only after server-side roster verification.

## Persistence & Validation

- `Conversation` models both `direct` and `team` chats.
- Team chat endpoints (`GET /api/chat/teams/:teamId`, `GET /api/chat/teams/:teamId/messages`, `POST /api/chat/teams/:teamId/messages`) and socket handlers enforce `assertTeamMember`.
- Messages are sanitized (`stripHtml`), bounded to 2,000 characters, and saved to MongoDB with sender ObjectIds, timestamps, and `readBy` status.
- Typing indicators use a 1.2-second debounce and are broadcast to room participants without persisting to the database.
