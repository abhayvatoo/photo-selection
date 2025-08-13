import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import crypto from 'crypto';

// CSRF token store (use Redis in production)
const csrfTokenStore = new Map<string, { token: string; expires: number }>();

export class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

  /**
   * Generate a secure CSRF token
   */
  static generateToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  /**
   * Create CSRF token for session
   */
  static async createToken(sessionId: string): Promise<string> {
    const token = this.generateToken();
    const expires = Date.now() + this.TOKEN_EXPIRY;
    
    csrfTokenStore.set(sessionId, { token, expires });
    
    // Clean up expired tokens
    this.cleanupExpiredTokens();
    
    return token;
  }

  /**
   * Validate CSRF token
   */
  static async validateToken(sessionId: string, providedToken: string): Promise<boolean> {
    const stored = csrfTokenStore.get(sessionId);
    
    if (!stored) {
      return false;
    }

    // Check if token is expired
    if (Date.now() > stored.expires) {
      csrfTokenStore.delete(sessionId);
      return false;
    }

    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(stored.token, 'hex'),
      Buffer.from(providedToken, 'hex')
    );
  }

  /**
   * Get CSRF token for current session
   */
  static async getTokenForSession(request: NextRequest): Promise<string | null> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return null;
    }

    const sessionId = session.user.id;
    const stored = csrfTokenStore.get(sessionId);
    
    if (stored && Date.now() < stored.expires) {
      return stored.token;
    }

    // Generate new token if none exists or expired
    return await this.createToken(sessionId);
  }

  /**
   * Clean up expired tokens
   */
  private static cleanupExpiredTokens(): void {
    const now = Date.now();
    const entries = Array.from(csrfTokenStore.entries());
    for (const [sessionId, data] of entries) {
      if (now > data.expires) {
        csrfTokenStore.delete(sessionId);
      }
    }
  }

  /**
   * Middleware to validate CSRF token
   */
  static async validateRequest(request: NextRequest): Promise<{
    valid: boolean;
    error?: string;
  }> {
    // Skip CSRF validation for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return { valid: true };
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { valid: false, error: 'No session found' };
    }

    // Get CSRF token from header or body
    const tokenFromHeader = request.headers.get('x-csrf-token');
    let tokenFromBody: string | null = null;

    try {
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const body = await request.clone().json();
        tokenFromBody = body.csrfToken;
      } else if (contentType?.includes('application/x-www-form-urlencoded')) {
        const formData = await request.clone().formData();
        tokenFromBody = formData.get('csrfToken') as string;
      }
    } catch (error) {
      // Ignore parsing errors
    }

    const providedToken = tokenFromHeader || tokenFromBody;
    
    if (!providedToken) {
      return { valid: false, error: 'CSRF token missing' };
    }

    const isValid = await this.validateToken(session.user.id, providedToken);
    
    if (!isValid) {
      return { valid: false, error: 'Invalid CSRF token' };
    }

    return { valid: true };
  }
}

/**
 * CSRF protection middleware for API routes
 */
export async function withCSRFProtection(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const validation = await CSRFProtection.validateRequest(request);
  
  if (!validation.valid) {
    console.warn(`[CSRF] Blocked request: ${validation.error}`, {
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { 
        error: 'CSRF validation failed',
        code: 'CSRF_TOKEN_INVALID'
      }, 
      { status: 403 }
    );
  }

  return handler();
}

/**
 * API endpoint to get CSRF token
 */
export async function getCSRFToken(request: NextRequest): Promise<NextResponse> {
  try {
    const token = await CSRFProtection.getTokenForSession(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'No session found' }, 
        { status: 401 }
      );
    }

    return NextResponse.json({ csrfToken: token });
  } catch (error) {
    console.error('[CSRF] Error generating token:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' }, 
      { status: 500 }
    );
  }
}
