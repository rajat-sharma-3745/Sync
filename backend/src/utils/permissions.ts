import { StatusCodes } from 'http-status-codes';
import type { IRoom } from '../db/models/Room.js';
import type { IRoomMember } from '../db/models/RoomMember.js';
import { RoomMemberRole } from '../types/common.js';
import { ApiError } from './apiError.js';

export const assertIsHost = (member: IRoomMember | null | undefined): void => {
  if (!member || member.role !== RoomMemberRole.HOST) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Host permissions required');
  }
};

export const assertCanManageQueue = (
  member: IRoomMember | null | undefined,
  room: IRoom,
): void => {
  if (room.queueLocked) {
    assertIsHost(member);
  }
};

