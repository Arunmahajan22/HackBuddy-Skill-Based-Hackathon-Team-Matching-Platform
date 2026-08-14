# Database Schema and API Specification

## Entity Relationship Diagram

```text
┌──────────────────────────────── User ────────────────────────────────┐
│ _id: ObjectId                                                         │
│ name, email (unique), password (select:false), branch, year           │
│ bio, github, skills[], experienceLevel                                │
│ createdAt, updatedAt                                                  │
└───────────────┬─────────────────────┬────────────────────────────────┘
                │ creates (1:N)      │ sends (1:N)
                ▼                    ▼
┌──────────────────────────────── Team ──┐      ┌──────────────── Request ───────────────┐
│ _id: ObjectId                           │      │ _id: ObjectId                          │
│ hackathonName, description               │      │ sender: ObjectId → User                │
│ requiredSkills[]                         │      │ team: ObjectId → Team                  │
│ teamSizeLimit                            │      │ status: pending|accepted|rejected       │
│ creator: ObjectId → User                 │      │ message, createdAt, updatedAt           │
│ members: ObjectId[] → User               │      └──────────────────────────────────────┘
│ createdAt, updatedAt                     │
└──────────────────────────────────────────┘

Team.creator is also inserted into Team.members by a pre-validation hook.
```

---

## Index Strategy

| Collection | Index | Purpose |
| --- | --- | --- |
| `users` | `{ email: 1 }`, unique | Fast login/duplicate-registration check |
| `users` | `{ skills: 1 }` | Fast skill search & candidate matching |
| `teams` | `{ hackathonName: 'text', description: 'text' }` | Full-text search over hackathon name & project description |
| `teams` | `{ requiredSkills: 1, createdAt: -1 }` | Fast multikey skill filtering with recency sort |
| `teams` | `{ creator: 1, createdAt: -1 }` | Fast retrieval of creator's teams for dashboard |
| `teams` | `{ createdAt: -1 }` | Fast retrieval for default explore feed |
| `requests` | `{ sender: 1, team: 1 }`, unique | Invariant preventing duplicate applications to the same team |
| `requests` | `{ team: 1, createdAt: -1 }` | Fast retrieval of applicant requests for a team |
| `requests` | `{ sender: 1, createdAt: -1 }` | Fast candidate request history queries |
| `requests` | `{ team: 1, status: 1 }` | Fast status count aggregations |

---

## REST API Specification

Base URL: `/api`.
Authentication: Supports both **HTTP-only Cookies** (`hackbuddy_token`) and standard `Authorization: Bearer <token>` headers.

### Authentication & Session

| Method | Path | Auth | Rate Limit | Description |
| --- | --- | --- | --- | --- |
| POST | `/auth/register` | Public | 15 req / 15 min | Registers builder profile, sets HTTP-only cookie + token |
| POST | `/auth/login` | Public | 15 req / 15 min | Constant-time bcrypt authentication |
| GET | `/auth/me` | Protected | Global | Rehydrates session for active client |
| POST | `/auth/logout` | Public | Global | Clears server-side auth cookie |

### Profile

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/users/me` | Protected | Retrieves full profile of authenticated user |
| PATCH | `/users/me` | Protected | Whitelisted profile field updates with validation |

### Teams

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/teams` | Public | Paginated feed (`q`, `skill`, `page`, `limit`) |
| GET | `/teams/mine` | Protected | Retrieves all teams posted by the logged-in creator |
| POST | `/teams` | Protected | Creates a new team opening (30 req / 15 min limit) |
| GET | `/teams/:teamId` | Public | Retrieves specific team details with populated members |

### Requests

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/requests/incoming` | Protected | Batch retrieves all incoming requests for creator's teams |
| POST | `/requests/teams/:teamId` | Protected | Submits a join request with optional note |
| GET | `/requests/teams/:teamId` | Protected (Creator) | Retrieves requests for a specific team |
| PATCH | `/requests/:requestId` | Protected (Creator) | Concurrency-safe Accept / Reject decision |

---

## Response Safety & Invariants

1. **Password Omission**: The `password` hash is never selected unless explicitly requested in `authController.login`, and is stripped via `toJSON` transform.
2. **Lean Projections**: Read-heavy queries use `.lean()` and select only needed fields (`name branch year skills experienceLevel github`).
3. **Atomic Concurrency Mutex**: Team acceptance uses a conditional `findOneAndUpdate` checking live membership array size against `teamSizeLimit`.
