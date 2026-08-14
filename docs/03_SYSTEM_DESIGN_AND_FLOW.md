# System Design and Runtime Flow

## Logical component design

```text
┌─────────────────────┐       REST + JWT        ┌──────────────────────────┐
│ React SPA           │ ──────────────────────> │ Express application      │
│ - Router            │ <────────────────────── │ - routes/controllers     │
│ - Axios/AuthContext │       JSON response     │ - validation/auth/errors │
│ - SocketContext     │                         └────────────┬─────────────┘
└─────────┬───────────┘                                      │ Mongoose
          │ Socket.IO auth/events                             ▼
          └──────────────────────────────────────────────┌─────────┐
                                                         │ MongoDB │
                                                         └─────────┘
```

The HTTP and Socket.IO servers share one Node `http.Server`. This means REST mutation controllers can access the initialized Socket.IO instance through `app.get('io')` and emit an event only after persistence succeeds.

## REST request lifecycle

Example: `POST /api/requests/teams/:teamId`.

```text
1. User clicks “Send request”
2. JoinRequestModal calls Axios
3. Axios request interceptor adds Authorization: Bearer <JWT>
4. Express route executes protect middleware
5. JWT is verified; User is loaded; req.user is attached
6. express-validator validates Mongo ID and optional message
7. Controller reads Team and enforces business rules
8. Request document is inserted; sender is populated
9. Controller emits request:created to the creator’s room
10. HTTP 201 response returns the new request
11. Creator's SocketContext displays a toast and Dashboard reloads
```

## Middleware sequence

At server startup, `server.js` composes middleware in this order:

1. `dotenv.config()` reads runtime configuration.
2. Helmet sets security-focused headers.
3. CORS permits the configured frontend origin and REST methods/headers.
4. `express.json({ limit: '10kb' })` parses bounded JSON bodies.
5. Public health/auth routes are registered.
6. Profile/team/request routes are registered; protected routes add `protect` before their handler.
7. Unknown URLs reach `notFound`.
8. Errors reach `errorHandler`, which handles Mongoose validation/duplicate-key cases and avoids exposing arbitrary internal errors.

The JWT middleware requires the exact `Bearer` scheme, verifies the signature and expiry, loads the user from MongoDB, and rejects deleted accounts. This makes authorization based on a current user document rather than only a potentially old token claim.

## Team creation flow

```text
React form
  → POST /api/teams
  → protect
  → body validation
  → Team.create({ creator: req.user._id, ... })
  → Team pre-validate hook inserts creator into members
  → MongoDB saves Team
  → populated 201 response
  → navigate to creator dashboard
```

The model-level hook is intentional defense in depth. A controller cannot accidentally create a team whose creator is absent from its membership list.

## Acceptance flow and concurrency protection

The difficult operation is accepting a request while multiple requests may be processed simultaneously.

```text
Creator PATCH /api/requests/:requestId { status: "accepted" }
  → verify the request exists and caller owns its team
  → require request.status === pending
  → atomic Team.findOneAndUpdate:
       match team ID + creator ID
       require applicant not already in members
       require $size(members) < teamSizeLimit
       $addToSet applicant into members
  → if no team matched: return 409; capacity/membership has not changed
  → set Request.status = accepted
  → emit request:updated to applicant's user room
```

The capacity predicate and mutation run in one MongoDB write. This avoids the classic race where two handlers both read “one spot left,” then both append members. `$addToSet` also protects against duplicate membership if a request is replayed. For a larger product with multi-document acceptance side effects (audit log, seat count, notifications), run the request/team changes inside a MongoDB transaction on a replica set or use an outbox pattern.

## Socket.IO architecture

### Connection authentication

1. The client reads the stored JWT and supplies it in `socket.io-client`'s `auth.token`.
2. Socket.IO middleware verifies the token using the same `JWT_SECRET` as REST.
3. The verified subject is stored as `socket.data.userId`.
4. On connection, the server automatically joins `user:<userId>`.

The optional `user:join` event is constrained: its user ID must equal the already verified socket user ID. A client cannot subscribe to another candidate's decision notifications merely by guessing their MongoDB ID.

### Event topology

| Server event | Recipient room | Trigger | Client behavior |
| --- | --- | --- | --- |
| `request:created` | `user:<teamCreatorId>` | Candidate successfully creates request | Toast + dashboard reload |
| `request:updated` | `user:<requestSenderId>` | Creator accepts/rejects | Toast showing final status |

Targeted rooms are preferable to broadcasting: they reduce network fan-out, minimize privacy leakage, and map directly to notification ownership.

## Failure semantics

| Failure | HTTP result | UI behavior |
| --- | --- | --- |
| Bad payload | `422` with validator details | Inline error message |
| Missing/expired token | `401` | Axios clears session; user returns to login |
| Authenticated but not owner | `403` | Mutation is denied with message |
| Duplicate request/full team/already processed | `409` | User sees actionable conflict message |
| Missing resource | `404` | User sees request failure rather than stale success |
| Unexpected exception | `500` | Central error middleware returns safe generic message |

## Scalability evolution

The single Node process is appropriate for local development and an initial deployment. To scale horizontally:

1. Put API instances behind a load balancer.
2. Use the Socket.IO Redis adapter so rooms/events work across processes.
3. Use sticky sessions only where the selected Socket.IO transport requires them.
4. Move notification persistence and delivery to an outbox/queue worker.
5. Add observability: structured logs, request IDs, connection metrics, error tracing, and p95 latency dashboards.
