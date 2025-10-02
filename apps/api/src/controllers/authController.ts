import type { Request, Response } from 'express';
import logger from '@/utils/logger';
import crypto from 'crypto';
import { ethers } from 'ethers';
import { nonceStore } from '@/services/nonceStore';
import { generateAuthMessage, parseAuthMessage, validateAuthMessage, AUTH_CONFIG } from '@/utils/authMessage';
import { generateToken, getTokenExpiration } from '@/utils/jwt';

export async function generateNonce(req: Request, res: Response) {
  try {
    logger.info('Generating nonce for authentication');

    const { walletAddress } = req.body;
    if (!walletAddress) {
      logger.error('No wallet address provided');
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    if (!ethers.isAddress(walletAddress)) {
      logger.error(`Invalid wallet address format: ${walletAddress}`);
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    const nonce = crypto.randomUUID();
    const issuedAt = new Date().toISOString();

    nonceStore.setNonce(nonce, walletAddress);

    const message = generateAuthMessage({
      appName: AUTH_CONFIG.APP_NAME,
      walletAddress: walletAddress,
      nonce: nonce,
      issuedAt: issuedAt,
    });

    logger.info(`Nonce generated successfully.`);
    res.json({ 
      nonce, 
      message,
      expiresIn: AUTH_CONFIG.MAX_MESSAGE_AGE_MS / 1000
    });
  } catch (err) {
    logger.error(`Error generating nonce: ${err}`);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function verifySignature(req: Request, res: Response) {
  try {
    logger.info('Verifying signature for authentication');

    const { walletAddress, signature, message } = req.body;
    
    if (!walletAddress || !signature || !message) {
      logger.error('Missing required fields for signature verification');
      return res.status(400).json({ error: 'walletAddress, signature, and message are required' });
    }

    if (!ethers.isAddress(walletAddress)) {
      logger.error(`Invalid wallet address format: ${walletAddress}`);
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    const parsedMessage = parseAuthMessage(message);
    if (!parsedMessage) {
      logger.error(`Invalid message format for wallet: ${walletAddress}`);
      return res.status(400).json({ error: 'Invalid message format' });
    }

    const messageValidation = validateAuthMessage(
      parsedMessage, 
      walletAddress, 
      parsedMessage.nonce,
      AUTH_CONFIG.MAX_MESSAGE_AGE_MS
    );

    if (!messageValidation.isValid) {
      logger.error(`Message validation failed for wallet ${walletAddress}: ${messageValidation.error}`);
      return res.status(400).json({ error: 'Invalid authentication message' });
    }

    const nonceValid = nonceStore.validateAndConsumeNonce(parsedMessage.nonce, walletAddress);
    if (!nonceValid) {
      logger.error(`Nonce validation failed for wallet ${walletAddress}, nonce: ${parsedMessage.nonce}`);
      return res.status(401).json({ error: 'Invalid or expired nonce' });
    }

    let recoveredAddress: string;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
    } catch (sigError) {
      logger.error(`Signature verification failed for wallet ${walletAddress}: ${sigError}`);
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      logger.error(`Signature address mismatch - expected: ${walletAddress}, recovered: ${recoveredAddress}`);
      return res.status(401).json({ error: 'Signature verification failed' });
    }

    logger.info(`Authentication successful for wallet: ${walletAddress}`);
    
    const token = generateToken(recoveredAddress);
    const expiresIn = getTokenExpiration();
    
    res.json({ 
      success: true, 
      message: 'Authentication successful',
      token,
      walletAddress: recoveredAddress,
      expiresIn,
      authenticatedAt: new Date().toISOString()
    });
  } catch (err) {
    logger.error(`Error verifying signature: ${err}`);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const walletAddress = (req as any).user?.walletAddress;
    
    if (walletAddress) {
      logger.info(`Logout successful for wallet: ${walletAddress}`);
    } else {
      logger.info('Logout requested (no authenticated user)');
    }
    
    res.json({ 
      success: true,
      message: 'Logout successful'
    });
  } catch (err) {
    logger.error(`Error during logout: ${err}`);
    res.status(500).json({ error: 'Internal server error' });
  }
}