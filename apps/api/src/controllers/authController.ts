import type { Request, Response } from 'express';
import logger from '@/utils/logger';
import crypto from 'crypto';
import { ethers } from 'ethers';
import { nonceStore } from '@/services/nonceStore';
import { generateAuthMessage, parseAuthMessage, validateAuthMessage, AUTH_CONFIG } from '@/utils/authMessage';

export async function generateNonce(req: Request, res: Response) {
  try {
    logger.info('Generating nonce for authentication');

    const { walletAddress } = req.body;
    if (!walletAddress) {
      logger.error('No wallet address provided');
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Validate wallet address format
    if (!ethers.isAddress(walletAddress)) {
      logger.error(`Invalid wallet address format: ${walletAddress}`);
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    const nonce = crypto.randomUUID();
    const issuedAt = new Date().toISOString();
    
    // Store nonce with wallet address binding
    nonceStore.setNonce(nonce, walletAddress);

    const message = generateAuthMessage({
      appName: AUTH_CONFIG.APP_NAME,
      walletAddress: walletAddress,
      nonce: nonce,
      issuedAt: issuedAt,
    });

    logger.info(`Nonce generated for wallet: ${walletAddress}`);
    res.json({ 
      nonce, 
      message,
      expiresIn: AUTH_CONFIG.MAX_MESSAGE_AGE_MS / 1000 // Return expiry in seconds
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

    // Validate wallet address format
    if (!ethers.isAddress(walletAddress)) {
      logger.error(`Invalid wallet address format: ${walletAddress}`);
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    // Parse the authentication message
    const parsedMessage = parseAuthMessage(message);
    if (!parsedMessage) {
      logger.warn(`Invalid message format for wallet: ${walletAddress}`);
      return res.status(400).json({ error: 'Invalid message format' });
    }

    // Validate message structure and freshness
    const messageValidation = validateAuthMessage(
      parsedMessage, 
      walletAddress, 
      parsedMessage.nonce,
      AUTH_CONFIG.MAX_MESSAGE_AGE_MS
    );

    if (!messageValidation.isValid) {
      logger.warn(`Message validation failed for wallet ${walletAddress}: ${messageValidation.error}`);
      return res.status(400).json({ error: 'Invalid authentication message' });
    }

    // Validate and consume the nonce
    const nonceValid = nonceStore.validateAndConsumeNonce(parsedMessage.nonce, walletAddress);
    if (!nonceValid) {
      logger.warn(`Nonce validation failed for wallet ${walletAddress}, nonce: ${parsedMessage.nonce}`);
      return res.status(401).json({ error: 'Invalid or expired nonce' });
    }

    // Verify the cryptographic signature
    let recoveredAddress: string;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
    } catch (sigError) {
      logger.warn(`Signature verification failed for wallet ${walletAddress}: ${sigError}`);
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      logger.warn(`Signature address mismatch - expected: ${walletAddress}, recovered: ${recoveredAddress}`);
      return res.status(401).json({ error: 'Signature verification failed' });
    }

    logger.info(`Authentication successful for wallet: ${walletAddress}`);
    
    // Here you could generate a JWT token or session
    // For now, just return success with recovered address for verification
    res.json({ 
      success: true, 
      message: 'Authentication successful',
      walletAddress: recoveredAddress,
      authenticatedAt: new Date().toISOString()
    });
  } catch (err) {
    logger.error(`Error verifying signature: ${err}`);
    res.status(500).json({ error: 'Internal server error' });
  }
}