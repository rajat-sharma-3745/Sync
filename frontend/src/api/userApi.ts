import type { User } from '../types/auth';
import type { Room } from '../types/room';
import { httpClient } from './httpClient';

export const userApi = {
  getCurrentUser: (): Promise<User> => httpClient.get<User>('/api/users/me'),

  updateProfile: (payload: { username: string }): Promise<User> =>
    httpClient.patch<User>('/api/users/me', payload),

  getMyRooms: (): Promise<{ rooms: Room[] }> =>
    httpClient.get<{ rooms: Room[] }>('/api/users/me/rooms'),
};

