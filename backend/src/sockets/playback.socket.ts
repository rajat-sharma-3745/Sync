import type { Server, Socket } from 'socket.io';

import { logger } from '../config/logger.js';
import { Room } from '../db/models/Room.js';
import { QueueItem } from '../db/models/QueueItem.js';

interface PlaybackState {
  videoId: string | null;
  position: number;
  isPlaying: boolean;
  playbackRate: number;
  lastUpdatedAt: number;
}

export interface PlaybackStateSnapshot {
  videoId: string | null;
  position: number;
  isPlaying: boolean;
  playbackRate: number;
}

// roomId -> playback state
const playbackState = new Map<string, PlaybackState>();

export const upsertPlaybackState = (
  roomId: string,
  state: PlaybackStateSnapshot,
): PlaybackState => {
  const updated: PlaybackState = {
    ...state,
    lastUpdatedAt: Date.now(),
  };
  playbackState.set(roomId, updated);
  return updated;
};

export const getOrHydratePlaybackState = async (
  roomId: string,
): Promise<PlaybackState | null> => {
  const existing = playbackState.get(roomId);
  if (existing) {
    return existing;
  }

  const room = await Room.findById(roomId).exec();
  if (!room) {
    return null;
  }

  const hasPlaybackInfo =
    typeof room.currentVideoId === 'string' ||
    typeof room.currentTime === 'number' ||
    typeof room.isPlaying === 'boolean' ||
    typeof room.playbackRate === 'number';

  if (!hasPlaybackInfo) {
    return null;
  }

  const hydrated: PlaybackState = {
    videoId: room.currentVideoId ?? null,
    position: room.currentTime ?? 0,
    isPlaying: room.isPlaying ?? false,
    playbackRate: room.playbackRate ?? 1,
    lastUpdatedAt: Date.now(),
  };

  playbackState.set(roomId, hydrated);

  return hydrated;
};

const ensureInRoom = (socket: Socket, roomId: string): boolean => {
  if (!socket.rooms.has(roomId)) {
    socket.emit('playback:error', { message: 'You must join the room first' });
    return false;
  }
  return true;
};

export const registerPlaybackSocketHandlers = (
  io: Server,
  socket: Socket,
): void => {
  const user = socket.data.user as { userId: string; username: string } | undefined;

  if (!user) {
    return;
  }

  socket.on('playback:state-request', async (payload: { roomId?: string }) => {
    const roomId = payload?.roomId;
    if (!roomId) return;

    const state = await getOrHydratePlaybackState(roomId);
    if (!state) return;

    socket.emit('playback:state', {
      roomId,
      ...state,
    });
  });

  socket.on(
    'playback:play',
    (payload: { roomId?: string; videoId?: string; position?: number }) => {
      const roomId = payload?.roomId;
      const videoId = payload?.videoId;
      const position = payload?.position ?? 0;

      if (!roomId || !videoId) {
        socket.emit('playback:error', {
          message: 'roomId and videoId are required',
        });
        return;
      }

      if (!ensureInRoom(socket, roomId)) return;

      const state: PlaybackState = {
        videoId,
        position,
        isPlaying: true,
        playbackRate: 1,
        lastUpdatedAt: Date.now(),
      };

      playbackState.set(roomId, state);

      void Room.findByIdAndUpdate(roomId, {
        currentVideoId: state.videoId,
        currentTime: state.position,
        isPlaying: state.isPlaying,
        playbackRate: state.playbackRate,
      }).catch((error) => {
        logger.warn('Failed to persist playback:play state', {
          roomId,
          error,
        });
      });

      io.to(roomId).emit('playback:play', {
        roomId,
        videoId,
        position,
        triggeredBy: {
          userId: user.userId,
          username: user.username,
        },
      });
    },
  );

  socket.on(
    'playback:pause',
    (payload: { roomId?: string; position?: number }) => {
      const roomId = payload?.roomId;
      const position = payload?.position ?? 0;

      if (!roomId) {
        socket.emit('playback:error', { message: 'roomId is required' });
        return;
      }

      if (!ensureInRoom(socket, roomId)) return;

      const existing = playbackState.get(roomId) ?? {
        videoId: null,
        position,
        isPlaying: false,
        playbackRate: 1,
        lastUpdatedAt: Date.now(),
      };

      const updated: PlaybackState = {
        ...existing,
        position,
        isPlaying: false,
        lastUpdatedAt: Date.now(),
      };

      playbackState.set(roomId, updated);

      void Room.findByIdAndUpdate(roomId, {
        currentVideoId: updated.videoId,
        currentTime: updated.position,
        isPlaying: updated.isPlaying,
        playbackRate: updated.playbackRate,
      }).catch((error) => {
        logger.warn('Failed to persist playback:pause state', {
          roomId,
          error,
        });
      });

      io.to(roomId).emit('playback:pause', {
        roomId,
        position,
        triggeredBy: {
          userId: user.userId,
          username: user.username,
        },
      });
    },
  );

  socket.on(
    'playback:seek',
    (payload: { roomId?: string; position?: number }) => {
      const roomId = payload?.roomId;
      const position = payload?.position ?? 0;

      if (!roomId) {
        socket.emit('playback:error', { message: 'roomId is required' });
        return;
      }

      if (!ensureInRoom(socket, roomId)) return;

      const existing = playbackState.get(roomId);

      if (existing) {
        const updated: PlaybackState = {
          ...existing,
          position,
          lastUpdatedAt: Date.now(),
        };

        playbackState.set(roomId, updated);

        void Room.findByIdAndUpdate(roomId, {
          currentVideoId: updated.videoId,
          currentTime: updated.position,
          isPlaying: updated.isPlaying,
          playbackRate: updated.playbackRate,
        }).catch((error) => {
          logger.warn('Failed to persist playback:seek state (existing)', {
            roomId,
            error,
          });
        });
      } else {
        const created: PlaybackState = {
          videoId: null,
          position,
          isPlaying: false,
          playbackRate: 1,
          lastUpdatedAt: Date.now(),
        };

        playbackState.set(roomId, created);

        void Room.findByIdAndUpdate(roomId, {
          currentVideoId: created.videoId,
          currentTime: created.position,
          isPlaying: created.isPlaying,
          playbackRate: created.playbackRate,
        }).catch((error) => {
          logger.warn('Failed to persist playback:seek state (created)', {
            roomId,
            error,
          });
        });
      }

      io.to(roomId).emit('playback:seek', {
        roomId,
        position,
        triggeredBy: {
          userId: user.userId,
          username: user.username,
        },
      });
    },
  );

  socket.on(
    'playback:ended',
    async (payload: { roomId?: string; videoId?: string }) => {
      const roomId = payload?.roomId;
      const endedVideoId = payload?.videoId;

      if (!roomId || !endedVideoId) {
        socket.emit('playback:error', {
          message: 'roomId and videoId are required',
        });
        return;
      }

      if (!ensureInRoom(socket, roomId)) return;

      const currentState = await getOrHydratePlaybackState(roomId);
      const currentVideoId = currentState?.videoId ?? null;

      // Ignore stale/duplicate ended events so multiple clients do not skip items.
      if (!currentVideoId || currentVideoId !== endedVideoId) {
        return;
      }

      const roomQueue = await QueueItem.find({ roomId })
        .sort({ position: 1 })
        .exec();
      const currentIndex = roomQueue.findIndex(
        (item) => item.videoId === currentVideoId,
      );
      const nextItem =
        currentIndex >= 0 && currentIndex + 1 < roomQueue.length
          ? roomQueue[currentIndex + 1]
          : null;

      if (!nextItem) {
        const updated: PlaybackState = {
          videoId: currentVideoId,
          position: 0,
          isPlaying: false,
          playbackRate: currentState?.playbackRate ?? 1,
          lastUpdatedAt: Date.now(),
        };

        playbackState.set(roomId, updated);
        void Room.findByIdAndUpdate(roomId, {
          currentVideoId: updated.videoId,
          currentTime: updated.position,
          isPlaying: updated.isPlaying,
          playbackRate: updated.playbackRate,
        }).catch((error) => {
          logger.warn('Failed to persist playback:ended pause state', {
            roomId,
            error,
          });
        });

        io.to(roomId).emit('playback:pause', {
          roomId,
          position: 0,
          triggeredBy: {
            userId: user.userId,
            username: user.username,
          },
        });
        return;
      }

      const updated: PlaybackState = {
        videoId: nextItem.videoId,
        position: 0,
        isPlaying: true,
        playbackRate: currentState?.playbackRate ?? 1,
        lastUpdatedAt: Date.now(),
      };

      playbackState.set(roomId, updated);
      void Room.findByIdAndUpdate(roomId, {
        currentVideoId: updated.videoId,
        currentTime: updated.position,
        isPlaying: updated.isPlaying,
        playbackRate: updated.playbackRate,
      }).catch((error) => {
        logger.warn('Failed to persist playback:ended next state', {
          roomId,
          error,
        });
      });

      io.to(roomId).emit('playback:play', {
        roomId,
        videoId: updated.videoId,
        position: updated.position,
        triggeredBy: {
          userId: user.userId,
          username: user.username,
        },
      });
    },
  );

  socket.on('disconnect', (reason) => {
    logger.debug('Playback socket disconnected', {
      socketId: socket.id,
      reason,
    });
  });
};

