# Authentication, Security, and XSS Mitigation

## Registration and Email Verification

- `POST /api/auth/register` validates builder registration credentials and optional availability data.
- Passwords are encrypted using `bcrypt` with 12 salt rounds in a Mongoose pre-save hook.
- A cryptographically random verification token is generated (`crypto.randomBytes(32).toString('hex')`) and its SHA-256 digest is stored with a 24-hour expiration (`verificationTokenExpires`).
- Nodemailer dispatches an automated verification email containing the verification link (with fallback logging in development if SMTP credentials are unset).
- `GET /api/auth/verify-email/:token` validates the SHA-256 digest, marks `isVerified: true`, and initiates an authenticated session.
- Users cannot log in or access protected routes until their email is verified (`isVerified === true`).

## Session Management & Cookie Security

- On successful authentication (login or email verification), the backend signs a JSON Web Token (JWT) with the user ID in the `sub` claim.
- The JWT is issued in an **HttpOnly cookie** (`hackbuddy_token`):
  - `httpOnly: true` (prevents JavaScript access via `document.cookie`)
  - `secure: process.env.NODE_ENV === 'production'`
  - `sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'`
  - `maxAge: 7 * 24 * 60 * 60 * 1000` (7 days)
- Sensitive authentication tokens are **never stored in `localStorage`**. The frontend relies entirely on HttpOnly cookie persistence with Axios `withCredentials: true` and Socket.IO cookie handshake.

## Defense-in-Depth XSS Mitigation

We do not make misleading claims of "100% XSS immunity". Instead, HackBuddy adopts realistic defense-in-depth principles:
1. **HttpOnly Storage:** Storing JWT tokens in HttpOnly cookies prevents an attacker running a malicious script from extracting authentication credentials.
2. **Server-Side Input Sanitization:** All user inputs (bios, project names, messages, notes) are sanitized on the backend using `stripHtml`, removing `<script>`, `<iframe>`, and HTML markup.
3. **Safe URL Validation:** External profile URLs (GitHub, LinkedIn, Portfolio) are checked against a whitelist of valid protocols (`http:`, `https:`). Any attempt to pass `javascript:` or `data:` pseudo-protocols is neutralized.
4. **Content Security Policy (CSP):** Helmet configures secure HTTP response headers, restricting script sources and frame ancestors.
5. **Constant-Time Timing-Attack Defense:** Dummy bcrypt verification executes when an email is not registered to prevent response-latency user enumeration attacks.
