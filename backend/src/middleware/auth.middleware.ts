import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { verifyAccessToken } from '../utils/jwt.js';
import { ApiError } from '../utils/apiError.js';

const AUTH_HEADER_PREFIX = 'Bearer ';
const ACCESS_TOKEN_COOKIE_NAME = 'accessToken';

export const requireAuth = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const header = req.headers.authorization;
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;

  let token: string | undefined;

  if (header && header.startsWith(AUTH_HEADER_PREFIX)) {
    token = header.slice(AUTH_HEADER_PREFIX.length).trim();
  } else if (cookies && typeof cookies[ACCESS_TOKEN_COOKIE_NAME] === 'string') {
    token = cookies[ACCESS_TOKEN_COOKIE_NAME];
  }

  if (!token) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      'Authentication token missing',
    );
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired token');
  }
};

