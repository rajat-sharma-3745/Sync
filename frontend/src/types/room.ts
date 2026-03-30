export interface Room {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  hostId: string;
  inviteCode: string;
  queueLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QueueItem {
  id: string;
  roomId: string;
  source: 'YOUTUBE';
  videoId: string;
  title: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  addedByUserId: string;
  position: number;
}

export interface Message {
  id: string;
  roomId: string;
  userId?: string;
  username?: string;
  content: string;
  type: 'USER' | 'SYSTEM';
  createdAt: string;
}

export interface PresenceMember {
  userId: string;
  username: string;
  status?: 'synced' | 'behind' | 'buffering' | 'away';
}

