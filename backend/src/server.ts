import http from 'http';

import app from './app.js';
import { ENV } from './config/env.js';
import { connectDB } from './db/index.js';
import { initSocketServer } from './sockets/index.js';
import { logger } from './config/logger.js';

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    const server = http.createServer(app);

    initSocketServer(server);

    server.listen(ENV.PORT, () => {
      logger.info(`Server listening on port ${ENV.PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

void startServer();

