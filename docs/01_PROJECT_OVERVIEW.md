# HackBuddy — Project Overview

## Elevator pitch

HackBuddy is a full-stack, real-time teammate finder for hackathons. A student creates a profile describing their skills and experience, discovers teams that need those skills, sends a join request, and receives the decision in real time. Team creators can publish openings, review applicants, and atomically add accepted applicants to the team without exceeding capacity.

The project demonstrates a production-shaped MERN application: authenticated REST APIs, MongoDB relationship modeling, request validation, concurrent membership protection, responsive React UI, dark/light theming, and JWT-authenticated Socket.IO notifications.

## Problem statement

Hackathon teams often form through fragmented chats and personal networks. That produces three practical problems:

1. **Discovery is poor.** A frontend developer may never see that a team needs React expertise.
2. **Skill fit is opaque.** Team leads cannot efficiently compare candidates by skills, branch, year, or experience.
3. **Coordination is delayed.** A requester can wait without knowing whether their request was seen or accepted.

HackBuddy turns this into a structured marketplace: profiles establish supply, team posts express demand, requests become a reviewable workflow, and sockets remove the need to poll for important state changes.

## Core user journeys

### Candidate journey

1. Register with name, email, password, academic branch/year, skills, and experience level.
2. Browse `/explore`, filtering teams by hackathon/idea text or an exact required skill.
3. Open the styled join-request dialog and optionally explain the value they can add.
4. Receive a toast when the team creator accepts or rejects the request.
5. Maintain their profile from `/profile`.

### Team creator journey

1. Authenticate and publish a post from `/teams/new` with a hackathon name, description, required skills, and size limit.
2. Receive a live `request:created` notification when someone applies.
3. Review applicants in `/app`, including their skills and accompanying message.
4. Accept or reject. Acceptance updates the team membership and request status; the applicant receives `request:updated` in real time.

## Implemented feature inventory

| Area | Delivered capability |
| --- | --- |
| Authentication | Register/login, BCrypt password hashing, signed JWTs, protected REST routes, authenticated socket handshake |
| Profiles | Read/update authenticated user profile; skills, bio, GitHub, branch, year, and experience level |
| Teams | Create, browse, text/skill filter, paginate, view full team details |
| Requests | Create join request, creator-only request review, accept/reject workflow |
| Realtime | User-specific rooms and targeted notifications for new and resolved requests |
| UX | Vite/React SPA, React Router protection, Axios bearer-token interceptor, responsive glassmorphism UI, persisted dark/light mode, toast notifications |
| Reliability | Input validation, centralized errors, schema constraints, duplicate-request index, atomic capacity update |

## Repository layout

```text
hackbuddy/
├── backend/
│   ├── config/db.js                 # MongoDB connection
│   ├── controllers/                 # Auth, profile, team, request use cases
│   ├── middlewares/                 # JWT and error middleware
│   ├── models/                      # User, Team, Request Mongoose models
│   ├── routes/                      # Express route definitions/validation
│   ├── sockets/index.js             # Socket.IO server + JWT handshake
│   └── server.js                    # HTTP server composition and startup
├── frontend/
│   └── src/
│       ├── components/              # Shell, team cards, join modal
│       ├── contexts/                # Auth, Theme, Socket state
│       ├── pages/                   # Login, register, explore, dashboard, profile
│       └── lib/                     # Axios client and class utility
└── docs/                            # Interview documentation
```

## Local setup and runbook

### Prerequisites

- Node.js 20+ and npm
- MongoDB running locally, or a MongoDB Atlas connection string

### 1. Configure the API

```powershell
cd hackbuddy/backend
Copy-Item .env.example .env
```

Set `MONGODB_URI` and a unique `JWT_SECRET` of at least 32 characters. The development defaults are:

```dotenv
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/hackbuddy
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

Start the API:

```powershell
npm install
npm run dev
```

The health endpoint is `GET http://localhost:5000/api/health`.

### 2. Configure and start the client

```powershell
cd ../frontend
Copy-Item .env.example .env
npm install
npm run dev
```

The default frontend opens at `http://localhost:5173`; its `VITE_API_URL` is `http://localhost:5000/api` and `VITE_SOCKET_URL` is `http://localhost:5000`.

### 3. Production client validation

```powershell
cd hackbuddy/frontend
npm run build
```

This produces static assets in `frontend/dist`. A production deployment should host those assets behind HTTPS and set `CORS_ORIGIN`, `VITE_API_URL`, and `VITE_SOCKET_URL` to the deployed origins.

## Useful interview demo script

1. Register two accounts: a team creator and a candidate.
2. As creator, create a team requiring React and Node.js.
3. As candidate, filter by React and submit a request with a short message.
4. Show the creator's real-time toast and dashboard request.
5. Accept the request and show the candidate's real-time decision toast.
6. Refresh the team feed to show the membership count changed.

This sequence demonstrates authentication, authorization, REST mutation, MongoDB persistence, atomic capacity protection, and Socket.IO fan-out in under five minutes.
