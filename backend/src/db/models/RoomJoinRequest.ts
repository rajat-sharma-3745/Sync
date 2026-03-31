import { Schema, model, type Document, type Types } from 'mongoose';

export type RoomJoinRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'DENIED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface IRoomJoinRequest extends Document {
  roomId: Types.ObjectId;
  requesterUserId: Types.ObjectId;
  status: RoomJoinRequestStatus;
  expiresAt?: Date;
  reviewedByUserId?: Types.ObjectId;
  reviewedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const roomJoinRequestSchema = new Schema<IRoomJoinRequest>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    requesterUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'DENIED', 'EXPIRED', 'CANCELLED'],
      required: true,
      default: 'PENDING',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: false,
      index: true,
    },
    reviewedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    reviewedAt: {
      type: Date,
      required: false,
    },
    cancelledAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

roomJoinRequestSchema.index(
  { roomId: 1, requesterUserId: 1, status: 1 },
  { name: 'room_join_request_lookup' },
);

export const RoomJoinRequest = model<IRoomJoinRequest>(
  'RoomJoinRequest',
  roomJoinRequestSchema,
);
