import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../utils/apiError.js';
import { ENV } from '../config/env.js';
import { logger } from '../config/logger.js';

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  const statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  const message = 'Internal server error';

  logger.error('Unhandled error', err);

  const responseBody: Record<string, unknown> = {
    success: false,
    message,
  };

  if (ENV.NODE_ENV === 'development' && err instanceof Error) {
    responseBody.stack = err.stack;
  }

  res.status(statusCode).json(responseBody);
};

