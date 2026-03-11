import bcrypt from 'bcryptjs';

const DEFAULT_SALT_ROUNDS = 10;

export const hashPassword = async (plainPassword: string): Promise<string> => {
  const salt = await bcrypt.genSalt(DEFAULT_SALT_ROUNDS);
  return bcrypt.hash(plainPassword, salt);
};

export const comparePassword = async (
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> => {
  return bcrypt.compare(plainPassword, passwordHash);
};

