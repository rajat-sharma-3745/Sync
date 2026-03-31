import type { Server as HttpServer } from "http";
import { Server, type Socket } from "socket.io";

import { logger } from "../config/logger.js";
import { verifyAccessToken } from "../utils/jwt.js";

import { registerRoomSocketHandlers } from "./room.socket.js";
import { registerPlaybackSocketHandlers } from "./playback.socket.js";
import { registerChatSocketHandlers } from "./chat.socket.js";
import cookieParser from "cookie-parser";
import type { Request, Response } from "express";

interface SocketUserData {
  userId: string;
  username: string;
}

const ACCESS_TOKEN_COOKIE_NAME = "accessToken";

let ioInstance: Server | null = null;

const parseCookies = (
  cookieHeader: string | undefined,
): Record<string, string> => {
  if (!cookieHeader) return {};

  return cookieHeader.split(";").reduce<Record<string, string>>((acc, part) => {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey) return acc;
    const key = decodeURIComponent(rawKey);
    const value = decodeURIComponent(rest.join("="));
    acc[key] = value;
    return acc;
  }, {});
};

const getTokenFromSocket = (socket: Socket): string | undefined => {
  const auth = socket.handshake.auth as { token?: unknown } | undefined;

  if (auth && typeof auth.token === "string" && auth.token.trim()) {
    return auth.token.trim();
  }

  const cookies = parseCookies(socket.handshake.headers.cookie);
  const cookieToken = cookies[ACCESS_TOKEN_COOKIE_NAME];

  if (cookieToken && typeof cookieToken === "string" && cookieToken.trim()) {
    return cookieToken.trim();
  }

  return undefined;
};

export const initSocketServer = (httpServer: HttpServer): Server | void => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const middleware = cookieParser(); // or cookieParser(SECRET) if using signed cookies

    middleware(socket.request as Request, {} as Response, (err?: any) => {
      if (err) {
        return next(err);
      }

      try {
        const req = socket.request as Request & {
          cookies?: Record<string, string>;
        };

        const cookieToken = req.cookies?.[ACCESS_TOKEN_COOKIE_NAME];
        const authToken =
          typeof socket.handshake.auth?.token === "string"
            ? socket.handshake.auth.token.trim()
            : undefined;

        const token = cookieToken || authToken;

        if (!token) {
          next(new Error("Authentication token missing"));
          return;
        }

        const payload = verifyAccessToken(token);

        socket.data.user = {
          userId: payload.userId,
          username: payload.username,
        } satisfies SocketUserData;

        next();
      } catch (error) {
        logger.warn("Socket authentication failed", error);
        next(new Error("Invalid or expired token"));
      }
    });
  });
  io.on("connection", (socket) => {
    const user = socket.data.user as SocketUserData | undefined;

    logger.info("Socket connected", {
      socketId: socket.id,
      userId: user?.userId,
      username: user?.username,
    });

    if (user?.userId) {
      void socket.join(`user:${user.userId}`);
    }

    registerRoomSocketHandlers(io, socket);
    registerPlaybackSocketHandlers(io, socket);
    registerChatSocketHandlers(io, socket);

    socket.on("disconnect", (reason) => {
      logger.info("Socket disconnected", {
        socketId: socket.id,
        reason,
      });
    });
  });

  ioInstance = io;

  return io;
};

export const getIo = (): Server => {
  if (!ioInstance) {
    throw new Error("Socket.io server has not been initialized yet");
  }

  return ioInstance;
};
