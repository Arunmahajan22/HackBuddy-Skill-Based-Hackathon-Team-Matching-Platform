# HackBuddy Project Overview

## Problem and motivation

Hackathon participants often know what they can build but lack a small, balanced team. Finding collaborators through informal chats makes it hard to assess skills, availability, project interests, and whether a roster still has capacity.

HackBuddy is a teammate-discovery application for students and builders. A user creates a developer portfolio, publishes or explores team openings, applies to join, and receives the decision in real time. Accepted members can then use direct chat.

## Target users

- Hackathon participants looking for teammates.
- Team creators recruiting complementary skills.
- Builders who want a concise portfolio and explainable teammate recommendations.

## Core features

- JWT-authenticated user accounts and editable developer portfolios.
- Team creation, text/skill filtering, capacity display, and join requests.
- Atomic acceptance that prevents a team exceeding its configured size.
- Explainable, backend-calculated Smart Match scores for public profiles.
- Direct chat restricted to users who share an accepted team roster.
- Persisted, real-time notification inbox for requests, decisions, and messages.

## Actual technology stack

- Frontend: React 19, Vite, React Router, Tailwind CSS, Axios, Socket.IO Client.
- Backend: Node.js, Express 5, Mongoose, Socket.IO.
- Database: MongoDB.
- Security libraries: bcryptjs, jsonwebtoken, Helmet, cookie-parser, express-rate-limit, express-validator, CORS, dotenv.

## System outline

React uses REST for durable reads and writes. Socket.IO augments it with authenticated push events for request updates, chat, notifications, and presence. Express controllers use Mongoose models to persist MongoDB data.

## Future improvements

Useful next steps, not currently implemented, include pagination for all user recommendations, a shared cache such as Redis for multi-instance deployment, real email verification, a dedicated invitation workflow, tests that run against an isolated database, file-upload storage for avatars, and feedback-driven matching weights.
