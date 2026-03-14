import type { Server, Socket } from 'socket.io';

import { logger } from '../config/logger.js';
import { sendMessage, type MessageDto } from '../modules/chat/chat.service.js';

export const registerChatSocketHandlers = (
  io: Server,
  socket: Socket,
): void => {
  const user = socket.data.user as { userId: string; username: string } | undefined;

  if (!user) {
    logger.warn('Chat socket without user data', { socketId: socket.id });
    return;
  }

  socket.on(
    'chat:send',
    async (payload: { roomId?: string; content?: string }) => {
      const roomId = payload?.roomId;
      const content = payload?.content;

      if (!roomId || !content) {
        socket.emit('chat:error', {
          message: 'roomId and content are required',
        });
        return;
      }

      if (!socket.rooms.has(roomId)) {
        socket.emit('chat:error', {
          message: 'You must join the room first',
        });
        return;
      }

      try {
        const message: MessageDto = await sendMessage(user.userId, {
          roomId,
          content,
        });

        io.to(roomId).emit('chat:message', message);
      } catch (error) {
        logger.warn('chat:send failed', {
          socketId: socket.id,
          roomId,
          error,
        });
        socket.emit('chat:error', { message: 'Unable to send message' });
      }
    },
  );

  socket.on('chat:typing-start', (payload: { roomId?: string }) => {
    const roomId = payload?.roomId;
    if (!roomId) return;

    if (!socket.rooms.has(roomId)) return;

    io.to(roomId).emit('chat:typing', {
      roomId,
      userId: user.userId,
      username: user.username,
      isTyping: true,
    });
  });

  socket.on('chat:typing-stop', (payload: { roomId?: string }) => {
    const roomId = payload?.roomId;
    if (!roomId) return;

    if (!socket.rooms.has(roomId)) return;

    io.to(roomId).emit('chat:typing', {
      roomId,
      userId: user.userId,
      username: user.username,
      isTyping: false,
    });
  });
};

