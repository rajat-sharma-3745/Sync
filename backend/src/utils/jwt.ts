import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

export interface AccessTokenPayload {
  userId: string;
  username: string;
}

export const signAccessToken = (
  payload: AccessTokenPayload,
): string => {
  return jwt.sign(payload, ENV.ACCESS_TOKEN_SECRET, {
    expiresIn: ENV.ACCESS_TOKEN_EXPIRES_IN ,
  });
};

export const verifyAccessToken = (
  token: string,
): AccessTokenPayload => {
  return jwt.verify(token, ENV.ACCESS_TOKEN_SECRET) as AccessTokenPayload;
};

