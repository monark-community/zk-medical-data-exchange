import { Router } from 'express';
import { generateNonce, verifySignature } from '@/controllers/authController';
import { authRateLimit } from '@/middleware/securityMiddleware';

const router = Router();

// Apply rate limiting to auth endpoints
router.post('/nonce', authRateLimit, generateNonce);
router.post('/verify', authRateLimit, verifySignature);

export default router;
