# Email Verification Status

HackBuddy does not currently implement email verification.

- `nodemailer` is not a backend dependency.
- No SMTP environment variables are read.
- No verification token is generated, stored, hashed, expired, emailed, or consumed.
- `User` has no verified-email status field.

The current registration flow only validates the syntactic email format and uniqueness. It must not be represented in an interview as mailbox verification.

## Safe future design

If added later, use a cryptographically random token, store only a hash plus expiration, email a one-time HTTPS link through an SMTP provider, and mark the account verified only after comparing the submitted token hash. Rate-limit resend and verification attempts, avoid revealing whether an email exists, and never place raw verification tokens or SMTP credentials in logs. This is a proposed design, not current HackBuddy behavior.
