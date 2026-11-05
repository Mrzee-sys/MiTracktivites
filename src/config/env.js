/**
 * Centralised, validated environment configuration.
 * Import `env` everywhere instead of reading process.env directly.
 */
const required = ['MONGODB_URI', 'JWT_SECRET'];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',

  // Auth
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  verificationCodeTtlMinutes: Number(process.env.VERIFICATION_CODE_TTL_MINUTES) || 15,

  // EmailJS (HTTPS API — bypasses Render SMTP port blocks)
  emailjsPublicKey: process.env.EMAILJS_PUBLIC_KEY,
  emailjsPrivateKey: process.env.EMAILJS_PRIVATE_KEY,
  emailjsServiceId: process.env.EMAILJS_SERVICE_ID,
  emailjsTemplateId: process.env.EMAILJS_TEMPLATE_ID,
});
