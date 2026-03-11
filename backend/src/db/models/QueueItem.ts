import { Schema, model, type Document, type Types } from 'mongoose';
import { QueueItemSource } from '../../types/common.js';

export interface IQueueItem extends Document {
  roomId: Types.ObjectId;
  source: QueueItemSource;
  videoId: string;
  title: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  addedByUserId: Types.ObjectId;
  position: number;
  createdAt: Date;
}

const queueItemSchema = new Schema<IQueueItem>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: Object.values(QueueItemSource),
      required: true,
      default: QueueItemSource.YOUTUBE,
    },
    videoId: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnailUrl: {
      type: String,
    },
    durationSeconds: {
      type: Number,
      min: 0,
    },
    addedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    position: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  },
);

queueItemSchema.index({ roomId: 1, position: 1 });

export const QueueItem = model<IQueueItem>('QueueItem', queueItemSchema);

