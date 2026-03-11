import type { Request, Response } from 'express';
import { ok, created } from '../../utils/responses.js';
import {
  parseAddToQueueBody,
  parseReorderQueueBody,
} from './queue.schemas.js';
import { getRoomQueue, addToQueue, removeFromQueue, reorderQueue } from './queue.service.js';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../../utils/apiError.js';
import { emitQueueItemAdded, emitQueueItemRemoved, emitQueueUpdated } from '../../sockets/queue.socket.js';

export const getQueueHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { roomId } = req.params;
  if (!roomId || Array.isArray(roomId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid roomId");
  }
  const items = await getRoomQueue(roomId);
  ok(res, { items });
};

export const addToQueueHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { roomId } = req.params;
  if (!roomId || Array.isArray(roomId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid roomId");
  }
  const body = parseAddToQueueBody({ ...req.body, roomId });
  if (!req.user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");
  }

  const item = await addToQueue(roomId, req.user.userId, body);
  await emitQueueItemAdded(roomId);
  created(res, item);
};

export const removeFromQueueHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { roomId, itemId } = req.params;
  if (!roomId || Array.isArray(roomId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid roomId");
  }
  if (!itemId || Array.isArray(itemId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid itemId");
  }
  if (!req.user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");
  }
  await removeFromQueue(roomId, req.user.userId, itemId);
  await emitQueueItemRemoved(roomId);
  ok(res, { success: true });
};

export const reorderQueueHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { roomId } = req.params;
  if (!roomId || Array.isArray(roomId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid roomId");
  }
  const body = parseReorderQueueBody({ ...req.body, roomId });
  if (!req.user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");
  }
  await reorderQueue(roomId, req.user.userId, body);
  await emitQueueUpdated(roomId);
  ok(res, { success: true });
};