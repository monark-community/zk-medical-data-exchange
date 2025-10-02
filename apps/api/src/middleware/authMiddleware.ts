import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/utils/jwt';
import logger from '@/utils/logger';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      logger.warn('No authorization header provided');
      return res.status(401).json({ error: 'Authentication required' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      logger.warn('Invalid authorization header format');
      return res.status(401).json({ error: 'Invalid authentication format' });
    }

    const token = parts[1];

    if (!token) {
      logger.warn('No token provided');
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = verifyToken(token);
    if (!payload) {
      logger.warn('Invalid or expired token');
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    (req as any).user = {
      walletAddress: payload.walletAddress
    };

    logger.debug({ walletAddress: payload.walletAddress }, 'Request authenticated');
    next();
  } catch (error) {
    logger.error({ error }, 'Authentication middleware error');
    res.status(500).json({ error: 'Internal server error' });
  }
}
