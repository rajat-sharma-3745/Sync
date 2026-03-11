import { Router } from 'express';
import { authRateLimiter } from '../../middleware/rateLimit.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  signupHandler,
  loginHandler,
  meHandler,
  logoutHandler,
} from './auth.controller.js';

const router = Router();

router.post(
  '/signup',
  authRateLimiter,
  asyncHandler(signupHandler),
);

router.post(
  '/login',
  authRateLimiter,
  asyncHandler(loginHandler),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(meHandler),
);

router.post(
  '/logout',
  requireAuth,
  asyncHandler(logoutHandler),
);

export default router;

