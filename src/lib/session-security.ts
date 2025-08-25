import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export interface SessionSecurityConfig {
  maxAge: number; // Session max age in seconds
  idleTimeout: number; // Idle timeout in seconds
  rotateOnPrivilegeChange: boolean;
  requireReauthForSensitive: boolean;
  trackLoginAttempts: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number; // in seconds
}

export class SessionSecurity {
  private static readonly DEFAULT_CONFIG: SessionSecurityConfig = {
    maxAge: 24 * 60 * 60, // 24 hours
    idleTimeout: 2 * 60 * 60, // 2 hours
    rotateOnPrivilegeChange: true,
    requireReauthForSensitive: true,
    trackLoginAttempts: true,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60, // 15 minutes
  };

  // In-memory stores (use Redis in production)
  private static sessionActivity = new Map<string, number>();
  private static loginAttempts = new Map<
    string,
    { count: number; lastAttempt: number; lockedUntil?: number }
  >();

  /**
   * Validate session security
   */
  static async validateSession(
    request: NextRequest,
    config: Partial<SessionSecurityConfig> = {}
  ): Promise<{
    valid: boolean;
    error?: string;
    requiresReauth?: boolean;
  }> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

    try {
      const session = await getServerSession(authOptions);

      if (!session?.user?.id) {
        return { valid: false, error: 'No session found' };
      }

      const userId = session.user.id;
      const now = Date.now();

      // Check if account is locked due to failed login attempts
      if (finalConfig.trackLoginAttempts) {
        const attempts = this.loginAttempts.get(userId);
        if (attempts?.lockedUntil && now < attempts.lockedUntil) {
          const remainingTime = Math.ceil(
            (attempts.lockedUntil - now) / 1000 / 60
          );
          return {
            valid: false,
            error: `Account locked. Try again in ${remainingTime} minutes.`,
          };
        }
      }

      // Check session idle timeout
      const lastActivity = this.sessionActivity.get(userId) || now;
      const idleTime = (now - lastActivity) / 1000;

      if (idleTime > finalConfig.idleTimeout) {
        this.sessionActivity.delete(userId);
        return {
          valid: false,
          error: 'Session expired due to inactivity',
          requiresReauth: true,
        };
      }

      // Update last activity
      this.sessionActivity.set(userId, now);

      // Check for sensitive operations that require recent authentication
      if (finalConfig.requireReauthForSensitive) {
        const sensitiveEndpoints = [
          '/api/user/delete',
          '/api/admin/',
          '/api/stripe/create-checkout-session',
          '/api/invitations/create',
        ];

        const isSensitiveOperation = sensitiveEndpoints.some((endpoint) =>
          request.url.includes(endpoint)
        );

        if (isSensitiveOperation) {
          // Check if user authenticated recently (within 10 minutes for sensitive ops)
          const recentAuthWindow = 10 * 60 * 1000; // 10 minutes
          if (idleTime > recentAuthWindow / 1000) {
            return {
              valid: false,
              error: 'Recent authentication required for this operation',
              requiresReauth: true,
            };
          }
        }
      }

      return { valid: true };
    } catch (error) {
      console.error('[SESSION_SECURITY] Session validation error:', error);
      return { valid: false, error: 'Session validation failed' };
    }
  }

  /**
   * Record login attempt
   */
  static recordLoginAttempt(identifier: string, success: boolean): void {
    const now = Date.now();
    const attempts = this.loginAttempts.get(identifier) || {
      count: 0,
      lastAttempt: 0,
    };

    if (success) {
      // Clear attempts on successful login
      this.loginAttempts.delete(identifier);
      return;
    }

    // Increment failed attempts
    attempts.count += 1;
    attempts.lastAttempt = now;

    // Lock account if max attempts exceeded
    if (attempts.count >= this.DEFAULT_CONFIG.maxLoginAttempts) {
      attempts.lockedUntil = now + this.DEFAULT_CONFIG.lockoutDuration * 1000;
      console.warn(
        `[SESSION_SECURITY] Account locked due to failed login attempts: ${identifier}`
      );
    }

    this.loginAttempts.set(identifier, attempts);

    // Clean up old attempts (older than 1 hour)
    this.cleanupOldAttempts();
  }

  /**
   * Generate secure session token
   */
  static generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Rotate session on privilege change
   */
  static async rotateSessionOnPrivilegeChange(
    userId: string,
    newRole: string
  ): Promise<void> {
    try {
      // Update user's role in database
      await prisma.user.update({
        where: { id: userId },
        data: { role: newRole as any },
      });

      // Clear session activity to force re-authentication
      this.sessionActivity.delete(userId);

      console.info(
        `[SESSION_SECURITY] Session rotated for user ${userId} due to role change to ${newRole}`
      );
    } catch (error) {
      console.error('[SESSION_SECURITY] Failed to rotate session:', error);
    }
  }

  /**
   * Clean up expired session data
   */
  static cleanupExpiredSessions(): void {
    const now = Date.now();
    const maxAge = this.DEFAULT_CONFIG.maxAge * 1000;

    // Clean up old session activity
    const sessionEntries = Array.from(this.sessionActivity.entries());
    for (const [userId, lastActivity] of sessionEntries) {
      if (now - lastActivity > maxAge) {
        this.sessionActivity.delete(userId);
      }
    }

    this.cleanupOldAttempts();
  }

  /**
   * Clean up old login attempts
   */
  private static cleanupOldAttempts(): void {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    const attemptEntries = Array.from(this.loginAttempts.entries());
    for (const [identifier, attempts] of attemptEntries) {
      // Remove if older than max age and not currently locked
      if (
        now - attempts.lastAttempt > maxAge &&
        (!attempts.lockedUntil || now > attempts.lockedUntil)
      ) {
        this.loginAttempts.delete(identifier);
      }
    }
  }

  /**
   * Get session statistics
   */
  static getSessionStats(): {
    activeSessions: number;
    lockedAccounts: number;
    recentFailedAttempts: number;
  } {
    const now = Date.now();
    let lockedAccounts = 0;
    let recentFailedAttempts = 0;

    const loginAttemptEntries = Array.from(this.loginAttempts.entries());
    for (const [identifier, attempts] of loginAttemptEntries) {
      if (attempts.lockedUntil && now < attempts.lockedUntil) {
        lockedAccounts++;
      }
      if (now - attempts.lastAttempt < 60 * 60 * 1000) {
        // Within last hour
        recentFailedAttempts += attempts.count;
      }
    }

    return {
      activeSessions: this.sessionActivity.size,
      lockedAccounts,
      recentFailedAttempts,
    };
  }

  /**
   * Middleware wrapper for session security
   */
  static withSessionSecurity(
    handler: () => Promise<NextResponse>,
    config?: Partial<SessionSecurityConfig>
  ) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const validation = await this.validateSession(request, config);

      if (!validation.valid) {
        console.warn(
          `[SESSION_SECURITY] Blocked request: ${validation.error}`,
          {
            method: request.method,
            url: request.url.substring(0, 100),
            userAgent: request.headers.get('user-agent')?.substring(0, 100),
            timestamp: new Date().toISOString(),
          }
        );

        const statusCode = validation.requiresReauth ? 401 : 403;

        return NextResponse.json(
          {
            error: validation.error,
            requiresReauth: validation.requiresReauth,
            code: validation.requiresReauth
              ? 'REAUTH_REQUIRED'
              : 'SESSION_INVALID',
          },
          { status: statusCode }
        );
      }

      return handler();
    };
  }
}

// Start cleanup interval (run every 5 minutes)
if (typeof window === 'undefined') {
  // Server-side only
  setInterval(
    () => {
      SessionSecurity.cleanupExpiredSessions();
    },
    5 * 60 * 1000
  );
}
