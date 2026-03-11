import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  getMeHandler,
  updateProfileHandler,
  getMyRoomsHandler,
} from './user.controller.js';

const router = Router();

router.get(
  '/me',
  requireAuth,
  asyncHandler(getMeHandler),
);

router.patch(
  '/me',
  requireAuth,
  asyncHandler(updateProfileHandler),
);

router.get(
  '/me/rooms',
  requireAuth,
  asyncHandler(getMyRoomsHandler),
);

export default router;

