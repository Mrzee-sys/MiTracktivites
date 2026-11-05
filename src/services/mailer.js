import { send, init } from '@emailjs/nodejs';
import { env } from '../config/env.js';

// 1. Force the SDK to initialize globally with your keys immediately
if (env.emailjsPublicKey && env.emailjsPrivateKey) {
  init({
    publicKey: env.emailjsPublicKey,
    privateKey: env.emailjsPrivateKey,
  });
}

const hasEmailJsConfig = Boolean(
  env.emailjsPublicKey &&
  env.emailjsPrivateKey &&
  env.emailjsServiceId &&
  env.emailjsTemplateId
);

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
    
    // 2. Call send() with only 3 arguments (Service ID, Template ID, Params)
    // It will automatically pull the Private Key from the global init() above.
    const response = await send(
      env.emailjsServiceId,
      env.emailjsTemplateId,
      templateParams
    );
    
    console.log('✅ EmailJS Success:', response.status, response.text);
    return response;

  } catch (error) {
    console.error('❌ EmailJS Error:', error.message || error);
    throw new Error('Failed to send verification email'); 
  }
}

export async function sendActivityReportEmail() {
  console.warn('⚠️ sendActivityReportEmail is currently disabled.');
  return;
}