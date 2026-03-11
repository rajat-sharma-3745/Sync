type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const log = (level: LogLevel, message: string, meta?: unknown): void => {
  const payload = {
    level,
    message,
    meta,
    timestamp: new Date().toISOString(),
  };

  if (level === 'error' || level === 'warn') {
    console.error(payload);
  } else {
    console.log(payload);
  }
};

export const logger = {
  debug: (message: string, meta?: unknown): void => log('debug', message, meta),
  info: (message: string, meta?: unknown): void => log('info', message, meta),
  warn: (message: string, meta?: unknown): void => log('warn', message, meta),
  error: (message: string, meta?: unknown): void => log('error', message, meta),
};

