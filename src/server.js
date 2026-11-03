import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { createApp } from './app.js';

async function bootstrap() {
  try {
    await connectDB();
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`🚀 Server running in ${env.nodeEnv} mode on http://localhost:${env.port}`);
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully…`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    console.error('💥 Unhandled rejection:', reason);
    shutdown('unhandledRejection');
  });
}

bootstrap();

