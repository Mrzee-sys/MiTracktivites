import { env } from '../config/env.js';

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

  try {
    console.log(`⏳ Sending EmailJS verification via REST API to ${to}...`);
    
    // Bypassing the buggy SDK to hit the EmailJS REST API directly
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: env.emailjsServiceId,
        template_id: env.emailjsTemplateId,
        user_id: env.emailjsPublicKey,      // The REST API expects the Public Key here
        accessToken: env.emailjsPrivateKey, // The REST API expects the Private Key here
        template_params: {
          to_email: to,
          code: code,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`EmailJS responded with ${response.status}: ${errorText}`);
    }
    
    console.log('✅ EmailJS REST API Success');
    return true;

  } catch (error) {
    console.error('❌ EmailJS Error:', error.message || error);
    throw new Error('Failed to send verification email'); 
  }
}

export async function sendActivityReportEmail() {
  console.warn('⚠️ sendActivityReportEmail is currently disabled.');
  return;
}