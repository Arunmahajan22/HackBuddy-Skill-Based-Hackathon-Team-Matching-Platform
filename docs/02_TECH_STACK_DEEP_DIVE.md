# Tech Stack Deep Dive

## Architectural rationale

HackBuddy uses a two-process MERN architecture: a React single-page application consumes an Express API backed by MongoDB, while Socket.IO shares the API's HTTP server for low-latency notifications. This is deliberately pragmatic for a hackathon-oriented product: JavaScript is used end-to-end, the document model maps naturally to user/team/request resources, and realtime communication is added without operating a separate messaging service.

```text
React + Vite SPA  ── HTTPS/REST ──> Express API ──> Mongoose ──> MongoDB
       │                                  │
       └──── Socket.IO WebSocket ─────────┘
```

## Why MERN

### MongoDB + Mongoose

The entities evolve quickly in an early social/collaboration product. MongoDB lets profiles gain optional fields such as GitHub, bio, and skills without join-table migration overhead. Mongoose restores discipline by defining required fields, enums, length bounds, references, lifecycle hooks, indexes, and serialization behavior.

References are used rather than duplicating user data into every team:

- `Team.creator` and `Team.members` point to `User` documents.
- `Request.sender` points to a `User`; `Request.team` points to a `Team`.
- Controllers call `populate()` selectively, returning only the public profile fields needed by the screen.

For an interview, acknowledge the tradeoff: relational databases make some cross-entity reporting simpler. MongoDB is a strong fit here because the dominant operations are resource-centric reads and controlled reference traversal, not financial-grade multi-row accounting.

### Express + Node.js

Express is intentionally thin: routes compose validation and authorization, controllers own the use case, models own persistence invariants, and centralized middleware formats failures. Node is particularly effective here because REST handling and Socket.IO connections are I/O-bound and JavaScript object shapes pass directly between the API and client.

### React + Vite

React supports component-level state for forms, loading/error states, dialogs, and live dashboard refreshes. Vite gives a fast development loop and a static production bundle without adding framework-specific server rendering complexity. React Router separates public auth routes from authenticated workspace routes through `ProtectedRoute`.

## Backend package breakdown

| Package | Responsibility | Engineering benefit |
| --- | --- | --- |
| `express` | HTTP routing and middleware pipeline | Small, composable REST layer |
| `mongoose` | MongoDB schemas, references, validation, indexes | Object-level domain invariants over a flexible database |
| `dotenv` | Environment configuration | Keeps secrets and deployment configuration outside code |
| `cors` | Cross-origin API policy | Explicit frontend-origin boundary |
| `helmet` | Security response headers | Reduces common browser attack surface by default |
| `bcryptjs` | Password hashing/comparison | Passwords are never stored or compared as plaintext |
| `jsonwebtoken` | JWT signing and verification | Stateless REST and socket authentication |
| `express-validator` | Request-level validation | Rejects malformed data before it reaches controllers/models |
| `socket.io` | WebSocket transport and rooms | Targeted, reconnection-capable realtime events |

## Frontend package breakdown

| Package | Responsibility |
| --- | --- |
| `react`, `react-dom` | Component rendering and state model |
| `vite`, `@vitejs/plugin-react` | Development server and optimized build |
| `react-router-dom` | Client-side routes and access gates |
| `axios` | API client, base URL, bearer-token interceptor, 401 handling |
| `socket.io-client` | Authenticated realtime connection and event subscriptions |
| `tailwindcss`, `postcss`, `autoprefixer` | Utility-first responsive styling pipeline |
| `lucide-react` | Consistent, lightweight SVG icon components |
| `clsx`, `tailwind-merge` | Conditional class composition without conflicting Tailwind utilities |

## UI architecture and choices

### Theme system

`ThemeContext` selects initial theme from `localStorage` or the OS preference, applies the `dark` class to `<html>`, and persists changes. Tailwind's `darkMode: 'class'` makes every component deterministic: server/browser system preference cannot unexpectedly override the explicit user choice.

### Authentication state

`AuthContext` owns the current user and session lifecycle. A successful auth response persists the JWT and user object. Axios adds `Authorization: Bearer <token>` to every API request. On a `401`, the response interceptor removes stale session data and broadcasts an app-level logout event, preventing the UI from showing a user as authenticated after expiry.

### Realtime state

`SocketContext` creates a socket only when authenticated and passes the JWT in the Socket.IO auth handshake. It converts server events into non-blocking toast state and increments an event version. The creator dashboard watches that version and reloads its data, favoring a simple source of truth in MongoDB over manually reconciling multiple local entity graphs.

### Premium SaaS visual system

The interface uses neutral/slate backgrounds with indigo-violet emphasis. Glass cards use translucent backgrounds, borders, blur, and soft shadows; they remain legible in both themes. Components use:

- mobile-first grids and breakpoints;
- stateful buttons with hover, focus, and disabled styles;
- skeletons for network loading;
- designed empty/error states instead of blank screens;
- modal layering and an accessible dialog role for join requests.

## Separation of concerns

```text
Route         validates input + attaches middleware
Controller    enforces use-case/authorization rules
Model         enforces persistent shape and indexes
Middleware    authenticates/formats failures
Socket layer  authenticates connections + owns room topology
Context       owns cross-page client state
Page          orchestrates API calls and UI composition
Component     renders reusable visual behavior
```

This separation is a useful interview point: it makes units independently testable, prevents routes from becoming business-logic dumping grounds, and permits future transport changes without rewriting persistence rules.
