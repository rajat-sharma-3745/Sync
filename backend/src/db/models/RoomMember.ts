import { Schema, model, type Document, type Types } from 'mongoose';
import { RoomMemberRole } from '../../types/common.js';

export interface IRoomMember extends Document {
  roomId: Types.ObjectId;
  userId: Types.ObjectId;
  role: RoomMemberRole;
  isBanned: boolean;
  lastJoinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const roomMemberSchema = new Schema<IRoomMember>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: Object.values(RoomMemberRole),
      required: true,
      default: RoomMemberRole.MEMBER,
    },
    isBanned: {
      type: Boolean,
      required: true,
      default: false,
    },
    lastJoinedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

roomMemberSchema.index(
  { roomId: 1, userId: 1 },
  { unique: true, name: 'room_user_unique' },
);

roomMemberSchema.index({ roomId: 1, role: 1 });

export const RoomMember = model<IRoomMember>('RoomMember', roomMemberSchema);

