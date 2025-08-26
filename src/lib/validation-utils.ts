/**
 * Common Validation Utilities
 * Reusable validation functions to eliminate code duplication
 */

import { z } from 'zod';
import { NextResponse } from 'next/server';
import { VALIDATION, ERROR_MESSAGES, FILE_UPLOAD } from './constants';

// Common validation schemas
export const commonSchemas = {
  email: z
    .string()
    .email('Invalid email format')
    .max(VALIDATION.EMAIL_MAX_LENGTH),
  name: z
    .string()
    .min(VALIDATION.NAME_MIN_LENGTH)
    .max(VALIDATION.NAME_MAX_LENGTH),
  uuid: z.string().uuid('Invalid UUID format'),
  positiveInteger: z.number().int().positive(),
  nonEmptyString: z.string().min(1, 'Field cannot be empty'),

  // Pagination schema
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
  }),

  // File validation schema
  fileUpload: z.object({
    workspaceId: z
      .string()
      .regex(
        /^c[a-z0-9]{24}$/,
        'Invalid workspace ID format - must be a valid CUID'
      ),
  }),

  // User role schema
  userRole: z.enum([
    'SUPER_ADMIN',
    'BUSINESS_OWNER',
    'ADMIN',
    'PHOTOGRAPHER',
    'CLIENT',
  ]),
};

// File validation utilities
export const fileValidation = {
  /**
   * Validates file type against allowed MIME types
   */
  isValidFileType: (mimeType: string): boolean => {
    return FILE_UPLOAD.ALLOWED_MIME_TYPES.includes(mimeType as any);
  },

  /**
   * Validates file size
   */
  isValidFileSize: (size: number): boolean => {
    return size <= FILE_UPLOAD.MAX_SIZE;
  },

  /**
   * Validates filename for security (no path traversal)
   */
  isValidFilename: (filename: string): boolean => {
    return (
      !filename.includes('..') &&
      !filename.includes('/') &&
      !filename.includes('\\') &&
      filename.length > 0 &&
      filename.length <= 255
    );
  },

  /**
   * Gets file extension from filename
   */
  getFileExtension: (filename: string): string => {
    return filename.toLowerCase().substring(filename.lastIndexOf('.'));
  },

  /**
   * Validates file extension
   */
  isValidFileExtension: (filename: string): boolean => {
    const extension = fileValidation.getFileExtension(filename);
    return FILE_UPLOAD.ALLOWED_EXTENSIONS.includes(extension as any);
  },
};

// Input sanitization utilities
export const sanitization = {
  /**
   * Sanitizes string input by trimming and limiting length
   */
  sanitizeString: (input: string, maxLength: number = 255): string => {
    return input.trim().substring(0, maxLength);
  },

  /**
   * Sanitizes email input
   */
  sanitizeEmail: (email: string): string => {
    return email.trim().toLowerCase().substring(0, VALIDATION.EMAIL_MAX_LENGTH);
  },

  /**
   * Sanitizes filename for safe storage
   */
  sanitizeFilename: (filename: string): string => {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
      .substring(0, 255); // Limit length
  },
};

// Common validation response helpers
export const validationResponses = {
  /**
   * Returns standardized validation error response
   */
  validationError: (
    message: string = ERROR_MESSAGES.INVALID_INPUT,
    details?: any
  ) => {
    return NextResponse.json(
      { error: message, ...(details && { details }) },
      { status: 400 }
    );
  },

  /**
   * Returns standardized unauthorized response
   */
  unauthorized: (message: string = ERROR_MESSAGES.UNAUTHORIZED) => {
    return NextResponse.json({ error: message }, { status: 401 });
  },

  /**
   * Returns standardized forbidden response
   */
  forbidden: (message: string = ERROR_MESSAGES.FORBIDDEN) => {
    return NextResponse.json({ error: message }, { status: 403 });
  },

  /**
   * Returns standardized not found response
   */
  notFound: (message: string = ERROR_MESSAGES.NOT_FOUND) => {
    return NextResponse.json({ error: message }, { status: 404 });
  },

  /**
   * Returns standardized rate limit response
   */
  rateLimited: (message: string = ERROR_MESSAGES.RATE_LIMITED) => {
    return NextResponse.json({ error: message }, { status: 429 });
  },

  /**
   * Returns standardized server error response
   */
  serverError: (message: string = ERROR_MESSAGES.SERVER_ERROR) => {
    return NextResponse.json({ error: message }, { status: 500 });
  },
};

// Validation result type
export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors?: string[];
};

/**
 * Generic validation function with standardized error handling
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map(
          (err: any) => `${err.path.join('.')}: ${err.message}`
        ),
      };
    }
    return {
      success: false,
      errors: ['Validation failed'],
    };
  }
}

/**
 * Validates pagination parameters
 */
export function validatePagination(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  return validateWithSchema(commonSchemas.pagination, { page, limit });
}

/**
 * Validates UUID parameter
 */
export function validateUUID(
  value: string,
  fieldName: string = 'ID'
): ValidationResult<string> {
  return validateWithSchema(
    z.string().uuid(`Invalid ${fieldName} format`),
    value
  );
}
