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
  static async createToken(sessionKey: string): Promise<string> {
    const token = this.generateToken();
    const expires = Date.now() + this.TOKEN_EXPIRY;

    csrfTokenStore.set(sessionKey, { token, expires });
    console.log('[CSRF DEBUG] Token stored:', { sessionKey, token: token.substring(0, 8) + '...', storeSize: csrfTokenStore.size });

    // Clean up expired tokens
    this.cleanupExpiredTokens();

    return token;
  }

  /**
   * Validate CSRF token
   */
  static async validateToken(
    sessionKey: string,
    providedToken: string
  ): Promise<boolean> {
    const stored = csrfTokenStore.get(sessionKey);

    if (!stored) {
      return false;
    }

    // Check if token is expired
    if (Date.now() > stored.expires) {
      csrfTokenStore.delete(sessionKey);
      return false;
    }

    try {
      // Use constant-time comparison to prevent timing attacks
      const isValid = crypto.timingSafeEqual(
        Buffer.from(stored.token, 'hex'),
        Buffer.from(providedToken, 'hex')
      );
      return isValid;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get session key for CSRF token storage
   */
  static getSessionKey(session: any): string {
    // Use email as the primary key since it's more stable than session.user.id
    // Fall back to user.id if email is not available
    return session.user?.email || session.user?.id || 'anonymous';
  }

  /**
   * Get CSRF token for current session
   */
  static async getTokenForSession(
    request: NextRequest
  ): Promise<string | null> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('[CSRF DEBUG] No session found for token request');
      return null;
    }

    const sessionKey = this.getSessionKey(session);
    console.log('[CSRF DEBUG] Getting token for session:', { 
      sessionId: session.user.id, 
      sessionKey, 
      email: session.user.email 
    });
    const stored = csrfTokenStore.get(sessionKey);

    if (stored && Date.now() < stored.expires) {
      console.log('[CSRF DEBUG] Returning existing valid token for session:', { sessionKey, token: stored.token.substring(0, 8) + '...', expires: new Date(stored.expires).toISOString() });
      return stored.token;
    }

    // Generate new token if none exists or expired
    console.log('[CSRF DEBUG] Creating new token for session (reason: ' + (stored ? 'expired' : 'not found') + '):', sessionKey);
    return await this.createToken(sessionKey);
  }

  /**
   * Debug: Show current token store state
   */
  private static debugTokenStore(): void {
    const entries = Array.from(csrfTokenStore.entries());
    console.log('[CSRF DEBUG] Current token store state:', entries.map(([key, data]) => ({
      sessionKey: key,
      token: data.token.substring(0, 8) + '...',
      expires: new Date(data.expires).toISOString(),
      expired: Date.now() > data.expires
    })));
  }

  /**
   * Clean up expired tokens
   */
  private static cleanupExpiredTokens(): void {
    const now = Date.now();
    const entries = Array.from(csrfTokenStore.entries());
    let cleanedCount = 0;
    for (const [sessionId, data] of entries) {
      if (now > data.expires) {
        console.log('[CSRF DEBUG] Cleaning up expired token for session:', sessionId);
        csrfTokenStore.delete(sessionId);
        cleanedCount++;
      }
    }
    if (cleanedCount > 0) {
      console.log('[CSRF DEBUG] Cleaned up', cleanedCount, 'expired tokens, store size now:', csrfTokenStore.size);
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

    // If header token exists, use it (especially for multipart uploads)
    // This avoids consuming the request body which can interfere with file uploads
    if (!tokenFromHeader) {
      // Only try to parse body if no header token is present
      try {
        const contentType = request.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const body = await request.clone().json();
          tokenFromBody = body.csrfToken;
        } else if (contentType?.includes('application/x-www-form-urlencoded') || contentType?.includes('multipart/form-data')) {
          const formData = await request.clone().formData();
          tokenFromBody = formData.get('csrfToken') as string;
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }

    const providedToken = tokenFromHeader || tokenFromBody;
    const sessionKey = this.getSessionKey(session);
    console.log('[CSRF DEBUG] Request validation:', { 
      sessionId: session.user.id,
      sessionKey,
      email: session.user.email,
      tokenFromHeader: tokenFromHeader?.substring(0, 8) + '...' || 'none',
      tokenFromBody: tokenFromBody?.substring(0, 8) + '...' || 'none',
      providedToken: providedToken?.substring(0, 8) + '...' || 'none'
    });

    // Debug current token store state
    this.debugTokenStore();

    if (!providedToken) {
      return { valid: false, error: 'CSRF token missing' };
    }

    const isValid = await this.validateToken(sessionKey, providedToken);

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
        code: 'CSRF_TOKEN_INVALID',
      },
      { status: 403 }
    );
  }

  return handler();
}

/**
 * API endpoint to get CSRF token
 */
export async function getCSRFToken(
  request: NextRequest
): Promise<NextResponse> {
  console.log('[CSRF DEBUG] Token endpoint called');
  try {
    const token = await CSRFProtection.getTokenForSession(request);
    console.log('[CSRF DEBUG] Token endpoint result:', { token: token?.substring(0, 8) + '...' || 'null' });

    if (!token) {
      console.log('[CSRF DEBUG] Token endpoint returning 401 - no session');
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    console.log('[CSRF DEBUG] Token endpoint returning token successfully');
    return NextResponse.json({ csrfToken: token });
  } catch (error) {
    console.error('[CSRF] Error generating token:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
