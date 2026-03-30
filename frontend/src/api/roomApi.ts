import type { Room } from '../types/room';
import { httpClient } from './httpClient';

export interface CreateRoomPayload {
  name: string;
  description?: string;
  isPublic: boolean;
}

export const roomApi = {
  listPublicRooms: (): Promise<{ rooms: Room[] }> =>
    httpClient.get<{ rooms: Room[] }>('/api/rooms/public'),

  createRoom: (payload: CreateRoomPayload): Promise<Room> =>
    httpClient.post<Room>('/api/rooms', payload),

  getRoom: (roomId: string): Promise<Room> =>
    httpClient.get<Room>(`/api/rooms/${encodeURIComponent(roomId)}`),

  joinRoom: (roomId: string): Promise<Room> =>
    httpClient.post<Room>(`/api/rooms/${encodeURIComponent(roomId)}/join`),

  joinByInviteCode: (inviteCode: string): Promise<Room> =>
    httpClient.post<Room>(`/api/rooms/join/${encodeURIComponent(inviteCode)}`),
};

