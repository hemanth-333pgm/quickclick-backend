import nodemailer, { Transporter } from "nodemailer";

/**
 * Gmail SMTP transporter.
 * Requires EMAIL_USER + EMAIL_PASS (16-char App Password) in env.
 */
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error("EMAIL_USER and EMAIL_PASS must be set in environment");
  }

  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  return transporter;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const from = process.env.EMAIL_FROM || `QuickClick <${process.env.EMAIL_USER}>`;
  const t = getTransporter();

  const info = await t.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || options.html.replace(/<[^>]+>/g, ""),
  });

  console.log(`📧 Email sent to ${options.to} (id: ${info.messageId})`);
}

/**
 * Sends the OTP email. Nice, readable, minimal styling.
 */
export async function sendOtpEmail(to: string, otp: string, ttlMinutes = 5): Promise<void> {
  const subject = "Your QuickClick verification code";
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f6f6f6;padding:24px">
      <div style="max-width:480px;margin:auto;background:#ffffff;border-radius:10px;padding:32px;box-shadow:0 2px 6px rgba(0,0,0,0.05)">
        <h2 style="color:#FF6B35;margin:0 0 12px">QuickClick</h2>
        <p style="color:#333;font-size:15px;margin:0 0 16px">Use the code below to verify your account:</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:8px;background:#f2f2f2;padding:16px;border-radius:8px;text-align:center;color:#111">
          ${otp}
        </div>
        <p style="color:#888;font-size:13px;margin:16px 0 0">
          This code is valid for ${ttlMinutes} minutes. Do not share it with anyone.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
        <p style="color:#aaa;font-size:12px;margin:0">
          If you did not request this, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;
  await sendEmail({ to, subject, html });
}

/**
 * Sends a plain notification email (used for order updates, etc.)
 */
export async function sendNotificationEmail(to: string, subject: string, body: string): Promise<void> {
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;padding:24px">
      <h2 style="color:#FF6B35;margin:0 0 12px">QuickClick</h2>
      <p style="color:#333;font-size:15px">${body}</p>
    </div>
  `;
  await sendEmail({ to, subject, html });
}
