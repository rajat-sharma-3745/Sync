import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  createRoomHandler,
  getRoomHandler,
  listPublicRoomsHandler,
  joinPublicRoomHandler,
  joinByInviteHandler,
  requestJoinByInviteHandler,
  listPendingJoinRequestsHandler,
  approveJoinRequestHandler,
  denyJoinRequestHandler,
  cancelJoinRequestHandler,
  updateRoomHandler,
  toggleQueueLockHandler,
  kickMemberHandler,
  banMemberHandler,
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
router.post(
  '/rooms/join/:inviteCode/request',
  requireAuth,
  asyncHandler(requestJoinByInviteHandler),
);
router.get(
  '/rooms/:roomId/join-requests',
  requireAuth,
  asyncHandler(listPendingJoinRequestsHandler),
);
router.post(
  '/rooms/:roomId/join-requests/:requestId/approve',
  requireAuth,
  asyncHandler(approveJoinRequestHandler),
);
router.post(
  '/rooms/:roomId/join-requests/:requestId/deny',
  requireAuth,
  asyncHandler(denyJoinRequestHandler),
);
router.post(
  '/rooms/:roomId/join-requests/:requestId/cancel',
  requireAuth,
  asyncHandler(cancelJoinRequestHandler),
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
  '/rooms/:roomId/ban',
  requireAuth,
  asyncHandler(banMemberHandler),
);

router.post(
  '/rooms/:roomId/transfer-host',
  requireAuth,
  asyncHandler(transferHostHandler),
);

export default router;

