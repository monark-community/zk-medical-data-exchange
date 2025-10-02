import jwt from 'jsonwebtoken';
import { Config } from '@/config/config';
import logger from '@/utils/logger';

export interface JWTPayload {
  walletAddress: string;
  iat?: number;
  exp?: number;
}

const JWT_EXPIRATION = '15m';

export function generateToken(walletAddress: string): string {
  try {
    const token = jwt.sign(
      { walletAddress: walletAddress.toLowerCase() },
      Config.JWT_SECRET,
      { 
        expiresIn: JWT_EXPIRATION,
        issuer: 'cura-api',
        audience: 'cura-client'
      }
    );
    
    logger.info({ walletAddress }, 'JWT token generated');
    return token;
  } catch (error) {
    logger.error({ error, walletAddress }, 'Failed to generate JWT token');
    throw new Error('Failed to generate authentication token');
  }
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, Config.JWT_SECRET, {
      issuer: 'cura-api',
      audience: 'cura-client'
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('JWT token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn({ error: error.message }, 'Invalid JWT token');
    } else {
      logger.error({ error }, 'JWT verification error');
    }
    return null;
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch (error) {
    logger.error({ error }, 'Failed to decode JWT token');
    return null;
  }
}

export function getTokenExpiration(): number {
  return 15 * 60;
}
