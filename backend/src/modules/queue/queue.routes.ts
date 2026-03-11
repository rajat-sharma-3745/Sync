import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  getQueueHandler,
  addToQueueHandler,
  removeFromQueueHandler,
  reorderQueueHandler,
} from './queue.controller.js';

const router = Router();

router.get(
  '/rooms/:roomId/queue',
  requireAuth,
  asyncHandler(getQueueHandler),
);

router.post(
  '/rooms/:roomId/queue',
  requireAuth,
  asyncHandler(addToQueueHandler),
);

router.delete(
  '/rooms/:roomId/queue/:itemId',
  requireAuth,
  asyncHandler(removeFromQueueHandler),
);

router.patch(
  '/rooms/:roomId/queue/reorder',
  requireAuth,
  asyncHandler(reorderQueueHandler),
);

export default router;