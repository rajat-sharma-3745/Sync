import { Types } from 'mongoose';
import type { Server, Socket } from 'socket.io';

import { Room } from '../db/models/Room.js';
import { RoomMember } from '../db/models/RoomMember.js';
import { RoomMemberRole } from '../types/common.js';
import { logger } from '../config/logger.js';
import { getOrHydratePlaybackState } from './playback.socket.js';

interface PresenceEntry {
  userId: string;
  username: string;
  status?: 'synced' | 'behind' | 'buffering' | 'away';
}

// roomId -> socketId -> PresenceEntry
const roomMembers = new Map<string, Map<string, PresenceEntry>>();

const ensureMemberNotBanned = async (
  roomId: string,
  userId: string,
): Promise<void> => {
  if (!Types.ObjectId.isValid(roomId)) {
    throw new Error('Invalid room id');
  }

  const roomExists = await Room.exists({ _id: roomId }).exec();
  if (!roomExists) {
    throw new Error('Room not found');
  }

  const member = await RoomMember.findOne({
    roomId,
    userId,
    isBanned: false,
  }).exec();

  if (!member) {
    throw new Error('Not a member of this room');
  }
};

const removeSocketFromAllRooms = (io: Server, socketId: string): void => {
  for (const [roomId, sockets] of roomMembers.entries()) {
    if (!sockets.has(socketId)) continue;

    const entry = sockets.get(socketId);
    sockets.delete(socketId);

    if (sockets.size === 0) {
      roomMembers.delete(roomId);
    }

    if (entry) {
      io.to(roomId).emit('room:user-left', {
        userId: entry.userId,
        username: entry.username,
      });
      broadcastPresence(io, roomId);
    }
  }
};

export const broadcastPresence = (io: Server, roomId: string): void => {
  const sockets = roomMembers.get(roomId);
  if (!sockets) return;

  const users = Array.from(sockets.values()).map((entry) => ({
    userId: entry.userId,
    username: entry.username,
    status: entry.status ?? 'synced',
  }));

  io.to(roomId).emit('room:presence', users);
};

export const removeUserFromRoomPresence = (
  io: Server,
  roomId: string,
  userId: string,
): void => {
  const sockets = roomMembers.get(roomId);
  if (!sockets) return;

  const socketIdsToRemove: string[] = [];
  for (const [socketId, entry] of sockets.entries()) {
    if (entry.userId === userId) {
      socketIdsToRemove.push(socketId);
    }
  }

  if (socketIdsToRemove.length === 0) return;

  for (const socketId of socketIdsToRemove) {
    sockets.delete(socketId);
    void io.sockets.sockets.get(socketId)?.leave(roomId);
  }

  if (sockets.size === 0) {
    roomMembers.delete(roomId);
  }

  broadcastPresence(io, roomId);
};

export const registerRoomSocketHandlers = (io: Server, socket: Socket): void => {
  const user = socket.data.user as { userId: string; username: string } | undefined;

  if (!user) {
    logger.warn('Socket connected without user data', { socketId: socket.id });
    return;
  }

  socket.on('room:join', async (payload: { roomId?: string }) => {
    const roomId = payload?.roomId;

    if (!roomId) {
      socket.emit('room:error', { message: 'roomId is required' });
      return;
    }

    try {
      await ensureMemberNotBanned(roomId, user.userId);

      await socket.join(roomId);

      let sockets = roomMembers.get(roomId);
      if (!sockets) {
        sockets = new Map<string, PresenceEntry>();
        roomMembers.set(roomId, sockets);
      }

      sockets.set(socket.id, {
        userId: user.userId,
        username: user.username,
      });

      io.to(roomId).emit('room:user-joined', {
        userId: user.userId,
        username: user.username,
      });

      broadcastPresence(io, roomId);

      const state = await getOrHydratePlaybackState(roomId);
      if (state && state.videoId) {
        socket.emit('playback:state', {
          roomId,
          ...state,
        });
      }
    } catch (error) {
      logger.warn('room:join failed', {
        socketId: socket.id,
        roomId,
        error,
      });
      socket.emit('room:error', { message: 'Unable to join room' });
    }
  });

  socket.on('room:leave', (payload: { roomId?: string }) => {
    const roomId = payload?.roomId;

    if (!roomId) {
      socket.emit('room:error', { message: 'roomId is required' });
      return;
    }

    void socket.leave(roomId);

    const sockets = roomMembers.get(roomId);
    if (!sockets) return;

    const entry = sockets.get(socket.id);
    sockets.delete(socket.id);

    if (sockets.size === 0) {
      roomMembers.delete(roomId);
    }

    if (entry) {
      io.to(roomId).emit('room:user-left', {
        userId: entry.userId,
        username: entry.username,
      });
      broadcastPresence(io, roomId);
    }
  });

  socket.on(
    'presence:client-state',
    (payload: { roomId?: string; status?: PresenceEntry['status'] }) => {
      const roomId = payload?.roomId;
      if (!roomId) return;

      const sockets = roomMembers.get(roomId);
      if (!sockets) return;

      const entry = sockets.get(socket.id);
      if (!entry) return;

      if (payload.status) {
        entry.status = payload.status;
        sockets.set(socket.id, entry);
        broadcastPresence(io, roomId);
      }
    },
  );

  socket.on('disconnect', () => {
    removeSocketFromAllRooms(io, socket.id);
  });
};

