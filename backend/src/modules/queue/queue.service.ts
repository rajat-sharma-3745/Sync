import { Types } from "mongoose";
import { StatusCodes } from "http-status-codes";
import { QueueItem, type IQueueItem } from "../../db/models/QueueItem.js";
import { Room, type IRoom } from "../../db/models/Room.js";
import { RoomMember, type IRoomMember } from "../../db/models/RoomMember.js";
import { ApiError } from "../../utils/apiError.js";
import { assertIsHost, assertCanManageQueue } from "../../utils/permissions.js";
import type { AddToQueueInput, ReorderQueueInput } from "./queue.schemas.js";

export interface QueueItemDto {
  id: string;
  roomId: string;
  videoId: string;
  title: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  addedByUserId: string;
  position: number;
  createdAt: Date;
}

const toQueueItemDto = (item: IQueueItem): QueueItemDto => ({
  id: item._id.toString(),
  roomId: item.roomId.toString(),
  videoId: item.videoId,
  title: item.title,
  ...(item.thumbnailUrl && { thumbnailUrl: item.thumbnailUrl }),
  ...(item.durationSeconds && { durationSeconds: item.durationSeconds }),
  addedByUserId: item.addedByUserId.toString(),
  position: item.position,
  createdAt: item.createdAt,
});

const ensureRoomAndMember = async (
  roomId: string,
  userId: string,
): Promise<{ room: IRoom; member: IRoomMember | null }> => {
  if (!Types.ObjectId.isValid(roomId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid room id");
  }

  const room = await Room.findById(roomId).exec();
  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Room not found");
  }

  const member = await RoomMember.findOne({
    roomId: room._id,
    userId,
    isBanned: false,
  }).exec();

  if (!member) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Not a member of this room");
  }

  return { room, member };
};

export const getRoomQueue = async (roomId: string): Promise<QueueItemDto[]> => {
  const items = await QueueItem.find({ roomId }).sort({ position: 1 }).exec();

  return items.map(toQueueItemDto);
};

export const addToQueue = async (
  roomId: string,
  userId: string,
  data: AddToQueueInput,
): Promise<QueueItemDto> => {
  const { room, member } = await ensureRoomAndMember(roomId, userId);

  assertCanManageQueue(member, room);

  const lastItem = await QueueItem.findOne({ roomId: room._id })
    .sort({ position: -1 })
    .exec();

  const nextPosition = lastItem ? lastItem.position + 1 : 0;

  const item = await QueueItem.create({
    roomId: room._id,
    source: "YOUTUBE",
    videoId: data.videoId,
    title: data.title,
    ...(data.thumbnailUrl && { thumbnailUrl: data.thumbnailUrl }),
    ...(data.durationSeconds && { durationSeconds: data.durationSeconds }),
    addedByUserId: userId,
    position: nextPosition,
  });

  return toQueueItemDto(item);
};

export const removeFromQueue = async (
  roomId: string,
  userId: string,
  itemId: string,
): Promise<void> => {
  const { member } = await ensureRoomAndMember(roomId, userId);

  assertIsHost(member); // host-only for MVP

  const item = await QueueItem.findOneAndDelete({
    _id: itemId,
    roomId,
  }).exec();

  if (!item) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Queue item not found");
  }

  // Normalize positions so they stay contiguous from 0..n-1
  const remainingItems = await QueueItem.find({ roomId })
    .sort({ position: 1 })
    .exec();

  await Promise.all(
    remainingItems.map((queueItem, index) => {
      if (queueItem.position === index) return Promise.resolve();
      queueItem.position = index;
      return queueItem.save();
    }),
  );
};

export const reorderQueue = async (
  roomId: string,
  userId: string,
  data: ReorderQueueInput,
): Promise<void> => {
  const { member } = await ensureRoomAndMember(roomId, userId);
  assertIsHost(member);

  const updates = data.items.map(({ itemId, position }) =>
    QueueItem.updateOne({ _id: itemId, roomId }, { $set: { position } }).exec(),
  );

  await Promise.all(updates);
};
