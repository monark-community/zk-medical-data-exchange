import type { Request, Response, NextFunction } from 'express';
import logger from '@/utils/logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Simple in-memory rate limiter
 * In production, use Redis-based rate limiting
 */
class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(
    private readonly maxRequests: number = 10,
    private readonly windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if request should be rate limited
   */
  shouldLimit(key: string): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new or reset window
      this.store.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return false;
    }

    if (entry.count >= this.maxRequests) {
      return true;
    }

    entry.count++;
    return false;
  }

  /**
   * Get remaining requests for a key
   */
  getRemaining(key: string): number {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  /**
   * Get reset time for a key
   */
  getResetTime(key: string): number {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return Date.now() + this.windowMs;
    }
    return entry.resetTime;
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`Rate limiter cleaned up ${cleanedCount} expired entries`);
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Create rate limiter instances for different endpoints
const authRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 requests per 15 minutes
const generalRateLimiter = new RateLimiter(60, 15 * 60 * 1000); // 60 requests per 15 minutes

/**
 * Rate limiting middleware for authentication endpoints
 */
export function authRateLimit(req: Request, res: Response, next: NextFunction) {
  const clientId = getClientIdentifier(req);
  
  if (authRateLimiter.shouldLimit(clientId)) {
    const resetTime = authRateLimiter.getResetTime(clientId);
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
    
    logger.warn(`Rate limit exceeded for auth endpoint: ${clientId} ${req.path}`);

    res.set({
      'Retry-After': retryAfter.toString(),
      'X-RateLimit-Limit': '5',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': new Date(resetTime).toISOString(),
    });

    return res.status(429).json({
      error: 'Too many authentication attempts',
      retryAfter,
    });
  }

  const remaining = authRateLimiter.getRemaining(clientId);
  const resetTime = authRateLimiter.getResetTime(clientId);

  res.set({
    'X-RateLimit-Limit': '5',
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': new Date(resetTime).toISOString(),
  });

  next();
}

/**
 * General rate limiting middleware
 */
export function generalRateLimit(req: Request, res: Response, next: NextFunction) {
  const clientId = getClientIdentifier(req);
  
  if (generalRateLimiter.shouldLimit(clientId)) {
    const resetTime = generalRateLimiter.getResetTime(clientId);
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
    
    logger.warn(`General rate limit exceeded: ${clientId} ${req.path}`);

    res.set({
      'Retry-After': retryAfter.toString(),
      'X-RateLimit-Limit': '60',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': new Date(resetTime).toISOString(),
    });

    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter,
    });
  }

  const remaining = generalRateLimiter.getRemaining(clientId);
  const resetTime = generalRateLimiter.getResetTime(clientId);

  res.set({
    'X-RateLimit-Limit': '60',
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': new Date(resetTime).toISOString(),
  });

  next();
}

/**
 * Get client identifier for rate limiting
 * Uses IP address with optional user-agent hash for better identification
 */
function getClientIdentifier(req: Request): string {
  const forwarded = req.get('X-Forwarded-For');
  const ip = forwarded ? forwarded.split(',')[0]?.trim() || 'unknown' : req.socket.remoteAddress || 'unknown';
  
  // In production, you might want to include other factors like user agent
  return ip;
}

/**
 * Security headers middleware
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'",
  });
  next();
}

// Cleanup on process exit
process.on('SIGINT', () => {
  authRateLimiter.destroy();
  generalRateLimiter.destroy();
});

process.on('SIGTERM', () => {
  authRateLimiter.destroy();
  generalRateLimiter.destroy();
});