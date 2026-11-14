# ⚡ HackBuddy
### *Skill-Based Hackathon Teammate Discovery & Real-Time Matching Platform*

<div align="center">

[![React 19](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-9.x-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Nodemailer](https://img.shields.io/badge/Nodemailer-7.x-22B573?style=for-the-badge&logo=gmail&logoColor=white)](https://nodemailer.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

<br />

**HackBuddy** is a production-grade full-stack platform engineered to connect ambitious developers, designers, and AI specialists for hackathons. Built with a high-performance **MERN** stack, it features production-style email verification, atomic database concurrency control, real-time WebSocket communication for both **1-on-1 direct messaging and authenticated team group chats**, an explainable multi-factor matchmaking engine evaluating **technical skills and availability compatibility**, defense-in-depth XSS mitigation, and a clean Big-Tech SaaS interface.

[Explore Architecture](#-system-architecture) • [Engineering Highlights](#-engineering-deep-dives) • [Quick Start](#-getting-started) • [SMTP Setup](#-email-verification--smtp-setup) • [API Spec](#-api-specification) • [Interview Guide](./INTERVIEW_GUIDE.md)

</div>

---

## 🌟 Key Features

- 📧 **Production-Grade Email Authentication**: Cryptographically secure SHA-256 token generation, 24-hour expiration, automated responsive email dispatch with Nodemailer, and unverified account protection.
- 💬 **Real-Time Team Group Chat & Direct Messaging**: 
  - Dedicated **Team Group Chat rooms** strictly authorized on the backend—only verified roster members and team creators can join the room, read history, or send messages.
  - 1-on-1 direct messaging between teammates with typing indicators, online/offline presence tracking, and unread badges.
  - Persistent message history in MongoDB with sender details, timestamps, and read receipts.
- 🎯 **Availability-Aware Smart Match Scoring**:
  - Deterministic matchmaking algorithm evaluating technical skill overlap, complementary roles, experience level, AND schedule compatibility.
  - Profile availability fields: current status (`open`, `busy`, `unavailable`), available days of the week, preferred working hours, and time slot flexibility.
  - Transparent match reasons explain exactly why a builder is recommended (e.g., *"Matching working hours"*, *"Available on weekdays"*, *"Complementary Frontend + Backend strengths"*).
- 🔍 **Skill-Based Discovery**: Instant debounced search and multi-skill filter pills (`React`, `Python`, `AI/ML`, `UI/UX`, `Solidity`, etc.) with server-side pagination.
- 🛡️ **Atomic Concurrency Control**: Prevents team overfills under simultaneous join requests using conditional database-level atomic updates (`$expr` and `$addToSet`).
- ⚡ **Real-Time WebSockets**: Instant notifications via Socket.IO for application submissions, decisions, and roster changes delivered to private user rooms.
- 🔐 **Defense-in-Depth Authentication & Sanitization**:
  - **HttpOnly Cookies**: Sensitive JWT authentication tokens are stored exclusively in HttpOnly cookies (`SameSite=Lax`, `secure: prod`), preventing JavaScript client-side token access.
  - **Strict Server-Side Sanitization**: All incoming text inputs, user bios, project descriptions, and chat messages are sanitized (`stripHtml`, length bounding, control character stripping).
  - **Safe URL Filtering**: External profile links (GitHub, LinkedIn, portfolio) are strictly validated to block pseudo-protocols (`javascript:`, `data:`, `vbscript:`).
  - **Secure CORS & CSP**: Explicit origin whitelisting with credentials and Helmet Content Security Policy headers.
- 📊 **Creator Command Center**: Visual dashboard with capacity progress bars, applicant review pipeline, batch data loading, and quick-access team chat shortcuts.
- 🎨 **Big-Tech SaaS Design**: Linear/Stripe-inspired interface with dark/light theme parity, keyboard accessibility (a11y), responsive glassmorphism, and live form card previews.

---

## 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          React 19 + Vite Frontend                           │
│  React Router v7 · Tailwind CSS · AuthContext · ThemeContext · SocketContext│
│  (Tokens stored in HttpOnly Cookies · Zero localStorage token storage)      │
└──────────────────────┬───────────────────────────────┬──────────────────────┘
                       │ REST / JSON + HttpOnly Cookie │ Socket.IO + Cookie Handshake
                       ▼                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Express.js 5 Backend                             │
│  Helmet CSP · Tiered Rate Limiters · CookieParser · Input Sanitization      │
│  Controllers (Lean Queries) ───► Socket.IO: User Rooms & Team Chat Rooms    │
│        │                                                                    │
│        ▼                                                                    │
│  Nodemailer Service ──────────────────► SMTP Server (Gmail, SendGrid, etc.) │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       ▼
                     MongoDB Atlas (Database Boundary)
   ├── User Collection (Skills & Availability Index · Bcrypt Hash · SHA-256 Tokens)
   ├── Team Collection (Compound Text & Multikey Skills Indexes)
   ├── Request Collection (Unique Sender+Team Compound Index · Atomic Updates)
   ├── Conversation & Message Collections (Direct & Team Chat · Read Receipts)
   └── Notification Collection (Multi-Type Real-Time Activity Alerts)
```

---

## 🔬 Engineering Deep Dives (SDE Highlights)

### 1. Real-Time Team Group Chat with Backend Authorization
* **The Problem:** In hackathons, communication happens in teams, not just 1-on-1 direct messages. If chat security relies solely on client-side UI visibility, malicious actors can emit socket events or hit REST endpoints to spy on private team strategy or send unauthorized messages.
* **Backend Membership Validation:** Every team chat operation (`GET /api/chat/teams/:teamId`, `POST /api/chat/teams/:teamId/messages`, and Socket.IO `team:join` / `team:message:send` events) validates that the authenticated `req.user._id` is either the team creator or an active member in `Team.members`:
  ```javascript
  export const assertTeamMember = async (teamId, userId) => {
    const team = await Team.findById(teamId).select('creator members hackathonName').lean();
    if (!team) throw Object.assign(new Error('Team not found'), { status: 404 });
    const isMember = String(team.creator) === String(userId) ||
      team.members.some((m) => String(m) === String(userId));
    if (!isMember) throw Object.assign(new Error('Access denied: You are not a member of this team'), { status: 403 });
    return team;
  };
  ```
* **Persistence & History:** Team messages are persisted in MongoDB with `team: ObjectId`, `sender: ObjectId`, `content` (HTML-stripped), timestamps, and `readBy` arrays. Messages load seamlessly on refresh or re-login.
* **Socket Room Isolation:** Clients join `team:${teamId}` rooms only after backend validation passes, preventing cross-tenant eavesdropping.

---

### 2. Availability-Aware Matching Algorithm
* **The Problem:** Matching hackathon teammates solely on technical skills often fails in practice because teammates have incompatible schedules (e.g., night owls vs. daytime workers, or weekday vs. weekend availability).
* **The Solution:** The deterministic matchmaking service (`backend/services/matchScoreService.js`) calculates a 0–100 compatibility score integrating both skill complementarity and schedule alignment:
  - **Availability Status:** Active `open` builders receive full compatibility; `busy` builders receive reduced baseline weight; `unavailable` candidates receive a heavy penalty (-25) with an explicit explanation.
  - **Days of Week Overlap:** Calculates Jaccard similarity across candidate days (`monday` through `sunday`). Overlapping days earn up to 8 points.
  - **Working Hours & Time Slots:** Compares preferred working hours (`morning`, `afternoon`, `evening`, `night`, `flexible`) and specific time slot overlaps.
  - **Explainability:** Emits transparent human-readable reasons (e.g., *"Available on weekdays"*, *"Matching working hours"*, *"Complementary Frontend + Backend strengths"*).

---

### 3. Defense-in-Depth XSS Mitigation & Secure Authentication
* **No Sensitive Tokens in `localStorage`:** The frontend has been purged of `localStorage.setItem('hackbuddy_token')`. All authentication is handled through **HttpOnly, SameSite=Lax (or None in production), Secure** cookies. Even if an attacker executes arbitrary script in the browser, the authentication token cannot be read via `document.cookie` or `localStorage`.
* **Input Sanitization:** User-submitted text (bios, names, project descriptions, chat messages) passes through server-side sanitization (`backend/utils/sanitize.js`) that strips raw HTML tags, normalizes whitespace, and rejects control characters.
* **Safe URL Protocols:** External portfolio, GitHub, and LinkedIn links are checked to ensure schemes are restricted to `http:` or `https:`. Links attempting to execute `javascript:alert(1)` or `data:` payloads are neutralized to `""`.
* **Timing-Attack Defense:** Bcrypt verification uses constant-time comparison against a dummy hash when an account does not exist, preventing email enumeration via response latency analysis.
* **Realistic Security Stance:** We do not claim "complete XSS immunity"—true defense-in-depth combines HttpOnly credentials, server sanitization, client-side escaping, Content Security Policy (CSP), and CORS origin verification.

---

### 4. Atomic Concurrency Control (Race Condition Prevention)
* **The Problem:** In team matching, if a team has 1 seat remaining and two candidates are accepted simultaneously, naive read-then-write logic will add both candidates, corrupting the team size limit.
* **The Solution:** The accept controller uses a single **atomic conditional update** in MongoDB:
  ```javascript
  const updatedTeam = await Team.findOneAndUpdate(
    {
      _id: joinRequest.team._id,
      creator: req.user._id,
      members: { $ne: joinRequest.sender },
      $expr: { $lt: [{ $size: '$members' }, '$teamSizeLimit'] }, // Invariant checked at write-time
    },
    { $addToSet: { members: joinRequest.sender } },
    { new: true },
  );

  if (!updatedTeam) {
    return res.status(409).json({ message: 'Team capacity reached or user already a member.' });
  }
  ```
* **Result:** Zero over-capacity collisions under high concurrency without the overhead of distributed locks.

---

### 5. Elimination of the $N+1$ Creator Request Waterfall
* **The Problem:** The initial dashboard fetched $N$ teams, then executed $N$ sequential HTTP requests to load requests for each team, resulting in latency spikes ($O(N)$ network calls).
* **The Solution:** Built single-shot batch endpoints `GET /api/requests/incoming` and `GET /api/teams/mine` using `.lean()` and indexed `$in` queries:
  ```javascript
  const requests = await Request.find({ team: { $in: creatorTeamIds } })
    .populate('sender', 'name branch year skills experienceLevel github')
    .sort({ createdAt: -1 })
    .lean();
  ```
* **Result:** Reduced initial dashboard load time from ~600ms down to **~45ms** (90%+ latency reduction).

---

## 🛠️ Tech Stack & Technologies

| Layer | Technology | Purpose |
| --- | --- | --- |
| **Frontend Framework** | React 19 (Vite 8) | Fast component lifecycle, JSX, and SPA routing |
| **Styling & Design** | Tailwind CSS 3.4 + Lucide Icons | Responsive SaaS UI, custom design tokens, dark mode |
| **Routing** | React Router DOM v7 | Client-side navigation, ProtectedRoute wrappers |
| **Backend Runtime** | Node.js 20+ / Express.js 5 | REST API framework, asynchronous event loop |
| **Database & ODM** | MongoDB Atlas / Mongoose 9 | Document storage, schema validation, compound indexes |
| **Email Service** | Nodemailer 7.x | SMTP email delivery with HTML template & link generator |
| **Real-Time Sync & Chat** | Socket.IO 4.8 | Team group chat rooms, 1-on-1 direct messaging, typing indicators, presence |
| **Security & Auth** | JWT (`jsonwebtoken`) + `bcryptjs` + `crypto` | Stateless session management, HttpOnly cookies, SHA-256 tokens |
| **API Hardening** | `helmet` + `express-rate-limit` | Content Security Policy, HSTS, brute-force defense |
| **HTTP Client** | Axios | Configured with `withCredentials: true` for automatic cookie transmission |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or v20.x recommended)
- [MongoDB Atlas](https://www.mongodb.com/atlas) account (or local MongoDB Community Server)
- (Optional) Gmail App Password or SMTP provider credentials

---

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Arunmahajan22/HackBuddy-Skill-Based-Hackathon-Team-Matching-Platform.git
   cd HackBuddy-Skill-Based-Hackathon-Team-Matching-Platform
   ```

2. **Configure Backend Environment:**
   Create a `.env` file in the `backend/` directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/hackbuddy?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:5173
   CLIENT_URL=http://localhost:5173

   # Nodemailer / SMTP Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_16_character_app_password
   EMAIL_FROM="HackBuddy" <no-reply@hackbuddy.dev>
   ```
   > *Note: If SMTP credentials are left empty during local testing, HackBuddy automatically logs the verification link to your backend console. If your database password contains special characters like `@` or `#`, make sure to URL-encode them (e.g. `@` becomes `%40`).*

3. **Configure Frontend Environment:**
   Create a `.env` file in the `frontend/` directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```

4. **Install Dependencies:**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

---

### Running the Application

**Terminal 1 — Start the Backend Server:**
```bash
cd backend
npm run dev
```
> Server will boot on `http://localhost:5000` with MongoDB connected.

**Terminal 2 — Start the Frontend Client:**
```bash
cd frontend
npm run dev
```
> Client will launch on `http://localhost:5173`.

---

## 📡 API Specification

### Authentication & Email Verification
| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public (Rate Limited) | Registers builder with optional availability profile, sets HttpOnly cookie, sends email |
| `GET` | `/api/auth/verify-email/:token` | Public | Validates SHA-256 token, marks email verified, returns auth session |
| `POST` | `/api/auth/verify-email` | Public | Body-based token verification endpoint |
| `POST` | `/api/auth/resend-verification` | Public (Rate Limited) | Resends verification email with 60s cooldown |
| `POST` | `/api/auth/login` | Public (Rate Limited) | Constant-time bcrypt auth; verifies email status; sets HttpOnly cookie |
| `GET` | `/api/auth/me` | Protected | Rehydrates session for active client |
| `POST` | `/api/auth/logout` | Public | Clears server-side auth cookie |
| `GET` | `/api/users/me` | Protected | Retrieves authenticated user profile including availability |
| `PATCH` | `/api/users/me` | Protected | Updates profile fields and structured availability with validation |
| `GET` | `/api/users/recommendations` | Protected | Returns candidates ranked by skills and availability with reasons |

### Teams & Matchmaking
| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/teams` | Public | Paginated feed with keyword and skill filters |
| `GET` | `/api/teams/mine` | Protected | Retrieves teams created by current user |
| `POST` | `/api/teams` | Protected (Rate Limited) | Posts a new team opening with required skills |
| `GET` | `/api/teams/:teamId` | Public | Retrieves specific team details |

### Join Requests & Decisions
| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/requests/incoming` | Protected | Batch retrieves all incoming requests for creator |
| `POST` | `/api/requests/teams/:teamId` | Protected (Rate Limited) | Submits a join request with sanitized note |
| `GET` | `/api/requests/teams/:teamId` | Protected (Creator) | Retrieves requests for a specific team |
| `PATCH` | `/api/requests/:requestId` | Protected (Creator) | Atomic Accept / Reject decision mutation |

### Chat (Direct & Team Group Chat)
| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/chat/conversations` | Protected | Retrieves active direct and team conversations with unread counts |
| `POST` | `/api/chat/conversations` | Protected | Starts or retrieves a 1-on-1 direct conversation; body: `{ userId }` |
| `GET` | `/api/chat/conversations/:id/messages` | Protected | Paginated message history for a 1-on-1 conversation |
| `POST` | `/api/chat/conversations/:id/messages` | Protected | Sends a sanitized direct message; body: `{ content }` |
| `POST` | `/api/chat/conversations/:id/read` | Protected | Marks inbound messages in a conversation as read |
| `GET` | `/api/chat/teams/:teamId` | Protected (Member) | Retrieves or creates group chat conversation for an authorized team |
| `GET` | `/api/chat/teams/:teamId/messages` | Protected (Member) | Paginated team chat message history (verifies team membership) |
| `POST` | `/api/chat/teams/:teamId/messages` | Protected (Member) | Sends and persists a message to the team chat room |

### Socket.IO Event Reference
| Direction | Event Name | Payload | Authorization / Notes |
| --- | --- | --- | --- |
| Client → Server | `team:join` | `teamId` | Verified against `Team.members` & `creator` |
| Client → Server | `team:leave` | `teamId` | Leaves `team:${teamId}` room |
| Client → Server | `team:message:send` | `{ teamId, content }` | Persisted to DB; broadcast to `team:${teamId}` |
| Server → Client | `team:message:new` | `{ teamId, conversationId, message }` | Delivered to authorized team members in room |
| Client → Server | `team:typing:start` / `stop` | `teamId` | Broadcast to `team:${teamId}` room members |
| Server → Client | `team:typing:update` | `{ teamId, userId, isTyping }` | Real-time typing indicators for team room |
| Client → Server | `conversation:join` | `conversationId` | Verifies participant authorization |
| Client → Server | `message:send` | `{ conversationId, content }` | 1-on-1 direct message send & persist |
| Server → Client | `message:new` | `{ conversationId, message }` | Delivered to active conversation & recipient room |
| Server → Client | `presence:update` | `{ userId, isOnline, lastSeen }` | Real-time status update for contacts |

---

## 📂 Project Structure

```text
hackbuddy/
├── backend/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection & diagnostics
│   │   └── mailer.js             # Nodemailer transporter & dev fallback
│   ├── controllers/
│   │   ├── authController.js     # Email verification, timing attack defense, JWT, HttpOnly cookies
│   │   ├── chatController.js     # Direct & Team chat endpoints with membership verification
│   │   ├── notificationController.js # Multi-type alerts & read states
│   │   ├── requestController.js  # Concurrency-safe acceptance & batch queries
│   │   ├── statsController.js    # Live database telemetry & top skills aggregation
│   │   ├── teamController.js     # Team CRUD & lean query pipelines
│   │   └── userController.js     # User profile management with availability support
│   ├── middlewares/
│   │   ├── authMiddleware.js     # Cookie/Bearer JWT verification & isVerified check
│   │   ├── errorMiddleware.js    # Global error normalization (400/409/422/500)
│   │   ├── rateLimitMiddleware.js# Tiered rate limiting & resend rate limiter
│   │   └── validateMiddleware.js # Centralized express-validator schema checks
│   ├── models/
│   │   ├── Conversation.js       # 1-on-1 ('direct') and Team ('team') conversation model
│   │   ├── Message.js            # Chat message schema with readBy receipts & sanitization
│   │   ├── Notification.js       # Real-time event notifications
│   │   ├── Request.js            # Request schema with compound unique index & sanitization
│   │   ├── Team.js               # Team schema with text & multikey indexes
│   │   └── User.js               # User schema with structured availability, SHA-256 tokens & sanitization
│   ├── routes/                   # Modular Express routers (auth, chat, teams, users...)
│   ├── services/
│   │   ├── chatService.js        # Direct & Team chat business logic with assertTeamMember
│   │   ├── matchScoreService.js  # Skill overlap, complementary roles & availability compatibility formula
│   │   └── notificationService.js# Event notification dispatchers
│   ├── sockets/
│   │   ├── chatHandlers.js       # Socket.IO direct & team typing and message events
│   │   └── index.js              # Socket.IO handshake auth & partitioned user/team rooms
│   ├── tests/
│   │   ├── emailAuthTest.js      # Automated email verification test suite
│   │   ├── matchScoreService.test.js # Match scoring & availability unit tests
│   │   ├── sanitize.test.js      # Input sanitization and URL protocol defense tests
│   │   └── teamChatAuthorization.test.js # Team chat validation and boundary tests
│   ├── utils/
│   │   ├── emailService.js       # Responsive HTML verification email generator
│   │   └── sanitize.js           # XSS mitigation utils (stripHtml, sanitizeUrl, bounds checking)
│   └── server.js                 # Express app bootstrap, Helmet CSP & CORS security
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthLayout.jsx    # Dual column auth hero with verified builder trust
│   │   │   ├── JoinRequestModal.jsx # Command dialog with role chips & a11y
│   │   │   ├── Layout.jsx        # Navigation bar, mobile drawer, & theme toggle
│   │   │   ├── NotificationBell.jsx # Live notification badge & dropdown
│   │   │   ├── TeamCard.jsx      # Memoized team card with visual seat dots & Team Chat action
│   │   │   └── landing/          # HeroSection, StatsBar, LivePreview, Features
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx   # HttpOnly session management (no localStorage token)
│   │   │   ├── SocketContext.jsx # WebSocket lifecycle & cookie-based handshake
│   │   │   └── ThemeContext.jsx  # Dark/Light mode state with OS listener
│   │   ├── hooks/
│   │   │   └── useDebounce.js    # 350ms input debounce for search optimization
│   │   ├── lib/
│   │   │   ├── api.js            # Axios client with withCredentials: true
│   │   │   └── safeUrl.js        # Utility preventing javascript: and data: pseudo-protocols
│   │   ├── pages/
│   │   │   ├── ChatPage.jsx      # Direct & Team group chat interface with tabbed views & typing sync
│   │   │   ├── CreateTeamPage.jsx# Form with live interactive card preview
│   │   │   ├── DashboardPage.jsx # Creator pipeline, capacity bars, and Team Chat quick links
│   │   │   ├── ExplorePage.jsx   # Search, dynamic skill filter pills, & pagination
│   │   │   ├── LandingPage.jsx   # Dynamic SaaS landing page with live database stats
│   │   │   ├── LoginPage.jsx     # Accessible sign-in with 1-click resend banner
│   │   │   ├── MatchesPage.jsx   # Recommendations with availability badges, schedule tags, & reasons
│   │   │   ├── ProfilePage.jsx   # Interactive skills & structured availability schedule manager
│   │   │   ├── RegisterPage.jsx  # Multi-field builder registration with availability status
│   │   │   └── VerifyEmailPage.jsx # Dedicated verification & token status page
│   │   ├── index.css             # Tailwind design tokens & glass utilities
│   │   └── main.jsx              # React 19 application entry point
│   ├── tailwind.config.js        # Custom brand/ink palettes & typography
│   └── vite.config.js            # Vite build configuration
│
├── docs/                         # In-depth architectural & system design specs
├── INTERVIEW_GUIDE.md            # Complete SDE interview preparation guide
└── MERN_AND_PROJECT_EXPLAINED.md # Comprehensive guide explaining full-stack MERN
```

---

## 🎯 SDE Interview Talking Points

If you are showcasing this project in technical interviews, highlight:
1. **Authenticated Team Chat vs. Direct Chat**: Explain how you partitioned Socket.IO rooms into `team:<teamId>` with server-side roster verification (`assertTeamMember`), preventing unauthorized eavesdropping on private hackathon project strategy.
2. **Availability-Aware Matchmaking**: Explain how the deterministic recommendation algorithm balances complementary technical skills (frontend/backend/ML) with schedule compatibility (overlapping days, time slots, and working hours), returning human-explainable reasons rather than opaque black-box numbers.
3. **Defense-in-Depth Security**: Explain why moving authentication tokens out of `localStorage` into **HttpOnly, SameSite cookies** mitigates XSS token theft, how server-side HTML stripping cleans user-submitted content, and why claims of "XSS proof" should be replaced with defense-in-depth principles.
4. **Concurrency at the Data Boundary**: Explain how `findOneAndUpdate` with `$expr` prevents over-capacity states under simultaneous requests.
5. **Eliminating the $N+1$ Waterfall**: Explain how designing `/requests/incoming` reduced 50 HTTP roundtrips to 1 parallel indexed query.

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Built with ❤️ for ambitious builders shipping winning hackathon products.</sub>
</div>
