import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  createRoomHandler,
  getRoomHandler,
  listPublicRoomsHandler,
  joinPublicRoomHandler,
  joinByInviteHandler,
  updateRoomHandler,
  toggleQueueLockHandler,
  kickMemberHandler,
  transferHostHandler,
} from './room.controller.js';

const router = Router();

router.post(
  '/rooms',
  requireAuth,
  asyncHandler(createRoomHandler),
);

router.get(
  '/rooms/public',
  requireAuth,
  asyncHandler(listPublicRoomsHandler),
);
router.get(
  '/rooms/:roomId',
  requireAuth,
  asyncHandler(getRoomHandler),
);


router.post(
  '/rooms/:roomId/join',
  requireAuth,
  asyncHandler(joinPublicRoomHandler),
);

router.post(
  '/rooms/join/:inviteCode',
  requireAuth,
  asyncHandler(joinByInviteHandler),
);

router.patch(
  '/rooms/:roomId',
  requireAuth,
  asyncHandler(updateRoomHandler),
);

router.post(
  '/rooms/:roomId/queue-lock',
  requireAuth,
  asyncHandler(toggleQueueLockHandler),
);

router.post(
  '/rooms/:roomId/kick',
  requireAuth,
  asyncHandler(kickMemberHandler),
);

router.post(
  '/rooms/:roomId/transfer-host',
  requireAuth,
  asyncHandler(transferHostHandler),
);

export default router;

