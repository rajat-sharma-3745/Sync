import type { Message, PresenceMember, QueueItem, Room } from '../types/room';

export const mockRoom: Room = {
  id: 'room-1',
  name: 'Chill Lo-Fi Room',
  description: 'Listen together and chat',
  isPublic: true,
  hostId: 'user-host',
  inviteCode: 'LOFI123',
  queueLocked: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockQueue: QueueItem[] = [
  {
    id: 'queue-1',
    roomId: mockRoom.id,
    source: 'YOUTUBE',
    videoId: '5qap5aO4i9A',
    title: 'lofi hip hop radio – beats to relax/study to',
    thumbnailUrl: 'https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg',
    durationSeconds: 7200,
    addedByUserId: 'user-123',
    position: 1,
  },
  {
    id: 'queue-2',
    roomId: mockRoom.id,
    source: 'YOUTUBE',
    videoId: 'DWcJFNfaw9c',
    title: 'coffee shop radio ☕',
    thumbnailUrl: 'https://i.ytimg.com/vi/DWcJFNfaw9c/hqdefault.jpg',
    durationSeconds: 5400,
    addedByUserId: 'user-456',
    position: 2,
  },
];

export const mockMessages: Message[] = [
  {
    id: 'msg-1',
    roomId: mockRoom.id,
    userId: 'user-123',
    username: 'Alice',
    content: 'Hey, welcome to the room!',
    type: 'USER',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'msg-2',
    roomId: mockRoom.id,
    content: 'user-456 joined the room',
    type: 'SYSTEM',
    createdAt: new Date().toISOString(),
  },
];

export const mockPresence: PresenceMember[] = [
  { userId: 'user-host', username: 'HostUser', status: 'synced' },
  { userId: 'user-123', username: 'Alice', status: 'behind' },
  { userId: 'user-456', username: 'Bob', status: 'buffering' },
];

