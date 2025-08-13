import { NextRequest, NextResponse } from 'next/server';

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      message: 'Too many requests, please try again later.',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };
  }

  /**
   * Get client identifier for rate limiting
   */
  private getClientId(request: NextRequest): string {
    // Try to get user ID from session/auth header first
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      return `auth:${authHeader.slice(0, 20)}`; // Use first 20 chars of auth header
    }

    // Fall back to IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    return `ip:${ip}`;
  }

  /**
   * Check if request should be rate limited
   */
  async isRateLimited(request: NextRequest): Promise<{
    limited: boolean;
    remaining: number;
    resetTime: number;
    total: number;
  }> {
    const clientId = this.getClientId(request);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Clean up old entries
    this.cleanup(windowStart);

    // Get or create client record
    let clientRecord = rateLimitStore.get(clientId);
    
    if (!clientRecord || clientRecord.resetTime <= now) {
      // Create new window
      clientRecord = {
        count: 0,
        resetTime: now + this.config.windowMs,
      };
      rateLimitStore.set(clientId, clientRecord);
    }

    // Check if limit exceeded
    const limited = clientRecord.count >= this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - clientRecord.count);

    return {
      limited,
      remaining,
      resetTime: clientRecord.resetTime,
      total: this.config.maxRequests,
    };
  }

  /**
   * Increment request count for client
   */
  async increment(request: NextRequest): Promise<void> {
    const clientId = this.getClientId(request);
    const clientRecord = rateLimitStore.get(clientId);
    
    if (clientRecord) {
      clientRecord.count++;
      rateLimitStore.set(clientId, clientRecord);
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(windowStart: number): void {
    const keysToDelete: string[] = [];
    rateLimitStore.forEach((record, key) => {
      if (record.resetTime <= windowStart) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => rateLimitStore.delete(key));
  }

  /**
   * Middleware function for Next.js API routes
   */
  middleware() {
    return async (request: NextRequest): Promise<NextResponse | null> => {
      const result = await this.isRateLimited(request);
      
      if (result.limited) {
        return NextResponse.json(
          {
            error: this.config.message,
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': this.config.maxRequests.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetTime.toString(),
              'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
            },
          }
        );
      }

      // Increment counter for this request
      await this.increment(request);
      
      return null; // Continue to next middleware/handler
    };
  }
}

// Pre-configured rate limiters for different endpoints
export const rateLimiters = {
  // General API endpoints
  general: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests from this IP, please try again later.',
  }),

  // Authentication endpoints (stricter)
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later.',
  }),

  // File upload endpoints
  upload: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
    message: 'Upload limit exceeded, please try again later.',
  }),

  // Stripe/payment endpoints
  payment: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'Payment request limit exceeded, please try again later.',
  }),

  // Invitation endpoints
  invitation: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    message: 'Invitation limit exceeded, please try again later.',
  }),

  // Password reset/sensitive operations
  sensitive: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many sensitive operations, please try again later.',
  }),

  // CSRF token requests
  csrf: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 50,
    message: 'Too many CSRF token requests, please try again later.',
  }),
};

/**
 * Helper function to apply rate limiting to API routes
 */
export async function applyRateLimit(
  request: NextRequest,
  limiter: RateLimiter
): Promise<NextResponse | null> {
  return limiter.middleware()(request);
}
