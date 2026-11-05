import emailjs from '@emailjs/nodejs';
import { env } from '../config/env.js';

const hasEmailJsConfig = Boolean(
  env.emailjsPublicKey &&
    env.emailjsPrivateKey &&
    env.emailjsServiceId &&
    env.emailjsTemplateId,
);

/**
 * Sends the email-verification code to a newly registered user via EmailJS.
 * @param {string} to   Recipient email address.
 * @param {string} code Plain-text verification code (never persisted).
 */
export async function sendVerificationEmail(to, code) {
  const templateParams = {
    to_email: to,
    code: code,
  };

  if (!hasEmailJsConfig) {
    console.log(`📧 [dev mailer] EmailJS keys missing — To: ${to} | Code: ${code}`);
    return { status: 200, text: 'dev-console-fallback' };
  }

  return emailjs.send(
    env.emailjsServiceId,
    env.emailjsTemplateId,
    templateParams,
    {
      publicKey: env.emailjsPublicKey,
      privateKey: env.emailjsPrivateKey,
    },
  );
}

/**
 * Temporarily disabled while focusing on the EmailJS authentication flow.
 */
export async function sendActivityReportEmail() {
  console.warn('⚠️ sendActivityReportEmail is currently disabled (EmailJS attachment support not configured).');
  return;
}
