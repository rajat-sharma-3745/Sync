import mongoose from 'mongoose';
import { ENV } from '../config/env.js';
import { logger } from '../config/logger.js';

mongoose.set('strictQuery', true);

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(ENV.MONGODB_URI);

    logger.info('MongoDB connected');
  } catch (error) {
    logger.error('MongoDB connection error', error);
    process.exit(1);
  }
};

export { mongoose };

