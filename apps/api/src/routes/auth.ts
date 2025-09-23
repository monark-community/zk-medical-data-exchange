import { Router } from 'express';
import { generateNonce } from '@/controllers/authController';

const router = Router();
router.post('/nonce', generateNonce);

export default router;
