# Notification Architecture

HackBuddy notifications are persisted MongoDB records and are delivered in real time over the existing authenticated Socket.IO private user room. The browser fetches the initial inbox once on sign-in; it does not poll. Subsequent changes arrive as `notification:new` events.

## Data model

`Notification` contains `recipient`, `type`, `title`, `message`, optional `relatedEntity` (`entityType`, `entityId`, `link`), `readAt`, and `createdAt`. The compound `{ recipient, readAt, createdAt }` index supports each user’s unread badge and newest-first dropdown efficiently.

## Central creation path

All business actions call `createNotification` in `services/notificationService.js`. That service creates the database record once, then emits that exact record to `user:<recipientId>`. Controllers and Socket.IO handlers never construct delivery payloads independently.

Current producers:

- A join request notifies the team creator (`join_request`).
- Accepted or rejected requests notify the applicant (`request_accepted` / `request_rejected`). An accepted request is the project’s existing team-invitation equivalent.
- Persisted chat messages notify the receiver (`chat_message`).

The existing application does not have a dedicated outbound invitation or email-verification workflow, so it does not create misleading notifications for either. The model already supports `team_invitation` and `email_verification` types for those features when they are added.

## API and security

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/notifications` | Current user’s newest notifications and unread count |
| PATCH | `/api/notifications/:id/read` | Marks one of the current user’s notifications read |
| PATCH | `/api/notifications/read-all` | Marks the current user’s unread inbox read |

All routes use the existing JWT `protect` middleware. Reads and writes include `recipient: req.user._id` in the query, so guessing another notification ID returns 404 and cannot reveal or change another user’s data.

## Real-time flow

1. A request or chat message is successfully persisted.
2. The producing controller/handler invokes `createNotification`.
3. MongoDB persists the notification.
4. Socket.IO emits `notification:new` only to the authenticated recipient room.
5. `SocketContext` updates the badge and dropdown immediately; it initially loads from REST to cover offline notifications and reconnects.
