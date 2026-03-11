import { Schema, model, type Document, type Types } from 'mongoose';
import { MessageType } from '../../types/common.js';

export interface IMessage extends Document {
  roomId: Types.ObjectId;
  userId?: Types.ObjectId;
  type: MessageType;
  content: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
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
    },
    type: {
      type: String,
      enum: Object.values(MessageType),
      required: true,
      default: MessageType.USER,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    meta: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  },
);

messageSchema.index({ roomId: 1, createdAt: 1 });

export const Message = model<IMessage>('Message', messageSchema);

