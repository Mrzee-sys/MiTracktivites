import mongoose from './mongoose.js';
import { env } from './env.js';

/**
 * Opens the Mongoose connection. Throws if the initial connection fails so the
 * caller (server.js) can decide to exit rather than run without a database.
 */
export async function connectDB() {
  mongoose.connection.on('connected', () => {
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  });
  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
  });

  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 5000,
    autoIndex: !env.isProduction, // build indexes via migrations in production
  });

  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.connection.close();
}

