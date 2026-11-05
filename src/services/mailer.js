import { send } from '@emailjs/nodejs';
import { env } from '../config/env.js';

const hasEmailJsConfig = Boolean(
  env.emailjsPublicKey &&
  env.emailjsPrivateKey &&
  env.emailjsServiceId &&
  env.emailjsTemplateId
);

/**
 * Sends the email-verification code to a newly registered user via EmailJS.
 */
export async function sendVerificationEmail(to, code) {
  if (!hasEmailJsConfig) {
    console.log(`📧 [dev mailer] EmailJS keys missing — To: ${to} | Code: ${code}`);
    return;
  }

  const templateParams = {
    to_email: to,
    code: code,
  };

  try {
    console.log(`⏳ Sending EmailJS verification to ${to}...`);
    
    // 1. Correctly await the named 'send' function
    const response = await send(
      env.emailjsServiceId,
      env.emailjsTemplateId,
      templateParams,
      {
        publicKey: env.emailjsPublicKey,
        privateKey: env.emailjsPrivateKey,
      }
    );
    
    console.log('✅ EmailJS Success:', response.status, response.text);
    return response;

  } catch (error) {
    // 2. Catch the error so it doesn't freeze the Express route
    console.error('❌ EmailJS Error:', error.message || error);
    
    // Throwing ensures the auth controller catches it and returns a 500 cleanly to the frontend
    throw new Error('Failed to send verification email'); 
  }
}

/**
 * Temporarily disabled while focusing on the EmailJS authentication flow.
 */
export async function sendActivityReportEmail() {
  console.warn('⚠️ sendActivityReportEmail is currently disabled.');
  return;
}