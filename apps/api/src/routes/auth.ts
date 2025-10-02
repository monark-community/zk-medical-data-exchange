import { Router } from 'express';
import { generateNonce, verifySignature } from '@/controllers/authController';

const router = Router();

// Apply rate limiting to auth endpoints
router.post('/nonce', generateNonce);
router.post('/verify', verifySignature);

export default router;
