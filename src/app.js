import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

/**
 * Builds the Express app (no network binding) so it can be reused in tests.
 */
export function createApp() {
  const app = express();

  // Security & parsing
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Logging
  if (!env.isProduction) app.use(morgan('dev'));

  // Root & health check routes (for UptimeRobot / Render health checks)
  app.get('/', (req, res) => {
    res.status(200).json({ status: 'healthy', message: 'MiTracktivities API is running smoothly' });
  });

  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

  // Routes
  app.use('/api', apiRoutes);

  // 404 + centralised error handling (must be registered last)
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

