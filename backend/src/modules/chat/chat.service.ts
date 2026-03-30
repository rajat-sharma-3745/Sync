import { Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { Message, type IMessage } from '../../db/models/Message.js';
import { Room } from '../../db/models/Room.js';
import { User } from '../../db/models/User.js';
import {
  RoomMember,
  type IRoomMember,
} from '../../db/models/RoomMember.js';
import { ApiError } from '../../utils/apiError.js';
import type {
  SendMessageInput,
  GetMessagesInput,
} from './chat.schemas.js';
import { MessageType } from '../../types/common.js';

export interface MessageDto {
  id: string;
  roomId: string;
  userId?: string;
  username?: string;
  content: string;
  type: MessageType;
  createdAt: Date;
}

const toMessageDto = (msg: IMessage, username?: string): MessageDto => ({
  id: msg._id.toString(),
  roomId: msg.roomId.toString(),
  ...(msg.userId && { userId: msg.userId.toString() }),
  ...(username && { username }),
  content: msg.content,
  type: msg.type,
  createdAt: msg.createdAt,
});

const ensureRoomAndMember = async (
  roomId: string,
  userId?: string,
): Promise<{ member: IRoomMember | null }> => {
  if (!Types.ObjectId.isValid(roomId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid room id');
  }

  const roomExists = await Room.exists({ _id: roomId }).exec();
  if (!roomExists) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Room not found');
  }

  if (!userId) {
    return { member: null };
  }

  const member = await RoomMember.findOne({
    roomId,
    userId,
    isBanned: false,
  }).exec();

  if (!member) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Not a member of this room');
  }

  return { member };
};

export const sendMessage = async (
  userId: string,
  data: SendMessageInput,
): Promise<MessageDto> => {
  await ensureRoomAndMember(data.roomId, userId);

  const msg = await Message.create({
    roomId: data.roomId,
    userId,
    type: MessageType.USER,
    content: data.content,
  });

  const author = await User.findById(userId).select('username').lean().exec();

  return toMessageDto(msg, author?.username);
};

export const sendSystemMessage = async (
  roomId: string,
  content: string,
  meta?: Record<string, unknown>,
): Promise<MessageDto> => {
  await ensureRoomAndMember(roomId);

  const msg = await Message.create({
    roomId,
    type: MessageType.SYSTEM,
    content,
    ...(meta && {meta}),
  });

  return toMessageDto(msg);
};

export const getMessages = async (
  data: GetMessagesInput,
): Promise<MessageDto[]> => {
  await ensureRoomAndMember(data.roomId);

  const limit = data.limit ?? 50;

  const query = Message.find({ roomId: data.roomId });

  if (data.before) {
    const beforeDate = new Date(data.before);
    if (!Number.isNaN(beforeDate.getTime())) {
        query.where({
            createdAt: { $lt: beforeDate },
          });
    }
  }

  const messages = await query
    .sort({ createdAt: -1 })
    .limit(limit)
    .exec();

  // Newest-first query + limit gives the latest N; reverse for oldest→newest UI.
  const messagesChronological = [...messages].reverse();

  const userIdStrings = [
    ...new Set(
      messagesChronological
        .map((m) => m.userId?.toString())
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  let usernameById = new Map<string, string>();
  if (userIdStrings.length > 0) {
    const users = await User.find({ _id: { $in: userIdStrings } })
      .select('username')
      .lean()
      .exec();
    usernameById = new Map(
      users.map((u) => [u._id.toString(), u.username]),
    );
  }

  return messagesChronological.map((m) => {
    const uid = m.userId?.toString();
    const username = uid ? usernameById.get(uid) : undefined;
    return toMessageDto(m, username);
  });
};