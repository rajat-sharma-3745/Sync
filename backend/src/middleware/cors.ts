import cors from 'cors';
import { ENV } from '../config/env.js';

const DEFAULT_ORIGIN = 'http://localhost:5173';

const allowedOrigin = process.env.CLIENT_ORIGIN ?? DEFAULT_ORIGIN;

export const corsMiddleware = cors({
  origin: allowedOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

