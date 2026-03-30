import type { QueueItem } from '../types/room';
import { httpClient } from './httpClient';

export interface AddToQueuePayload {
  videoId: string;
  title: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
}

export interface ReorderItem {
  itemId: string;
  position: number;
}

export const queueApi = {
  getRoomQueue: (roomId: string): Promise<{ items: QueueItem[] }> =>
    httpClient.get<{ items: QueueItem[] }>(
      `/api/rooms/${encodeURIComponent(roomId)}/queue`,
    ),

  addToQueue: (
    roomId: string,
    payload: AddToQueuePayload,
  ): Promise<QueueItem> =>
    httpClient.post<QueueItem>(
      `/api/rooms/${encodeURIComponent(roomId)}/queue`,
      payload,
    ),

  removeFromQueue: (
    roomId: string,
    itemId: string,
  ): Promise<{ success: boolean }> =>
    httpClient.delete<{ success: boolean }>(
      `/api/rooms/${encodeURIComponent(roomId)}/queue/${encodeURIComponent(itemId)}`,
    ),

  reorderQueue: (
    roomId: string,
    items: ReorderItem[],
  ): Promise<{ success: boolean }> =>
    httpClient.patch<{ success: boolean }>(
      `/api/rooms/${encodeURIComponent(roomId)}/queue/reorder`,
      { items },
    ),
};
