import { NextRequest, NextResponse } from 'next/server';

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: {
    directives: Record<string, string[]>;
    reportOnly?: boolean;
  };
  strictTransportSecurity?: {
    maxAge: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
  frameOptions?: 'DENY' | 'SAMEORIGIN' | string;
  contentTypeOptions?: boolean;
  referrerPolicy?: string;
  permissionsPolicy?: Record<string, string[]>;
}

export class SecurityHeaders {
  private static readonly DEFAULT_CONFIG: SecurityHeadersConfig = {
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'script-src': [
          "'self'",
          "'unsafe-inline'", // Required for Next.js
          "'unsafe-eval'", // Required for development
          'https://js.stripe.com',
          'https://checkout.stripe.com',
        ],
        'style-src': [
          "'self'",
          "'unsafe-inline'", // Required for Tailwind CSS
          'https://fonts.googleapis.com',
        ],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'img-src': [
          "'self'",
          'data:',
          'https:',
          'blob:', // For uploaded images
        ],
        'connect-src': [
          "'self'",
          'https://api.stripe.com',
          'https://checkout.stripe.com',
        ],
        'frame-src': ['https://js.stripe.com', 'https://checkout.stripe.com'],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        ...(process.env.NODE_ENV === 'production' && {
          'upgrade-insecure-requests': [],
        }),
      },
      reportOnly: process.env.NODE_ENV === 'development',
    },
    strictTransportSecurity: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    frameOptions: 'DENY',
    contentTypeOptions: true,
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
      payment: ['self'],
    },
  };

  /**
   * Generate Content Security Policy header value
   */
  private static generateCSP(
    config: SecurityHeadersConfig['contentSecurityPolicy']
  ): string {
    if (!config?.directives) return '';

    const directives = Object.entries(config.directives)
      .map(([directive, sources]) => {
        if (sources.length === 0) {
          return directive;
        }
        return `${directive} ${sources.join(' ')}`;
      })
      .join('; ');

    return directives;
  }

  /**
   * Generate Strict Transport Security header value
   */
  private static generateHSTS(
    config: SecurityHeadersConfig['strictTransportSecurity']
  ): string {
    if (!config) return '';

    let value = `max-age=${config.maxAge}`;

    if (config.includeSubDomains) {
      value += '; includeSubDomains';
    }

    if (config.preload) {
      value += '; preload';
    }

    return value;
  }

  /**
   * Generate Permissions Policy header value
   */
  private static generatePermissionsPolicy(
    config: SecurityHeadersConfig['permissionsPolicy']
  ): string {
    if (!config) return '';

    return Object.entries(config)
      .map(([directive, allowlist]) => {
        if (allowlist.length === 0) {
          return `${directive}=()`;
        }
        const origins = allowlist
          .map((origin) => (origin === 'self' ? '"self"' : origin))
          .join(' ');
        return `${directive}=(${origins})`;
      })
      .join(', ');
  }

  /**
   * Apply security headers to response
   */
  static applyHeaders(
    response: NextResponse,
    config: SecurityHeadersConfig = this.DEFAULT_CONFIG
  ): NextResponse {
    // Content Security Policy
    if (config.contentSecurityPolicy) {
      const csp = this.generateCSP(config.contentSecurityPolicy);
      if (csp) {
        const headerName = config.contentSecurityPolicy.reportOnly
          ? 'Content-Security-Policy-Report-Only'
          : 'Content-Security-Policy';
        response.headers.set(headerName, csp);
      }
    }

    // Strict Transport Security (HTTPS only)
    if (
      config.strictTransportSecurity &&
      process.env.NODE_ENV === 'production'
    ) {
      const hsts = this.generateHSTS(config.strictTransportSecurity);
      if (hsts) {
        response.headers.set('Strict-Transport-Security', hsts);
      }
    }

    // X-Frame-Options
    if (config.frameOptions) {
      response.headers.set('X-Frame-Options', config.frameOptions);
    }

    // X-Content-Type-Options
    if (config.contentTypeOptions) {
      response.headers.set('X-Content-Type-Options', 'nosniff');
    }

    // Referrer Policy
    if (config.referrerPolicy) {
      response.headers.set('Referrer-Policy', config.referrerPolicy);
    }

    // Permissions Policy
    if (config.permissionsPolicy) {
      const permissionsPolicy = this.generatePermissionsPolicy(
        config.permissionsPolicy
      );
      if (permissionsPolicy) {
        response.headers.set('Permissions-Policy', permissionsPolicy);
      }
    }

    // Additional security headers
    response.headers.set('X-DNS-Prefetch-Control', 'off');
    response.headers.set('X-Download-Options', 'noopen');
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

    return response;
  }

  /**
   * Middleware wrapper for applying security headers
   */
  static withSecurityHeaders(
    handler: () => Promise<NextResponse>,
    config?: SecurityHeadersConfig
  ) {
    return async (): Promise<NextResponse> => {
      const response = await handler();
      return this.applyHeaders(response, config);
    };
  }

  /**
   * Get production-ready CSP configuration
   */
  static getProductionCSP(): SecurityHeadersConfig['contentSecurityPolicy'] {
    return {
      directives: {
        'default-src': ["'self'"],
        'script-src': [
          "'self'",
          'https://js.stripe.com',
          'https://checkout.stripe.com',
        ],
        'style-src': [
          "'self'",
          "'unsafe-inline'", // Required for Tailwind CSS
          'https://fonts.googleapis.com',
        ],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'img-src': [
          "'self'",
          'data:',
          'https:', // Allow HTTPS images
          'blob:',
        ],
        'connect-src': [
          "'self'",
          'https://api.stripe.com',
          'https://checkout.stripe.com',
        ],
        'frame-src': ['https://js.stripe.com', 'https://checkout.stripe.com'],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'upgrade-insecure-requests': [],
      },
      reportOnly: false,
    };
  }
}

/**
 * Security headers middleware for Next.js middleware
 */
export function securityHeadersMiddleware(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  return SecurityHeaders.applyHeaders(response);
}
