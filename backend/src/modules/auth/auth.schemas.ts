import { z } from 'zod';

export const signupSchema = z.object({
  email: z.email(),
  username: z.string().trim().min(3).max(32),
  password: z.string().min(6).max(128),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6).max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const parseSignupBody = (body: unknown): SignupInput =>
  signupSchema.parse(body);

export const parseLoginBody = (body: unknown): LoginInput =>
  loginSchema.parse(body);

