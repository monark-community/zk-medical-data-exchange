import type { Request, Response } from 'express';
import logger from '@/utils/logger';
import crypto from 'crypto';

export async function generateNonce(req: Request, res: Response) {
  try {
    logger.info('Generating nonce for authentication');

    const { walletAddress } = req.body;
    if (!walletAddress) {
      logger.error('No wallet address provided');
      return res.status(400).json({ error: 'No wallet address provided' });
    }

    const nonce = crypto.randomUUID();
    const message = `Sign this nonce to authenticate: ${nonce}`;

    res.json({ nonce, message });
  } catch (err) {
    logger.error(err);
  }
}