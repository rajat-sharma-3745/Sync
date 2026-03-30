import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import type { Message, PresenceMember, QueueItem, Room } from '../types/room';
import { roomApi } from '../api/roomApi';
import { queueApi } from '../api/queueApi';
import { chatApi } from '../api/chatApi';
import { useSocket } from '../hooks/useSocket';

interface RoomContextValue {
  currentRoom: Room | null;
  queue: QueueItem[];
  messages: Message[];
  presence: PresenceMember[];
  loadingRoom: boolean;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => void;
  setQueueLock: (queueLocked: boolean) => Promise<void>;
}

const RoomContext = createContext<RoomContextValue | undefined>(undefined);

const RoomProvider = ({ children }: PropsWithChildren) => {
  const { socket } = useSocket();

  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const currentRoomRef = useRef<Room | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [presence, setPresence] = useState<PresenceMember[]>([]);
  const [loadingRoom, setLoadingRoom] = useState(false);

  const joinRoom = useCallback(
    async (roomId: string): Promise<void> => {
      if (currentRoomRef.current?.id === roomId) return;
      setLoadingRoom(true);
      try {
        const room = await roomApi.joinRoom(roomId);
        setCurrentRoom(room);
        currentRoomRef.current = room;
        const [{ items: queueItems }, { messages: initialMessages }] =
          await Promise.all([
            queueApi.getRoomQueue(roomId),
            chatApi.getMessages(roomId, { limit: 50 }),
          ]);
        setQueue(queueItems);
        setMessages(initialMessages);
        if (socket) {
          socket.emit('room:join', { roomId: room.id });
        }
      } finally {
        setLoadingRoom(false);
      }
    },
    [socket],
  );

  const leaveRoom = useCallback((): void => {
    const room = currentRoomRef.current;
    if (socket && room) {
      socket.emit('room:leave', { roomId: room.id });
    }
    setCurrentRoom(null);
    currentRoomRef.current = null;
    setQueue([]);
    setMessages([]);
    setPresence([]);
  }, [socket]);

  const setQueueLock = useCallback(
    async (queueLocked: boolean): Promise<void> => {
      const room = currentRoomRef.current;
      if (!room) return;
      const updatedRoom = await roomApi.toggleQueueLock(room.id, queueLocked);
      setCurrentRoom(updatedRoom);
      currentRoomRef.current = updatedRoom;
    },
    [],
  );

  useEffect(() => {
    if (!socket) return undefined;

    const handlePresence = (members: PresenceMember[]) => {
      setPresence(members);
    };

    const handleQueueUpdated = (payload: { items: QueueItem[] }) => {
      setQueue(payload.items);
    };

    const handleMessage = (message: Message) => {
      setMessages((prev) =>
        prev.some((m) => m.id === message.id) ? prev : [...prev, message],
      );
    };

    socket.on('room:presence', handlePresence);
    socket.on('queue:updated', handleQueueUpdated);
    socket.on('chat:message', handleMessage);

    return () => {
      socket.off('room:presence', handlePresence);
      socket.off('queue:updated', handleQueueUpdated);
      socket.off('chat:message', handleMessage);
    };
  }, [socket]);

  const value = useMemo<RoomContextValue>(
    () => ({
      currentRoom,
      queue,
      messages,
      presence,
      loadingRoom,
      joinRoom,
      leaveRoom,
      setQueueLock,
    }),
    [
      currentRoom,
      queue,
      messages,
      presence,
      loadingRoom,
      joinRoom,
      leaveRoom,
      setQueueLock,
    ],
  );

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
};

export { RoomContext, RoomProvider };

