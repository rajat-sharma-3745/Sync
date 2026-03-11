import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ok, created } from '../../utils/responses.js';
import { ApiError } from '../../utils/apiError.js';
import {
  parseCreateRoomBody,
  parseUpdateRoomBody,
  parseKickMemberBody,
  parseTransferHostBody,
  parseToggleQueueLockBody,
} from './room.schemas.js';
import {
  createRoom,
  getRoomById,
  listPublicRooms,
  joinPublicRoom,
  joinByInviteCode,
  updateRoom,
  toggleQueueLock,
  kickMember,
  transferHost,
} from './room.service.js';

export const createRoomHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authenticated');
  }

  const data = parseCreateRoomBody(req.body);
  const room = await createRoom(req.user.userId, data);

  created(res, room);
};

export const getRoomHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authenticated');
  }

  const { roomId } = req.params;
  if (!roomId || Array.isArray(roomId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Room ID');
  }
  const room = await getRoomById(roomId, req.user.userId);

  ok(res, room);
};

export const listPublicRoomsHandler = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const rooms = await listPublicRooms();
  ok(res, { rooms });
};

export const joinPublicRoomHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authenticated');
  }

  const { roomId } = req.params;
  if (!roomId || Array.isArray(roomId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Room ID');
  }
  const room = await joinPublicRoom(roomId, req.user.userId);

  ok(res, room);
};

export const joinByInviteHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authenticated');
  }

  const { inviteCode } = req.params;
  if (!inviteCode || Array.isArray(inviteCode)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Invite code');
  }
  const room = await joinByInviteCode(inviteCode, req.user.userId);

  ok(res, room);
};

export const updateRoomHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authenticated');
  }

  const { roomId } = req.params;
  const data = parseUpdateRoomBody(req.body);
  if (!roomId || Array.isArray(roomId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Room ID');
  }

  const room = await updateRoom(roomId, req.user.userId, data);

  ok(res, room);
};

export const toggleQueueLockHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authenticated');
  }

  const body = parseToggleQueueLockBody(req.body);
  const room = await toggleQueueLock(
    body.roomId,
    req.user.userId,
    body.queueLocked,
  );

  ok(res, room);
};

export const kickMemberHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authenticated');
  }

  const body = parseKickMemberBody(req.body);

  await kickMember(body.roomId, req.user.userId, body.userId);

  ok(res, { success: true });
};

export const transferHostHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authenticated');
  }

  const body = parseTransferHostBody(req.body);

  const room = await transferHost(
    body.roomId,
    req.user.userId,
    body.newHostUserId,
  );

  ok(res, room);
};

