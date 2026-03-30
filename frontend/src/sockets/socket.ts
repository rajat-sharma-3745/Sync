import { io, type Socket } from 'socket.io-client';

export type AppSocket = Socket;

const socketUrl =
  import.meta.env.VITE_SOCKET_URL ??
  import.meta.env.VITE_API_URL ??
  window.location.origin;

export const createSocket = (): AppSocket =>
  io(socketUrl, {
    autoConnect: false,
    withCredentials: true,
  });

