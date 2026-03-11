import { z } from 'zod';

export const updateProfileSchema = z.object({
  username: z.string().trim().min(3).max(32),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const parseUpdateProfileBody = (
  body: unknown,
): UpdateProfileInput => updateProfileSchema.parse(body);

