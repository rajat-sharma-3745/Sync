import { z } from 'zod';

export const createRoomSchema = z.object({
  name: z.string().trim().min(3).max(100),
  description: z.string().trim().max(500).optional(),
  isPublic: z.boolean(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;

export const updateRoomSchema = createRoomSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'At least one field must be provided' },
);

export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;

export const joinPublicRoomSchema = z.object({
  roomId: z.string().trim(),
});

export type JoinPublicRoomInput = z.infer<typeof joinPublicRoomSchema>;

export const joinByInviteSchema = z.object({
  inviteCode: z.string().trim(),
});

export type JoinByInviteInput = z.infer<typeof joinByInviteSchema>;

export const kickMemberSchema = z.object({
  roomId: z.string().trim(),
  userId: z.string().trim(),
});

export type KickMemberInput = z.infer<typeof kickMemberSchema>;

export const transferHostSchema = z.object({
  roomId: z.string().trim(),
  newHostUserId: z.string().trim(),
});

export type TransferHostInput = z.infer<typeof transferHostSchema>;

export const toggleQueueLockSchema = z.object({
  roomId: z.string().trim(),
  queueLocked: z.boolean(),
});

export type ToggleQueueLockInput = z.infer<typeof toggleQueueLockSchema>;

export const parseCreateRoomBody = (body: unknown): CreateRoomInput =>
  createRoomSchema.parse(body);

export const parseUpdateRoomBody = (body: unknown): UpdateRoomInput =>
  updateRoomSchema.parse(body);

export const parseKickMemberBody = (body: unknown): KickMemberInput =>
  kickMemberSchema.parse(body);

export const parseTransferHostBody = (body: unknown): TransferHostInput =>
  transferHostSchema.parse(body);

export const parseToggleQueueLockBody = (
  body: unknown,
): ToggleQueueLockInput => toggleQueueLockSchema.parse(body);

