import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

/**
 * Mailer service.
 * - When SMTP_HOST is configured, mail is sent through that SMTP server.
 * - Otherwise (development only) mail is not sent; the message is logged to the
 *   console so the verification flow can be tested without an SMTP account.
 */
const hasSmtp = Boolean(env.smtp.host);

if (!hasSmtp && env.isProduction) {
  throw new Error('SMTP_HOST must be configured in production to send verification emails');
}

const transporter = hasSmtp
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    })
  : nodemailer.createTransport({ jsonTransport: true });

async function sendMail({ to, subject, text, html, attachments }) {
  const info = await transporter.sendMail({
    from: env.mailFrom,
    to,
    subject,
    text,
    html,
    ...(attachments && { attachments }),
  });
  if (!hasSmtp) {
    console.log(`📧 [dev mailer] To: ${to} | Subject: ${subject}\n${text}`);
  }
  return info;
}

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/**
 * Sends the email-verification code to a newly registered user.
 * @param {string} to   Recipient email address.
 * @param {string} code Plain-text verification code (never persisted).
 */
export function sendVerificationEmail(to, code) {
  const minutes = env.verificationCodeTtlMinutes;
  const safeCode = escapeHtml(code);

  return sendMail({
    to,
    subject: `Your MiTracktivities verification code: ${code}`,
    text: [
      'Welcome to MiTracktivities!',
      '',
      `Your verification code is: ${code}`,
      '',
      `This code expires in ${minutes} minutes. If you did not create an account, you can ignore this email.`,
    ].join('\n'),
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
        <h2 style="margin:0 0 16px">Welcome to MiTracktivities!</h2>
        <p style="margin:0 0 16px">Enter this code in the app to verify your email address:</p>
        <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:0 0 16px;color:#4f46e5">${safeCode}</p>
        <p style="margin:0;color:#64748b;font-size:14px">
          This code expires in ${minutes} minutes. If you did not create an account, you can ignore this email.
        </p>
      </div>`,
  });
}

/**
 * Sends an admin PDF activity report as an email attachment.
 * @param {object} options
 * @param {string} options.to        Recipient email address.
 * @param {string} options.pdfBase64 Base64 string or data URI (`data:application/pdf;base64,...`).
 * @param {string} [options.filename] Attachment filename.
 */
export function sendActivityReportEmail({ to, pdfBase64, filename = 'MiTracktivities-Report.pdf' }) {
  // Strip optional data URI prefix (`data:application/pdf;base64,`) so Nodemailer receives pure base64
  const base64Content = String(pdfBase64).replace(/^data:application\/pdf;[^,]*base64,/, '');

  return sendMail({
    to,
    subject: 'MiTracktivities — Activity Report PDF',
    text: 'Please find the requested MiTracktivities activity log report attached as a PDF.',
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
        <h2 style="margin:0 0 12px;color:#991b1b">MiTracktivities Activity Report</h2>
        <p style="margin:0;color:#334155;font-size:14px">
          Please find the requested student activity log report attached as a PDF document.
        </p>
      </div>`,
    attachments: [
      {
        filename,
        content: base64Content,
        encoding: 'base64',
        contentType: 'application/pdf',
      },
    ],
  });
}

