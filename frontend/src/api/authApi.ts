import type { LoginPayload, SignupPayload, User } from '../types/auth';
import { httpClient } from './httpClient';

export const authApi = {
  signup: (payload: SignupPayload): Promise<User> =>
    httpClient.post<User>('/api/auth/signup', payload),

  login: (payload: LoginPayload): Promise<User> =>
    httpClient.post<User>('/api/auth/login', payload),

  me: (): Promise<User> => httpClient.get<User>('/api/auth/me'),

  logout: (): Promise<{ message: string }> =>
    httpClient.post<{ message: string }>('/api/auth/logout'),
};

