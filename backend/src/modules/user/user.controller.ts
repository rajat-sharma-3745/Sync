import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ok } from '../../utils/responses.js';
import { ApiError } from '../../utils/apiError.js';
import { parseUpdateProfileBody } from './user.schemas.js';
import {
  getCurrentUser,
  updateProfile,
  getUserRooms,
} from './user.service.js';

export const getMeHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authenticated');
  }

  const user = await getCurrentUser(req.user.userId);

  ok(res, user);
};

export const updateProfileHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authenticated');
  }

  const data = parseUpdateProfileBody(req.body);

  const user = await updateProfile(req.user.userId, data);

  ok(res, user);
};

export const getMyRoomsHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authenticated');
  }

  const rooms = await getUserRooms(req.user.userId);

  ok(res, { rooms });
};

