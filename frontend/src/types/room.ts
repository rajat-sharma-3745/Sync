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
  currentVideoId?: string;
  currentTime?: number;
  isPlaying?: boolean;
  playbackRate?: number;
}

export interface RoomMemberPreview {
  userId: string;
  username: string;
  avatarUrl?: string;
}

/** Room row returned by list endpoints (public + my rooms). */
export interface RoomListItem extends Room {
  hostUsername: string;
  hostAvatarUrl?: string;
  currentVideoTitle?: string;
  memberCount: number;
  memberPreview: RoomMemberPreview[];
}

export type RoomMemberRole = 'HOST' | 'MEMBER';

export interface MyRoomListItem extends RoomListItem {
  role: RoomMemberRole;
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

