import { StatusCodes } from 'http-status-codes';
import { User, type IUser } from '../../db/models/User.js';
import { Room, type IRoom } from '../../db/models/Room.js';
import {
  RoomMember,
  type IRoomMember,
} from '../../db/models/RoomMember.js';
import { ApiError } from '../../utils/apiError.js';
import type { UpdateProfileInput } from './user.schemas.js';

export interface UserProfileDto {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
}

export interface UserRoomDto {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  hostId: string;
  role: IRoomMember['role'];
  createdAt: Date;
}

const toUserProfileDto = (user: IUser): UserProfileDto => ({
  id: user._id.toString(),
  email: user.email,
  username: user.username,
  createdAt: user.createdAt,
});

const toUserRoomDto = (
  room: IRoom,
  membership: IRoomMember,
): UserRoomDto => ({
  id: room._id.toString(),
  name: room.name,
  ...(room.description && {description: room.description}),
  isPublic: room.isPublic,
  hostId: room.hostId.toString(),
  role: membership.role,
  createdAt: room.createdAt,
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
): Promise<UserRoomDto[]> => {
  const memberships = await RoomMember.find({ userId }).exec();

  if (memberships.length === 0) {
    return [];
  }

  const roomIds = memberships.map((m) => m.roomId);

  const rooms = await Room.find({ _id: { $in: roomIds } }).exec();

  const roomById = new Map<string, IRoom>();
  for (const room of rooms) {
    roomById.set(room._id.toString(), room);
  }

  const result: UserRoomDto[] = [];

  for (const membership of memberships) {
    const room = roomById.get(membership.roomId.toString());
    if (!room) continue;
    result.push(toUserRoomDto(room, membership));
  }

  return result;
};

