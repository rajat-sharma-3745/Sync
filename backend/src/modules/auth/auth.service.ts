import { StatusCodes } from 'http-status-codes';
import { User, type IUser } from '../../db/models/User.js';
import { ApiError } from '../../utils/apiError.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { signAccessToken } from '../../utils/jwt.js';
import type { LoginInput, SignupInput } from './auth.schemas.js';

export interface UserDto {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  createdAt: Date;
}

const toUserDto = (user: IUser): UserDto => ({
  id: user._id.toString(),
  email: user.email,
  username: user.username,
  createdAt: user.createdAt,
  ...(user.avatarUrl && {avatarUrl: user.avatarUrl})  ,
});

export const signup = async (data: SignupInput): Promise<UserDto> => {
  const email = data.email.toLowerCase();

  const existing = await User.findOne({
    $or: [{ email }, { username: data.username }],
  }).lean<IUser>().exec();

  if (existing) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'User with this email or username already exists',
    );
  }

  const passwordHash = await hashPassword(data.password);

  const user = await User.create({
    email,
    username: data.username,
    passwordHash,
  });

  return toUserDto(user);
};

export const login = async (
  data: LoginInput,
): Promise<{ user: UserDto; accessToken: string }> => {
  const email = data.email.toLowerCase();

  const user = await User.findOne({ email }).exec();

  const invalidCredentialsError = new ApiError(
    StatusCodes.UNAUTHORIZED,
    'Invalid email or password',
  );

  if (!user) {
    throw invalidCredentialsError;
  }

  const isMatch = await comparePassword(data.password, user.passwordHash);

  if (!isMatch) {
    throw invalidCredentialsError;
  }

  const dto = toUserDto(user);
  const accessToken = signAccessToken({
    userId: dto.id,
    username: dto.username,
  });

  return { user: dto, accessToken };
};

export const getUserById = async (id: string): Promise<UserDto> => {
  const user = await User.findById(id).exec();

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  return toUserDto(user);
};

