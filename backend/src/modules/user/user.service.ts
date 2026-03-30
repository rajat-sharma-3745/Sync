import { StatusCodes } from 'http-status-codes';
import { User, type IUser } from '../../db/models/User.js';
import { Room, type IRoom } from '../../db/models/Room.js';
import { RoomMember } from '../../db/models/RoomMember.js';
import { ApiError } from '../../utils/apiError.js';
import { RoomMemberRole } from '../../types/common.js';
import {
  enrichRoomsForList,
  type RoomListItemDto,
} from '../room/room.service.js';
import type { UpdateProfileInput } from './user.schemas.js';

export interface UserProfileDto {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
}

export interface MyRoomListItemDto extends RoomListItemDto {
  role: RoomMemberRole;
}

const toUserProfileDto = (user: IUser): UserProfileDto => ({
  id: user._id.toString(),
  email: user.email,
  username: user.username,
  createdAt: user.createdAt,
});

export const getCurrentUser = async (
  userId: string,
): Promise<UserProfileDto> => {
  const user = await User.findById(userId).exec();

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  return toUserProfileDto(user);
};

export const updateProfile = async (
  userId: string,
  data: UpdateProfileInput,
): Promise<UserProfileDto> => {
  const existingWithUsername = await User.findOne({
    _id: { $ne: userId },
    username: data.username,
  }).exec();

  if (existingWithUsername) {
    throw new ApiError(StatusCodes.CONFLICT, 'Username is already taken');
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { username: data.username },
    { new: true },
  ).exec();

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  return toUserProfileDto(user);
};

export const getUserRooms = async (
  userId: string,
): Promise<MyRoomListItemDto[]> => {
  const memberships = await RoomMember.find({ userId }).exec();

  if (memberships.length === 0) {
    return [];
  }

  const roomIds = memberships.map((m) => m.roomId);

  const rooms = await Room.find({ _id: { $in: roomIds } }).exec();

  const enriched = await enrichRoomsForList(rooms);
  const enrichedById = new Map(enriched.map((r) => [r.id, r]));

  const result: MyRoomListItemDto[] = [];

  for (const membership of memberships) {
    const base = enrichedById.get(membership.roomId.toString());
    if (!base) continue;
    result.push({ ...base, role: membership.role });
  }

  return result;
};

