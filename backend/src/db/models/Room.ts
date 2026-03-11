import { Schema, model, type Document, type Types } from 'mongoose';

export interface IRoom extends Document {
  name: string;
  description?: string;
  hostId: Types.ObjectId;
  isPublic: boolean;
  inviteCode: string;
  queueLocked: boolean;
  currentVideoId?: string;
  currentTime?: number;
  isPlaying?: boolean;
  playbackRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<IRoom>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    isPublic: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    queueLocked: {
      type: Boolean,
      required: true,
      default: false,
    },
    currentVideoId: {
      type: String,
    },
    currentTime: {
      type: Number,
      min: 0,
    },
    isPlaying: {
      type: Boolean,
    },
    playbackRate: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  },
);

roomSchema.index({ isPublic: 1 });
roomSchema.index({ inviteCode: 1 }, { unique: true });

export const Room = model<IRoom>('Room', roomSchema);

