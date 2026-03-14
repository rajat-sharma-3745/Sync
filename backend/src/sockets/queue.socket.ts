import { getIo } from './index.js';
import { getRoomQueue } from '../modules/queue/queue.service.js';

export const emitQueueUpdated = async (roomId: string): Promise<void> => {
  const io = getIo();

  const items = await getRoomQueue(roomId);

  io.to(roomId).emit('queue:updated', { items });
};

export const emitQueueItemAdded = async (roomId: string): Promise<void> => {
  await emitQueueUpdated(roomId);
};

export const emitQueueItemRemoved = async (roomId: string): Promise<void> => {
  await emitQueueUpdated(roomId);
};

