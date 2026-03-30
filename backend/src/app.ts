import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { corsMiddleware } from './middleware/cors.js';
import { errorHandler } from './middleware/error.middleware.js';

import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/user/user.routes.js';
import roomRoutes from './modules/room/room.routes.js';
import queueRoutes from './modules/queue/queue.routes.js';
import chatRoutes from './modules/chat/chat.routes.js';

const app = express();

app.use(corsMiddleware);
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

app.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', roomRoutes);
app.use('/api', queueRoutes);
app.use('/api', chatRoutes);

app.use(errorHandler);

export default app;

