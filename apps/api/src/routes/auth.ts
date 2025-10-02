import { Router } from 'express';
import { generateNonce, verifySignature, logout } from '@/controllers/authController';
import { authMiddleware } from '@/middleware/authMiddleware';

const router = Router();

// Public endpoints
router.post('/nonce', generateNonce);
router.post('/verify', verifySignature);

// Protected endpoints (require authentication enforced by authMiddleware)
router.post('/logout', authMiddleware, logout);

export default router;
