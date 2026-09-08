# Authentication and Authorization

## Registration and login

`POST /api/auth/register` validates account and initial profile fields, creates a `User`, and hashes its password in a Mongoose pre-save hook using bcrypt with 12 salt rounds. `POST /api/auth/login` selects the password hash explicitly and compares it with bcrypt. A dummy bcrypt comparison is used when an account is absent to reduce account-enumeration timing differences.

On success, the server signs a JWT whose subject (`sub`) is the user ID. It returns the token and sanitized user object, and sets `hackbuddy_token` as an HTTP-only cookie. The cookie is `secure` in production and uses `SameSite=Lax` locally (`SameSite=None` in production).

## Session and protected routes

`protect` first checks the cookie, then a `Authorization: Bearer <token>` header. It verifies the JWT, reloads the user without the password, and attaches it to `req.user`. Expired and malformed tokens return 401 responses. The frontend rehydrates its session through `GET /api/auth/me`.

Authorization is feature-specific after authentication: team creators decide requests; chat checks conversation membership and a currently shared team; notifications query by the authenticated recipient; profile updates target only `req.user._id`.

## Email verification status

Email verification is **not implemented**. There is no `emailVerified` field, verification-token collection, Nodemailer dependency, SMTP configuration, or verification endpoint. Registration validates the email format but does not verify mailbox ownership.
