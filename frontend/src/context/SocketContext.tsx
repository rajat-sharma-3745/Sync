import {
  createContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import type { AppSocket } from '../sockets/socket';
import { createSocket } from '../sockets/socket';
import { useAuth } from '../hooks/useAuth';

interface SocketContextValue {
  socket: AppSocket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

const SocketProvider = ({ children }: PropsWithChildren) => {
  const { isAuthenticated } = useAuth();
  const socketRef = useRef<AppSocket | null>(null);
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setConnected(false);
      return;
    }

    if (socketRef.current) {
      return;
    }

    const s = createSocket();
    socketRef.current = s;
    setSocket(s);

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    s.on('connect', handleConnect);
    s.on('disconnect', handleDisconnect);

    s.connect();

    return () => {
      s.off('connect', handleConnect);
      s.off('disconnect', handleDisconnect);
      s.disconnect();
      socketRef.current = null;
      setConnected(false);
      setSocket(null);
    };
  }, [isAuthenticated]);

  const value = useMemo<SocketContextValue>(
    () => ({ socket, connected }),
    [socket, connected],
  );

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export { SocketContext, SocketProvider };

