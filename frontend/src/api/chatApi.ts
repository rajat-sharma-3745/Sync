import type { Message } from '../types/room';
import { httpClient } from './httpClient';

export interface GetMessagesOptions {
  limit?: number;
  before?: string;
}

export const chatApi = {
  getMessages: (
    roomId: string,
    options?: GetMessagesOptions,
  ): Promise<{ messages: Message[] }> => {
    const params = new URLSearchParams();
    if (options?.limit != null) params.set('limit', String(options.limit));
    if (options?.before != null) params.set('before', options.before);
    const query = params.toString();
    const url = `/api/rooms/${encodeURIComponent(roomId)}/messages${query ? `?${query}` : ''}`;
    return httpClient.get<{ messages: Message[] }>(url);
  },

  sendMessage: (
    roomId: string,
    content: string,
  ): Promise<Message> =>
    httpClient.post<Message>(
      `/api/rooms/${encodeURIComponent(roomId)}/messages`,
      { content },
    ),
};
