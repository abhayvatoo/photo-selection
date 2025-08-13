import { NextRequest, NextResponse } from 'next/server';

export interface RequestLimitsConfig {
  maxBodySize: number; // in bytes
  timeout: number; // in milliseconds
  allowedContentTypes?: string[];
  maxUrlLength?: number;
  maxHeaderSize?: number;
}

export class RequestLimits {
  private static readonly DEFAULT_CONFIG: RequestLimitsConfig = {
    maxBodySize: 10 * 1024 * 1024, // 10MB default
    timeout: 30000, // 30 seconds
    maxUrlLength: 2048, // 2KB URL limit
    maxHeaderSize: 8192, // 8KB header limit
    allowedContentTypes: [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data',
      'text/plain',
    ],
  };

  /**
   * Validate request size and content type
   */
  static async validateRequest(
    request: NextRequest,
    config: Partial<RequestLimitsConfig> = {}
  ): Promise<{
    valid: boolean;
    error?: string;
    code?: string;
  }> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

    // Check URL length
    if (finalConfig.maxUrlLength && request.url.length > finalConfig.maxUrlLength) {
      return {
        valid: false,
        error: 'Request URL too long',
        code: 'URL_TOO_LONG',
      };
    }

    // Check content length
    const contentLength = request.headers.get('content-length');
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > finalConfig.maxBodySize) {
        return {
          valid: false,
          error: `Request body too large. Maximum size: ${this.formatBytes(finalConfig.maxBodySize)}`,
          code: 'BODY_TOO_LARGE',
        };
      }
    }

    // Check content type for non-GET requests
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      const contentType = request.headers.get('content-type');
      if (contentType && finalConfig.allowedContentTypes) {
        const isAllowed = finalConfig.allowedContentTypes.some(allowed =>
          contentType.toLowerCase().includes(allowed.toLowerCase())
        );
        
        if (!isAllowed) {
          return {
            valid: false,
            error: 'Unsupported content type',
            code: 'INVALID_CONTENT_TYPE',
          };
        }
      }
    }

    // Check header size (approximate)
    const headerSize = Array.from(request.headers.entries())
      .reduce((total, [key, value]) => total + key.length + value.length + 4, 0); // +4 for ': ' and '\r\n'
    
    if (finalConfig.maxHeaderSize && headerSize > finalConfig.maxHeaderSize) {
      return {
        valid: false,
        error: 'Request headers too large',
        code: 'HEADERS_TOO_LARGE',
      };
    }

    return { valid: true };
  }

  /**
   * Format bytes to human readable string
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Middleware wrapper for request limits
   */
  static withRequestLimits(
    handler: () => Promise<NextResponse>,
    config?: Partial<RequestLimitsConfig>
  ) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const validation = await this.validateRequest(request, config);
      
      if (!validation.valid) {
        console.warn(`[REQUEST_LIMITS] Blocked request: ${validation.error}`, {
          method: request.method,
          url: request.url.substring(0, 100), // Truncate for logging
          contentLength: request.headers.get('content-length'),
          contentType: request.headers.get('content-type'),
          userAgent: request.headers.get('user-agent')?.substring(0, 100),
          timestamp: new Date().toISOString(),
        });

        const statusCode = validation.code === 'BODY_TOO_LARGE' ? 413 : 400;
        
        return NextResponse.json(
          { 
            error: validation.error,
            code: validation.code,
          }, 
          { status: statusCode }
        );
      }

      return handler();
    };
  }

  /**
   * Create timeout wrapper for requests
   */
  static withTimeout(
    handler: () => Promise<NextResponse>,
    timeoutMs: number = 30000
  ) {
    return async (): Promise<NextResponse> => {
      const timeoutPromise = new Promise<NextResponse>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Request timeout'));
        }, timeoutMs);
      });

      try {
        return await Promise.race([handler(), timeoutPromise]);
      } catch (error) {
        if (error instanceof Error && error.message === 'Request timeout') {
          console.warn(`[REQUEST_LIMITS] Request timeout after ${timeoutMs}ms`);
          return NextResponse.json(
            { 
              error: 'Request timeout',
              code: 'REQUEST_TIMEOUT',
            }, 
            { status: 408 }
          );
        }
        throw error;
      }
    };
  }
}

// Pre-configured limits for different endpoint types
export const requestLimits = {
  // General API endpoints
  general: {
    maxBodySize: 1024 * 1024, // 1MB
    timeout: 15000, // 15 seconds
  },

  // File upload endpoints
  upload: {
    maxBodySize: 50 * 1024 * 1024, // 50MB
    timeout: 120000, // 2 minutes
    allowedContentTypes: ['multipart/form-data'],
  },

  // Authentication endpoints
  auth: {
    maxBodySize: 4096, // 4KB
    timeout: 10000, // 10 seconds
    allowedContentTypes: ['application/json', 'application/x-www-form-urlencoded'],
  },

  // Stripe/payment endpoints
  payment: {
    maxBodySize: 8192, // 8KB
    timeout: 30000, // 30 seconds
    allowedContentTypes: ['application/json'],
  },

  // Webhook endpoints
  webhook: {
    maxBodySize: 1024 * 1024, // 1MB
    timeout: 30000, // 30 seconds
    allowedContentTypes: ['application/json'],
  },
};
