import dotenv from 'dotenv';
import { z } from 'zod';
import type { StringValue } from 'ms';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z
    .string()
    .transform((value) => Number(value))
    .pipe(z.number().int().positive())
    .optional(),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_DB_NAME: z.string().optional(),
  ACCESS_TOKEN_SECRET: z.string().min(1, 'ACCESS_TOKEN_SECRET is required'),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m').transform(val => val as StringValue),
  /** Set to "1" or "true" to log playback socket events (pause/play, etc.). */
  DEBUG_PLAYBACK: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast on invalid env configuration
  console.error('Invalid environment configuration', parsed.error.format());
  process.exit(1);
}

const env = parsed.data;

const truthyEnv = (value: string | undefined): boolean =>
  value === '1' || value === 'true';

export const ENV = {
  NODE_ENV: env.NODE_ENV,
  PORT: env.PORT ?? 4000,
  MONGODB_URI: env.MONGODB_URI,
  MONGODB_DB_NAME: env.MONGODB_DB_NAME,
  ACCESS_TOKEN_SECRET: env.ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES_IN: env.ACCESS_TOKEN_EXPIRES_IN,
  DEBUG_PLAYBACK: truthyEnv(env.DEBUG_PLAYBACK),
} as const;

