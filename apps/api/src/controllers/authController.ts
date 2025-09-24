import type { Request, Response } from 'express';
import logger from '@/utils/logger';
import crypto from 'crypto';
import { ethers } from 'ethers';

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

export async function verifySignature(req: Request, res: Response) {
  try {
    logger.info('Verifying signature for authentication');

    const { walletAddress, signature, message } = req.body;
    
    if (!walletAddress || !signature || !message) {
      logger.error('Missing required fields for signature verification');
      return res.status(400).json({ error: 'Missing walletAddress, signature, or message' });
    }

    // Verify the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      logger.error('Signature verification failed - address mismatch');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    logger.info(`Signature verified successfully for address: ${walletAddress}`);
    
    // Here you could generate a JWT token or session
    // For now, just return success
    res.json({ 
      success: true, 
      message: 'Signature verified successfully',
      walletAddress: recoveredAddress
    });
  } catch (err) {
    logger.error(`Error verifying signature: ${err}`);
    res.status(500).json({ error: 'Internal server error during signature verification' });
  }
}