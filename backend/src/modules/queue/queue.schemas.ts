import { z } from 'zod';

export const addToQueueSchema = z.object({
  roomId: z.string().trim(),
  videoId: z.string().trim(),
  title: z.string().trim().min(1),
  thumbnailUrl: z.url().optional(),
  durationSeconds: z.number().int().nonnegative().optional(),
});

export type AddToQueueInput = z.infer<typeof addToQueueSchema>;

export const reorderQueueSchema = z.object({
  roomId: z.string().trim(),
  items: z
    .array(
      z.object({
        itemId: z.string().trim(),
        position: z.number().int().nonnegative(),
      }),
    )
    .min(1),
});

export type ReorderQueueInput = z.infer<typeof reorderQueueSchema>;

export const removeFromQueueSchema = z.object({
  roomId: z.string().trim(),
  itemId: z.string().trim(),
});

export type RemoveFromQueueInput = z.infer<typeof removeFromQueueSchema>;

export const parseAddToQueueBody = (body: unknown): AddToQueueInput =>
  addToQueueSchema.parse(body);

export const parseReorderQueueBody = (body: unknown): ReorderQueueInput =>
  reorderQueueSchema.parse(body);