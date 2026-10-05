/**
 * Zentra Digital - Brevo Transactional Email Service
 * Handles password reset OTPs, system alerts, and notification emails.
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Sends a high-security 6-digit OTP verification email for password resets.
 * 
 * @param {Object} params
 * @param {string} params.toEmail - Recipient email address
 * @param {string} [params.toName] - Recipient display name
 * @param {string} params.otp - 6-digit numeric verification code
 * @param {number} [params.expiresInMinutes=10] - Validity duration in minutes
 * @returns {Promise<{success: boolean, messageId?: string, error?: string, ipNotice?: string}>}
 */
export async function sendPasswordResetOtp({ toEmail, toName, otp, expiresInMinutes = 10 }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error('[EmailService] Missing BREVO_API_KEY in environment variables.');
    return {
      success: false,
      error: 'Brevo API key is not configured in backend/.env'
    };
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'contact@zentradigital.agency';
  const senderName = process.env.BREVO_SENDER_NAME || 'Zentra Digital Security';
  const recipientName = toName || toEmail.split('@')[0];

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zentra Digital - Password Reset Verification</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0c0d0e;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #E4E4E7;
    }
    .wrapper {
      max-width: 580px;
      margin: 40px auto;
      background-color: #141416;
      border: 1px solid #27272A;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }
    .header {
      background: linear-gradient(180deg, #1C1917 0%, #141416 100%);
      padding: 32px 36px 20px 36px;
      border-bottom: 1px solid #27272A;
      text-align: center;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 0.15em;
      color: #FFFFFF;
      margin: 0;
      text-transform: uppercase;
    }
    .brand-title span {
      color: #E50914;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #A1A1AA;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-top: 6px;
    }
    .content {
      padding: 36px;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #FFFFFF;
      margin: 0 0 14px 0;
    }
    .paragraph {
      font-size: 14px;
      line-height: 1.6;
      color: #D4D4D8;
      margin: 0 0 24px 0;
    }
    .otp-card {
      background: linear-gradient(135deg, rgba(229, 9, 20, 0.08) 0%, rgba(20, 20, 22, 0.95) 100%);
      border: 1px solid #E50914;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 28px 0;
    }
    .otp-label {
      font-size: 11.5px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #A1A1AA;
      margin-bottom: 10px;
      font-weight: 600;
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 40px;
      font-weight: 800;
      letter-spacing: 12px;
      color: #FFFFFF;
      padding-left: 12px;
      margin: 8px 0;
      text-shadow: 0 0 20px rgba(229, 9, 20, 0.5);
    }
    .otp-expiry {
      font-size: 12px;
      color: #F87171;
      margin-top: 10px;
      font-weight: 500;
    }
    .security-notice {
      background-color: #1A1A1E;
      border-left: 3px solid #E50914;
      padding: 14px 18px;
      border-radius: 6px;
      font-size: 12.5px;
      color: #A1A1AA;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .security-notice strong {
      color: #FFFFFF;
    }
    .footer {
      background-color: #0E0E10;
      padding: 24px 36px;
      border-top: 1px solid #222225;
      font-size: 11.5px;
      color: #71717A;
      line-height: 1.5;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand-title">Zentra <span>Digital</span></div>
      <div class="brand-subtitle">Enterprise Operations &amp; Identity Security</div>
    </div>
    <div class="content">
      <div class="title">Password Reset Verification</div>
      <p class="paragraph">
        Hello <strong>${recipientName}</strong>,<br><br>
        We received a request to reset the password for your Zentra Digital account associated with <strong>${toEmail}</strong>.
      </p>
      
      <div class="otp-card">
        <div class="otp-label">Your One-Time Verification Code</div>
        <div class="otp-code">${otp}</div>
        <div class="otp-expiry">⏱ Valid for the next ${expiresInMinutes} minutes only</div>
      </div>

      <p class="paragraph" style="font-size: 13px; color: #A1A1AA;">
        Enter this 6-digit code on the password reset screen along with your new password to regain access to your account.
      </p>

      <div class="security-notice">
        <strong>🔒 Security Reminder:</strong> Never share this verification code with anyone. Zentra Digital staff and system administrators will never ask for your OTP or password. If you did not initiate this request, you can safely disregard this email.
      </div>
    </div>
    <div class="footer">
      This is an automated system notification from Zentra Digital Security Service.<br>
      © ${new Date().getFullYear()} Zentra Digital Agency. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  const payload = {
    sender: {
      name: senderName,
      email: senderEmail
    },
    to: [
      {
        email: toEmail,
        name: recipientName
      }
    ],
    subject: `🔐 [${otp}] Your Zentra Digital Verification Code`,
    htmlContent: htmlContent
  };

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'accept': 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`[EmailService] OTP email successfully dispatched to ${toEmail} (Brevo MessageId: ${data.messageId})`);
      return {
        success: true,
        messageId: data.messageId
      };
    } else {
      console.warn(`[EmailService] Brevo API responded with error [${response.status}]:`, data);

      let ipNotice = null;
      if (data?.code === 'unauthorized' && data?.message?.includes('authorised_ips')) {
        ipNotice = data.message;
        console.warn('⚠️ [Brevo IP Whitelist Notice]:', data.message);
      }

      return {
        success: false,
        error: data.message || 'Brevo transactional email dispatch failed.',
        code: data.code,
        ipNotice
      };
    }
  } catch (networkErr) {
    console.error('[EmailService] Network error sending email via Brevo:', networkErr);
    return {
      success: false,
      error: networkErr.message || 'Network connection failed while contacting Brevo API.'
    };
  }
}

export default {
  sendPasswordResetOtp
};
