const { transporter } = require('../config/mailer');

/**
 * Sends a production-grade verification email to a newly registered or requesting user.
 *
 * @param {Object} options
 * @param {string} options.to Recipient email address
 * @param {string} options.name Recipient's full name
 * @param {string} options.token Cryptographically secure verification token
 * @returns {Promise<Object>} SendMail result
 */
const sendVerificationEmail = async ({ to, name, token }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const verificationUrl = `${clientUrl}/verify-email/${token}`;
  const senderEmail = process.env.EMAIL_FROM || '"HackBuddy" <no-reply@hackbuddy.dev>';
  const firstName = name ? name.split(' ')[0] : 'Builder';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your HackBuddy account</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }
    .container {
      max-width: 560px;
      margin: 40px auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
      padding: 32px 24px;
      text-align: center;
      color: #ffffff;
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .content {
      padding: 32px 28px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    .button {
      display: inline-block;
      background: #4f46e5;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      padding: 14px 32px;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
    }
    .fallback-box {
      background: #f1f5f9;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 12px;
      word-break: break-all;
      color: #475569;
      margin-top: 24px;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding: 24px 28px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      background: #fafafa;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">⚡ HackBuddy</h1>
      <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">The Teammate Platform for Hackathon Makers</p>
    </div>
    <div class="content">
      <h2 class="greeting">Welcome, ${firstName}! 👋</h2>
      <p>Thanks for joining HackBuddy. To complete your registration and start discovering teammates or posting project opportunities, please verify your email address.</p>
      
      <div class="button-container">
        <a href="${verificationUrl}" target="_blank" class="button">
          Verify My Email Address →
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b;">
        This verification link will expire in <strong>24 hours</strong>. If the button above doesn't work, copy and paste this link into your web browser:
      </p>
      <div class="fallback-box">
        <a href="${verificationUrl}" style="color: #4f46e5; text-decoration: none;">${verificationUrl}</a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;">If you did not create an account on HackBuddy, please ignore this email.</p>
      <p style="margin: 0;">© ${new Date().getFullYear()} HackBuddy. Built for teams that ship together.</p>
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `
Welcome to HackBuddy, ${firstName}!

Please verify your email address to activate your account by opening the following link:
${verificationUrl}

This link is valid for 24 hours.

If you did not create a HackBuddy account, you can safely disregard this email.
  `.trim();

  const mailOptions = {
    from: senderEmail,
    to,
    subject: 'Verify your email address — HackBuddy',
    text: textContent,
    html: htmlContent,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail };
