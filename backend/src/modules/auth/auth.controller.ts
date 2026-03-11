import type { Request, Response, CookieOptions } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ENV } from '../../config/env.js';
import { ok, created } from '../../utils/responses.js';
import { ApiError } from '../../utils/apiError.js';
import { signAccessToken } from '../../utils/jwt.js';
import { signup, login, getUserById } from './auth.service.js';
import { parseLoginBody, parseSignupBody } from './auth.schemas.js';

const ACCESS_TOKEN_COOKIE_NAME = 'accessToken';

const isProduction = ENV.NODE_ENV === 'production';

const buildAuthCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
});

export const signupHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const data = parseSignupBody(req.body);

  const user = await signup(data);

  const accessToken = signAccessToken({
    userId: user.id,
    username: user.username,
  });

  res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, buildAuthCookieOptions());

  created(res, user);
};

export const loginHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const data = parseLoginBody(req.body);

  const { user, accessToken } = await login(data);

  res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, {
    ...buildAuthCookieOptions(),
  });

  ok(res, user);
};

export const meHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authenticated');
  }

  const user = await getUserById(req.user.userId);

  ok(res, user);
};

export const logoutHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, buildAuthCookieOptions());

  ok(res, { message: 'Logged out' });
};

