import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  sendMessageHandler,
  getMessagesHandler,
} from './chat.controller.js';

const router = Router();

router.get(
  '/rooms/:roomId/messages',
  requireAuth,
  asyncHandler(getMessagesHandler),
);

router.post(
  '/rooms/:roomId/messages',
  requireAuth,
  asyncHandler(sendMessageHandler),
);

export default router;