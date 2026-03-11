import { z } from 'zod';

export const sendMessageSchema = z.object({
  roomId: z.string().trim(),
  content: z.string().trim().min(1).max(2000),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const parseSendMessageBody = (body: unknown): SendMessageInput =>
  sendMessageSchema.parse(body);

export const getMessagesSchema = z.object({
  roomId: z.string().trim(),
  limit: z
    .string()
    .transform((v) => Number(v))
    .pipe(z.number().int().positive().max(100))
    .optional(),
  before: z.string().optional(), // ISO date or message id
});

export type GetMessagesInput = z.infer<typeof getMessagesSchema>;

export const parseGetMessagesQuery = (
  roomId: string,
  query: unknown,
): GetMessagesInput =>
  getMessagesSchema.parse({
    roomId,
    ...(query as Record<string, unknown>),
  });