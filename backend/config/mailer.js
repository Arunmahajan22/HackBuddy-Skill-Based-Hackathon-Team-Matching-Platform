const nodemailer = require('nodemailer');

/**
 * Creates and configures the Nodemailer transporter using environment variables.
 * If SMTP credentials are not provided (e.g., local dev/testing without active SMTP),
 * it creates a fallback mock transporter that logs the email link to the console.
 */
const createTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_PASS } = process.env;
  const pass = SMTP_PASSWORD || SMTP_PASS;

  if (SMTP_HOST && SMTP_USER && pass) {
    const port = parseInt(SMTP_PORT, 10) || 587;
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465, // true for port 465 (SSL), false for 587 (TLS)
      auth: {
        user: SMTP_USER,
        pass,
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    });
  }

  // Fallback transporter for local development / testing when SMTP variables are not set
  return {
    sendMail: async (mailOptions) => {
      console.log('\n------------------------------------------------------------');
      console.log('📧 [MOCK EMAIL TRANSPORTER] SMTP is not configured in .env');
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log('Email Body / Verification Link:');
      console.log(mailOptions.text || mailOptions.html);
      console.log('------------------------------------------------------------\n');
      return { messageId: `mock-${Date.now()}` };
    },
    verify: async () => true,
  };
};

const transporter = createTransporter();

module.exports = { transporter, createTransporter };
