import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { Router, errorHandler, container } from './core/index.js';
import { createDatabase } from './infra/index.js';
import { createLogger } from './infra/logger/index.js';
import {
  AuthRepository,
  AuthService,
  JwtService,
  AuthController,
  createAuthRoutes,
  createAuthMiddleware,
} from './modules/auth/index.js';
import {
  WorkspaceRepository,
  WorkspaceService,
  WorkspaceController,
  createWorkspaceRoutes,
} from './modules/workspace/index.js';

// Configuration
const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://kanban:kanban@localhost:5433/kanban5000',
  jwtSecret: process.env.JWT_SECRET || 'development-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  nodeEnv: process.env.NODE_ENV || 'development',
};

async function bootstrap(): Promise<void> {
  // Create logger
  const logger = createLogger({
    level: config.nodeEnv === 'production' ? 'info' : 'debug',
    pretty: config.nodeEnv !== 'production',
  });

  logger.info('Starting kanban5000 backend...');

  // Create database client
  const db = createDatabase(config.databaseUrl);
  container.register('Database', db);

  // Create JWT service
  const jwtService = new JwtService({
    secret: config.jwtSecret,
    expiresIn: config.jwtExpiresIn,
  });
  container.register('JwtService', jwtService);

  // Create repositories
  const authRepository = new AuthRepository(db);
  const workspaceRepository = new WorkspaceRepository(db);
  container.register('AuthRepository', authRepository);
  container.register('WorkspaceRepository', workspaceRepository);

  // Create services
  const authService = new AuthService(authRepository, jwtService);
  const workspaceService = new WorkspaceService(workspaceRepository, authService);
  container.register('AuthService', authService);
  container.register('WorkspaceService', workspaceService);

  // Create controllers
  const authController = new AuthController(authService);
  const workspaceController = new WorkspaceController(workspaceService);

  // Create Express app
  const app = express();

  // Global middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  // Auth middleware (extracts JWT if present)
  app.use(createAuthMiddleware(jwtService));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Create router and register routes
  const router = new Router();
  router.addAll(createAuthRoutes(authController));
  router.addAll(createWorkspaceRoutes(workspaceController));

  // Mount routes
  router.mount(app, '/api');

  // Error handler (must be last)
  app.use(errorHandler);

  // Start server
  app.listen(config.port, () => {
    logger.info(`Server running on http://localhost:${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

