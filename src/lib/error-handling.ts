import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// Standard error types
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  SERVER = 'SERVER_ERROR',
  DATABASE = 'DATABASE_ERROR',
  FILE_UPLOAD = 'FILE_UPLOAD_ERROR',
  EMAIL = 'EMAIL_ERROR',
}

// Custom error class
export class APIError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(
    type: ErrorType,
    message: string,
    statusCode: number = 500,
    details?: any
  ) {
    super(message);
    this.name = 'APIError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Pre-defined error creators
export const errors = {
  validation: (message: string, details?: any) => 
    new APIError(ErrorType.VALIDATION, message, 400, details),
  
  authentication: (message: string = 'Authentication required') => 
    new APIError(ErrorType.AUTHENTICATION, message, 401),
  
  authorization: (message: string = 'Insufficient permissions') => 
    new APIError(ErrorType.AUTHORIZATION, message, 403),
  
  notFound: (resource: string = 'Resource') => 
    new APIError(ErrorType.NOT_FOUND, `${resource} not found`, 404),
  
  rateLimit: (message: string = 'Rate limit exceeded') => 
    new APIError(ErrorType.RATE_LIMIT, message, 429),
  
  server: (message: string = 'Internal server error') => 
    new APIError(ErrorType.SERVER, message, 500),
  
  database: (message: string = 'Database operation failed') => 
    new APIError(ErrorType.DATABASE, message, 500),
  
  fileUpload: (message: string) => 
    new APIError(ErrorType.FILE_UPLOAD, message, 400),
  
  email: (message: string) => 
    new APIError(ErrorType.EMAIL, message, 500),
};

/**
 * Error response formatter
 */
export function formatErrorResponse(error: unknown): NextResponse {
  // Handle APIError instances
  if (error instanceof APIError) {
    return NextResponse.json(
      {
        error: {
          type: error.type,
          message: error.message,
          details: error.details,
        },
        timestamp: new Date().toISOString(),
      },
      { status: error.statusCode }
    );
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const validationErrors = error.issues.map((err: any) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return NextResponse.json(
      {
        error: {
          type: ErrorType.VALIDATION,
          message: 'Validation failed',
          details: validationErrors,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as any;
    
    switch (prismaError.code) {
      case 'P2002':
        return NextResponse.json(
          {
            error: {
              type: ErrorType.VALIDATION,
              message: 'Unique constraint violation',
              details: { field: prismaError.meta?.target },
            },
            timestamp: new Date().toISOString(),
          },
          { status: 409 }
        );
      
      case 'P2025':
        return NextResponse.json(
          {
            error: {
              type: ErrorType.NOT_FOUND,
              message: 'Record not found',
            },
            timestamp: new Date().toISOString(),
          },
          { status: 404 }
        );
      
      default:
        console.error('Prisma error:', prismaError);
        return NextResponse.json(
          {
            error: {
              type: ErrorType.DATABASE,
              message: 'Database operation failed',
            },
            timestamp: new Date().toISOString(),
          },
          { status: 500 }
        );
    }
  }

  // Handle generic errors
  console.error('Unhandled error:', error);
  
  return NextResponse.json(
    {
      error: {
        type: ErrorType.SERVER,
        message: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : 'Internal server error',
      },
      timestamp: new Date().toISOString(),
    },
    { status: 500 }
  );
}

/**
 * Async error handler wrapper for API routes
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return formatErrorResponse(error);
    }
  };
}

/**
 * Logging utilities
 */
export const logger = {
  error: (message: string, error?: any, context?: any) => {
    console.error(`[ERROR] ${message}`, {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
      context,
      timestamp: new Date().toISOString(),
    });
  },

  warn: (message: string, context?: any) => {
    console.warn(`[WARN] ${message}`, {
      context,
      timestamp: new Date().toISOString(),
    });
  },

  info: (message: string, context?: any) => {
    console.info(`[INFO] ${message}`, {
      context,
      timestamp: new Date().toISOString(),
    });
  },

  security: (message: string, context?: any) => {
    console.warn(`[SECURITY] ${message}`, {
      context,
      timestamp: new Date().toISOString(),
    });
  },
};

/**
 * Security event logging
 */
export const securityLogger = {
  rateLimitExceeded: (clientId: string, endpoint: string) => {
    logger.security('Rate limit exceeded', { clientId, endpoint });
  },

  invalidInput: (endpoint: string, errors: string[], clientId?: string) => {
    logger.security('Invalid input detected', { endpoint, errors, clientId });
  },

  unauthorizedAccess: (endpoint: string, userId?: string, clientId?: string) => {
    logger.security('Unauthorized access attempt', { endpoint, userId, clientId });
  },

  suspiciousActivity: (activity: string, context: any) => {
    logger.security('Suspicious activity detected', { activity, ...context });
  },
};
