import type { Request, Response } from 'express';
import { ok, created } from '../../utils/responses.js';
import {
  parseSendMessageBody,
  parseGetMessagesQuery,
} from './chat.schemas.js';
import { sendMessage, getMessages } from './chat.service.js';
import { ApiError } from '../../utils/apiError.js';
import { StatusCodes } from 'http-status-codes';

export const sendMessageHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authenticated');
  }

  const { roomId } = req.params;
  const body = parseSendMessageBody({ ...req.body, roomId });

  const message = await sendMessage(req.user.userId, body);

  created(res, message);
};

export const getMessagesHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { roomId } = req.params;
  if (!roomId || Array.isArray(roomId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid roomId");
  }
  const input = parseGetMessagesQuery(roomId, req.query);

  const messages = await getMessages(input);

  ok(res, { messages });
};