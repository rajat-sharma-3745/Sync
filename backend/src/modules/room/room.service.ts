import { Types } from 'mongoose';
import { nanoid } from 'nanoid';
import { StatusCodes } from 'http-status-codes';
import { Room, type IRoom } from '../../db/models/Room.js';
import {
  RoomMember,
  type IRoomMember,
} from '../../db/models/RoomMember.js';
import { User } from '../../db/models/User.js';
import { QueueItem } from '../../db/models/QueueItem.js';
import {
  RoomJoinRequest,
  type RoomJoinRequestStatus,
} from '../../db/models/RoomJoinRequest.js';
import { ApiError } from '../../utils/apiError.js';
import { RoomMemberRole } from '../../types/common.js';
import { assertIsHost } from '../../utils/permissions.js';
import type {
  CreateRoomInput,
  UpdateRoomInput,
} from './room.schemas.js';

export interface RoomDto {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  hostId: string;
  inviteCode: string;
  queueLocked: boolean;
  currentVideoId?: string;
  currentTime?: number;
  isPlaying?: boolean;
  playbackRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomWithRoleDto extends RoomDto {
  role: RoomMemberRole;
}

export interface RoomMemberPreviewDto {
  userId: string;
  username: string;
  avatarUrl?: string;
}

export interface RoomListItemDto extends RoomDto {
  hostUsername: string;
  hostAvatarUrl?: string;
  currentVideoTitle?: string;
  memberCount: number;
  memberPreview: RoomMemberPreviewDto[];
}

export interface RoomJoinRequestDto {
  id: string;
  roomId: string;
  requesterUserId: string;
  requesterUsername: string;
  requesterAvatarUrl?: string;
  status: RoomJoinRequestStatus;
  createdAt: Date;
  expiresAt?: Date;
}

const MEMBER_PREVIEW_LIMIT = 4;
const JOIN_REQUEST_TTL_MS = 2 * 60 * 1000;

export const enrichRoomsForList = async (
  rooms: IRoom[],
): Promise<RoomListItemDto[]> => {
  if (rooms.length === 0) {
    return [];
  }

  const roomObjectIds = rooms.map((r) => r._id);
  const hostObjectIds = [
    ...new Set(rooms.map((r) => r.hostId.toString())),
  ].map((id) => new Types.ObjectId(id));

  const orClauses = rooms
    .filter((r) => r.currentVideoId)
    .map((r) => ({
      roomId: r._id,
      videoId: r.currentVideoId as string,
    }));

  const [hosts, countAgg, memberRows, queueItems] = await Promise.all([
    User.find({ _id: { $in: hostObjectIds } })
      .select('username avatarUrl')
      .lean(),
    RoomMember.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { roomId: { $in: roomObjectIds }, isBanned: false } },
      { $group: { _id: '$roomId', count: { $sum: 1 } } },
    ]),
    RoomMember.find({ roomId: { $in: roomObjectIds }, isBanned: false })
      .sort({ lastJoinedAt: -1 })
      .select('roomId userId')
      .lean(),
    orClauses.length === 0
      ? Promise.resolve([])
      : QueueItem.find({ $or: orClauses }).select('roomId videoId title').lean(),
  ]);

  const hostById = new Map(
    hosts.map((h) => [
      h._id.toString(),
      h as { username: string; avatarUrl?: string },
    ]),
  );

  const countByRoomId = new Map(
    countAgg.map((c) => [c._id.toString(), c.count]),
  );

  const previewUserIdsByRoom = new Map<string, Types.ObjectId[]>();
  for (const row of memberRows) {
    const rid = row.roomId.toString();
    let list = previewUserIdsByRoom.get(rid);
    if (!list) {
      list = [];
      previewUserIdsByRoom.set(rid, list);
    }
    if (list.length >= MEMBER_PREVIEW_LIMIT) {
      continue;
    }
    list.push(row.userId);
  }

  const previewUserIds = [
    ...new Set(
      [...previewUserIdsByRoom.values()]
        .flat()
        .map((id) => id.toString()),
    ),
  ].map((id) => new Types.ObjectId(id));

  const previewUsers =
    previewUserIds.length === 0
      ? []
      : await User.find({ _id: { $in: previewUserIds } })
          .select('username avatarUrl')
          .lean();

  const userById = new Map(
    previewUsers.map((u) => [
      u._id.toString(),
      u as { username: string; avatarUrl?: string },
    ]),
  );

  return rooms.map((room) => {
    const base = toRoomDto(room);
    const host = hostById.get(room.hostId.toString());
    const memberCount = countByRoomId.get(room._id.toString()) ?? 0;
    const previewIds = previewUserIdsByRoom.get(room._id.toString()) ?? [];

    const memberPreview: RoomMemberPreviewDto[] = previewIds.map((uid) => {
      const u = userById.get(uid.toString());
      return {
        userId: uid.toString(),
        username: u?.username ?? 'User',
        ...(u?.avatarUrl && { avatarUrl: u.avatarUrl }),
      };
    });

    let currentVideoTitle: string | undefined;
    if (room.currentVideoId) {
      const row = queueItems.find(
        (q) =>
          q.roomId.toString() === room._id.toString() &&
          q.videoId === room.currentVideoId,
      );
      if (row) {
        currentVideoTitle = row.title;
      }
    }

    return {
      ...base,
      hostUsername: host?.username ?? 'Host',
      ...(host?.avatarUrl && { hostAvatarUrl: host.avatarUrl }),
      ...(currentVideoTitle && { currentVideoTitle }),
      memberCount,
      memberPreview,
    };
  });
};

const toRoomDto = (room: IRoom): RoomDto => ({
  id: room._id.toString(),
  name: room.name,
  ...(room.description && { description: room.description }),
  isPublic: room.isPublic,
  hostId: room.hostId.toString(),
  inviteCode: room.inviteCode,
  queueLocked: room.queueLocked,
  ...(room.currentVideoId && { currentVideoId: room.currentVideoId }),
  ...(typeof room.currentTime === 'number' && { currentTime: room.currentTime }),
  ...(typeof room.isPlaying === 'boolean' && { isPlaying: room.isPlaying }),
  ...(typeof room.playbackRate === 'number' && { playbackRate: room.playbackRate }),
  createdAt: room.createdAt,
  updatedAt: room.updatedAt,
});

const toRoomJoinRequestDto = (
  row: {
    _id: Types.ObjectId;
    roomId: Types.ObjectId;
    requesterUserId: Types.ObjectId;
    status: RoomJoinRequestStatus;
    createdAt: Date;
    expiresAt?: Date;
  },
  requester: { username: string; avatarUrl?: string },
): RoomJoinRequestDto => ({
  id: row._id.toString(),
  roomId: row.roomId.toString(),
  requesterUserId: row.requesterUserId.toString(),
  requesterUsername: requester.username,
  ...(requester.avatarUrl && { requesterAvatarUrl: requester.avatarUrl }),
  status: row.status,
  createdAt: row.createdAt,
  ...(row.expiresAt && { expiresAt: row.expiresAt }),
});

const hasExpired = (expiresAt?: Date): boolean =>
  Boolean(expiresAt && expiresAt.getTime() <= Date.now());

const ensureMember = async (
  roomId: string,
  userId: string,
): Promise<{ room: IRoom; member: IRoomMember }> => {
  if (!Types.ObjectId.isValid(roomId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid room id');
  }

  const room = await Room.findById(roomId).exec();
  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Room not found');
  }

  const member = await RoomMember.findOne({
    roomId: room._id,
    userId,
    isBanned: false,
  }).exec();

  if (!member) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Not a member of this room');
  }

  return { room, member };
};

export const createRoom = async (
  userId: string,
  data: CreateRoomInput,
): Promise<RoomDto> => {
  const inviteCode = nanoid(10);

  const room = await Room.create({
    name: data.name,
    ...(data.description && { description: data.description }),
    hostId: userId,
    isPublic: data.isPublic,
    inviteCode,
    queueLocked: false,
  });

  await RoomMember.create({
    roomId: room._id,
    userId,
    role: RoomMemberRole.HOST,
    isBanned: false,
  });

  return toRoomDto(room);
};

export const getRoomById = async (
  roomId: string,
  userId: string,
): Promise<RoomDto> => {
  if (!Types.ObjectId.isValid(roomId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid room id');
  }

  const room = await Room.findById(roomId).exec();
  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Room not found');
  }

  if (!room.isPublic) {
    const member = await RoomMember.findOne({
      roomId: room._id,
      userId,
      isBanned: false,
    }).exec();

    if (!member) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        'You do not have access to this room',
      );
    }
  }

  return toRoomDto(room);
};

export const listPublicRooms = async (): Promise<RoomListItemDto[]> => {
  const rooms = await Room.find({ isPublic: true })
    .sort({ createdAt: -1 })
    .exec();

  return enrichRoomsForList(rooms);
};

export const joinPublicRoom = async (
  roomId: string,
  userId: string,
): Promise<RoomWithRoleDto> => {
  if (!Types.ObjectId.isValid(roomId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid room id');
  }

  const room = await Room.findById(roomId).exec();
  if (!room || !room.isPublic) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Public room not found');
  }

  let member = await RoomMember.findOne({ roomId: room._id, userId }).exec();

  if (member?.isBanned) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You are banned from this room');
  }

  if (!member) {
    member = await RoomMember.create({
      roomId: room._id,
      userId,
      role: RoomMemberRole.MEMBER,
      isBanned: false,
    });
  }

  return { ...toRoomDto(room), role: member.role };
};

export const joinByInviteCode = async (
  inviteCode: string,
  userId: string,
): Promise<RoomWithRoleDto> => {
  const room = await Room.findOne({ inviteCode }).exec();

  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Room not found');
  }

  let member = await RoomMember.findOne({ roomId: room._id, userId }).exec();

  if (member?.isBanned) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You are banned from this room');
  }

  if (!room.isPublic && !member) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Host approval is required for this private room',
    );
  }

  if (!member) {
    member = await RoomMember.create({
      roomId: room._id,
      userId,
      role: RoomMemberRole.MEMBER,
      isBanned: false,
    });
  }

  return { ...toRoomDto(room), role: member.role };
};

export const requestJoinByInviteCode = async (
  inviteCode: string,
  userId: string,
): Promise<RoomJoinRequestDto & { hostUserId: string }> => {
  const room = await Room.findOne({ inviteCode }).exec();
  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Room not found');
  }

  if (room.isPublic) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'This room is public. Join directly instead.',
    );
  }

  const existingMember = await RoomMember.findOne({
    roomId: room._id,
    userId,
  }).exec();

  if (existingMember?.isBanned) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You are banned from this room');
  }

  if (existingMember && !existingMember.isBanned) {
    throw new ApiError(StatusCodes.CONFLICT, 'You are already a member of this room');
  }

  const existingPending = await RoomJoinRequest.findOne({
    roomId: room._id,
    requesterUserId: userId,
    status: 'PENDING',
  }).exec();

  if (existingPending) {
    if (hasExpired(existingPending.expiresAt)) {
      existingPending.status = 'EXPIRED';
      existingPending.reviewedAt = new Date();
      await existingPending.save();
    } else {
      const requester = await User.findById(userId).select('username avatarUrl').lean();
      if (!requester) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
      }
      return {
        ...toRoomJoinRequestDto(existingPending, {
          username: requester.username,
          ...(requester.avatarUrl && { avatarUrl: requester.avatarUrl }),
        }),
        hostUserId: room.hostId.toString(),
      };
    }
  }

  const created = await RoomJoinRequest.create({
    roomId: room._id,
    requesterUserId: userId,
    status: 'PENDING',
    expiresAt: new Date(Date.now() + JOIN_REQUEST_TTL_MS),
  });

  const requester = await User.findById(userId).select('username avatarUrl').lean();
  if (!requester) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  return {
    ...toRoomJoinRequestDto(created, {
      username: requester.username,
      ...(requester.avatarUrl && { avatarUrl: requester.avatarUrl }),
    }),
    hostUserId: room.hostId.toString(),
  };
};

export const cancelJoinRequest = async (
  roomId: string,
  requestId: string,
  requesterUserId: string,
): Promise<void> => {
  if (!Types.ObjectId.isValid(roomId) || !Types.ObjectId.isValid(requestId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid id');
  }

  const request = await RoomJoinRequest.findOne({
    _id: requestId,
    roomId,
    requesterUserId,
  }).exec();

  if (!request) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Join request not found');
  }

  if (request.status !== 'PENDING') {
    throw new ApiError(StatusCodes.CONFLICT, 'Join request already handled');
  }
  if (hasExpired(request.expiresAt)) {
    request.status = 'EXPIRED';
    request.reviewedAt = new Date();
    await request.save();
    throw new ApiError(StatusCodes.CONFLICT, 'Join request already expired');
  }

  request.status = 'CANCELLED';
  request.cancelledAt = new Date();
  await request.save();
};

export const listPendingJoinRequests = async (
  roomId: string,
  hostUserId: string,
): Promise<RoomJoinRequestDto[]> => {
  if (!Types.ObjectId.isValid(roomId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid room id');
  }

  const room = await Room.findById(roomId).exec();
  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Room not found');
  }
  if (room.hostId.toString() !== hostUserId) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only host can review join requests');
  }

  const now = new Date();

  await RoomJoinRequest.updateMany(
    {
      roomId: room._id,
      status: 'PENDING',
      expiresAt: { $lte: now },
    },
    {
      $set: { status: 'EXPIRED', reviewedAt: now },
    },
  ).exec();

  const pending = await RoomJoinRequest.find({
    roomId: room._id,
    status: 'PENDING',
    $or: [{ expiresAt: { $gt: now } }, { expiresAt: { $exists: false } }],
  })
    .sort({ createdAt: -1 })
    .lean();

  if (pending.length === 0) return [];

  const userIds = [
    ...new Set(pending.map((row) => row.requesterUserId.toString())),
  ].map((id) => new Types.ObjectId(id));

  const requesters = await User.find({ _id: { $in: userIds } })
    .select('username avatarUrl')
    .lean();
  const requesterById = new Map(
    requesters.map((u) => [
      u._id.toString(),
      { username: u.username, ...(u.avatarUrl && { avatarUrl: u.avatarUrl }) },
    ]),
  );

  return pending.map((row) =>
    toRoomJoinRequestDto(row, requesterById.get(row.requesterUserId.toString()) ?? { username: 'User' }),
  );
};

export const approveJoinRequest = async (
  roomId: string,
  requestId: string,
  hostUserId: string,
): Promise<{ room: RoomDto; requesterUserId: string }> => {
  if (!Types.ObjectId.isValid(roomId) || !Types.ObjectId.isValid(requestId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid id');
  }

  const room = await Room.findById(roomId).exec();
  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Room not found');
  }
  if (room.hostId.toString() !== hostUserId) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only host can approve join requests');
  }

  const request = await RoomJoinRequest.findOne({
    _id: requestId,
    roomId: room._id,
  }).exec();
  if (!request) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Join request not found');
  }
  if (request.status !== 'PENDING') {
    throw new ApiError(StatusCodes.CONFLICT, 'Join request already handled');
  }
  if (hasExpired(request.expiresAt)) {
    request.status = 'EXPIRED';
    request.reviewedAt = new Date();
    await request.save();
    throw new ApiError(StatusCodes.CONFLICT, 'Join request already expired');
  }

  const member = await RoomMember.findOne({
    roomId: room._id,
    userId: request.requesterUserId,
  }).exec();
  if (member?.isBanned) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'User is banned from this room');
  }

  if (!member) {
    await RoomMember.create({
      roomId: room._id,
      userId: request.requesterUserId,
      role: RoomMemberRole.MEMBER,
      isBanned: false,
    });
  }

  request.status = 'APPROVED';
  request.reviewedByUserId = new Types.ObjectId(hostUserId);
  request.reviewedAt = new Date();
  await request.save();

  return { room: toRoomDto(room), requesterUserId: request.requesterUserId.toString() };
};

export const denyJoinRequest = async (
  roomId: string,
  requestId: string,
  hostUserId: string,
): Promise<{ requesterUserId: string }> => {
  if (!Types.ObjectId.isValid(roomId) || !Types.ObjectId.isValid(requestId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid id');
  }

  const room = await Room.findById(roomId).exec();
  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Room not found');
  }
  if (room.hostId.toString() !== hostUserId) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only host can deny join requests');
  }

  const request = await RoomJoinRequest.findOne({
    _id: requestId,
    roomId: room._id,
  }).exec();
  if (!request) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Join request not found');
  }
  if (request.status !== 'PENDING') {
    throw new ApiError(StatusCodes.CONFLICT, 'Join request already handled');
  }

  request.status = 'DENIED';
  request.reviewedByUserId = new Types.ObjectId(hostUserId);
  request.reviewedAt = new Date();
  await request.save();

  return { requesterUserId: request.requesterUserId.toString() };
};

export const updateRoom = async (
  roomId: string,
  userId: string,
  data: UpdateRoomInput,
): Promise<RoomDto> => {
  const { room, member } = await ensureMember(roomId, userId);

  assertIsHost(member);

  if (typeof data.name !== 'undefined') {
    room.name = data.name;
  }

  if (typeof data.description !== 'undefined') {
    room.description = data.description;
  }

  if (typeof data.isPublic !== 'undefined') {
    room.isPublic = data.isPublic;
  }

  await room.save();

  return toRoomDto(room);
};

export const toggleQueueLock = async (
  roomId: string,
  userId: string,
  queueLocked: boolean,
): Promise<RoomDto> => {
  const { room, member } = await ensureMember(roomId, userId);

  assertIsHost(member);

  room.queueLocked = queueLocked;
  await room.save();

  return toRoomDto(room);
};

export const kickMember = async (
  roomId: string,
  hostUserId: string,
  targetUserId: string,
): Promise<void> => {
  const { room, member } = await ensureMember(roomId, hostUserId);

  assertIsHost(member);

  if (hostUserId === targetUserId) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Host cannot kick themselves via this endpoint',
    );
  }

  const target = await RoomMember.findOne({
    roomId: room._id,
    userId: targetUserId,
  }).exec();

  if (!target) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Target user is not a member of this room',
    );
  }

  target.isBanned = true;
  await target.save();
};

export const transferHost = async (
  roomId: string,
  currentHostId: string,
  newHostUserId: string,
): Promise<RoomDto> => {
  const { room, member } = await ensureMember(roomId, currentHostId);

  assertIsHost(member);

  if (currentHostId === newHostUserId) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'New host must be a different user',
    );
  }

  const newHostMember = await RoomMember.findOne({
    roomId: room._id,
    userId: newHostUserId,
    isBanned: false,
  }).exec();

  if (!newHostMember) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'New host must be a non-banned member of the room',
    );
  }

  member.role = RoomMemberRole.MEMBER;
  newHostMember.role = RoomMemberRole.HOST;

  room.hostId = new Types.ObjectId(newHostUserId);

  await Promise.all([member.save(), newHostMember.save(), room.save()]);

  return toRoomDto(room);
};

