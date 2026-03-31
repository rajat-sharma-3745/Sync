import type { Room, RoomJoinRequest, RoomListItem } from '../types/room';
import { httpClient } from './httpClient';

export interface CreateRoomPayload {
  name: string;
  description?: string;
  isPublic: boolean;
}

export interface ToggleQueueLockPayload {
  roomId: string;
  queueLocked: boolean;
}

export const roomApi = {
  listPublicRooms: (): Promise<{ rooms: RoomListItem[] }> =>
    httpClient.get<{ rooms: RoomListItem[] }>('/api/rooms/public'),

  createRoom: (payload: CreateRoomPayload): Promise<Room> =>
    httpClient.post<Room>('/api/rooms', payload),

  getRoom: (roomId: string): Promise<Room> =>
    httpClient.get<Room>(`/api/rooms/${encodeURIComponent(roomId)}`),

  joinRoom: (roomId: string): Promise<Room> =>
    httpClient.post<Room>(`/api/rooms/${encodeURIComponent(roomId)}/join`),

  joinByInviteCode: (inviteCode: string): Promise<Room> =>
    httpClient.post<Room>(`/api/rooms/join/${encodeURIComponent(inviteCode)}`),

  requestJoinByInviteCode: (inviteCode: string): Promise<RoomJoinRequest> =>
    httpClient.post<RoomJoinRequest>(
      `/api/rooms/join/${encodeURIComponent(inviteCode)}/request`,
    ),

  listPendingJoinRequests: (roomId: string): Promise<{ requests: RoomJoinRequest[] }> =>
    httpClient.get<{ requests: RoomJoinRequest[] }>(
      `/api/rooms/${encodeURIComponent(roomId)}/join-requests`,
    ),

  approveJoinRequest: (roomId: string, requestId: string): Promise<{ success: true }> =>
    httpClient.post<{ success: true }>(
      `/api/rooms/${encodeURIComponent(roomId)}/join-requests/${encodeURIComponent(requestId)}/approve`,
    ),

  denyJoinRequest: (roomId: string, requestId: string): Promise<{ success: true }> =>
    httpClient.post<{ success: true }>(
      `/api/rooms/${encodeURIComponent(roomId)}/join-requests/${encodeURIComponent(requestId)}/deny`,
    ),

  cancelJoinRequest: (roomId: string, requestId: string): Promise<{ success: true }> =>
    httpClient.post<{ success: true }>(
      `/api/rooms/${encodeURIComponent(roomId)}/join-requests/${encodeURIComponent(requestId)}/cancel`,
    ),

  toggleQueueLock: (roomId: string, queueLocked: boolean): Promise<Room> =>
    httpClient.post<Room>(
      `/api/rooms/${encodeURIComponent(roomId)}/queue-lock`,
      { roomId, queueLocked } satisfies ToggleQueueLockPayload,
    ),
};

