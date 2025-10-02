import { Router } from 'express';
import { generateNonce, verifySignature, logout } from '@/controllers/authController';
import { authMiddleware } from '@/middleware/tokenValidationMiddleware';

const router = Router();

// Public auth endpoints
router.post('/nonce', generateNonce);
router.post('/verify', verifySignature);

// Protected auth endpoints (require authentication)
router.post('/logout', authMiddleware, logout);

export default router;
