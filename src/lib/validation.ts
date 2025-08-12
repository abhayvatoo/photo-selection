import { z } from 'zod';
import { UserRole } from '@prisma/client';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address').max(255);
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const nameSchema = z.string().min(1, 'Name is required').max(100);
export const uuidSchema = z.string().uuid('Invalid UUID format');
export const positiveIntSchema = z.number().int().positive('Must be a positive integer');

// User validation schemas
export const userRoleSchema = z.nativeEnum(UserRole);

export const createUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  role: userRoleSchema.optional(),
});

export const updateUserSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  role: userRoleSchema.optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

// Workspace validation schemas
export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100),
  description: z.string().max(500).optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

// Photo validation schemas
export const photoSelectionSchema = z.object({
  photoId: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ).refine(val => !isNaN(val) && val > 0, {
    message: 'Photo ID must be a positive integer'
  }),
});

export const bulkPhotoSchema = z.object({
  photoIds: z.array(
    z.union([z.string(), z.number()]).transform(val => 
      typeof val === 'string' ? parseInt(val, 10) : val
    )
  ).min(1, 'At least one photo ID is required')
    .max(100, 'Cannot process more than 100 photos at once')
    .refine(ids => ids.every(id => !isNaN(id) && id > 0), {
      message: 'All photo IDs must be positive integers'
    }),
});

// Invitation validation schemas
export const createInvitationSchema = z.object({
  email: emailSchema,
  role: userRoleSchema.refine(role => role === 'USER' || role === 'STAFF', {
    message: 'Can only invite USER or STAFF roles'
  }),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
  name: nameSchema.optional(),
});

// Email validation schemas
export const sendTestEmailSchema = z.object({
  email: emailSchema,
});

// File upload validation
export const fileUploadSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  files: z.array(z.object({
    name: z.string().min(1, 'File name is required'),
    size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
    type: z.string().refine(type => 
      type.startsWith('image/'), 'Only image files are allowed'
    ),
  })).min(1, 'At least one file is required')
    .max(20, 'Cannot upload more than 20 files at once'),
});

// Pagination validation
export const paginationSchema = z.object({
  page: z.string().optional().transform(val => 
    val ? parseInt(val, 10) : 1
  ).refine(val => !isNaN(val) && val > 0, {
    message: 'Page must be a positive integer'
  }),
  limit: z.string().optional().transform(val => 
    val ? parseInt(val, 10) : 20
  ).refine(val => !isNaN(val) && val > 0 && val <= 100, {
    message: 'Limit must be between 1 and 100'
  }),
});

// Search validation
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100),
  filters: z.object({
    role: userRoleSchema.optional(),
    workspaceId: z.string().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }).optional(),
});

/**
 * Validation helper function
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err: any) => 
        `${err.path.join('.')}: ${err.message}`
      );
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

/**
 * Sanitization helpers
 */
export const sanitizers = {
  // Remove HTML tags and dangerous characters
  sanitizeText: (text: string): string => {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>'"&]/g, '') // Remove dangerous characters
      .trim()
      .slice(0, 1000); // Limit length
  },

  // Sanitize email (lowercase, trim)
  sanitizeEmail: (email: string): string => {
    return email.toLowerCase().trim();
  },

  // Sanitize filename
  sanitizeFilename: (filename: string): string => {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .slice(0, 255); // Limit length
  },

  // Sanitize workspace name
  sanitizeWorkspaceName: (name: string): string => {
    return name
      .replace(/[<>'"&]/g, '') // Remove dangerous characters
      .trim()
      .slice(0, 100);
  },
};

/**
 * Security validation helpers
 */
export const security = {
  // Check if string contains potential XSS
  containsXSS: (input: string): boolean => {
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
    ];
    return xssPatterns.some(pattern => pattern.test(input));
  },

  // Check if string contains SQL injection patterns
  containsSQLInjection: (input: string): boolean => {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC)\b)/i,
      /(UNION|OR|AND)\s+\d+\s*=\s*\d+/i,
      /['"]\s*(OR|AND)\s*['"]/i,
      /--/,
      /\/\*/,
    ];
    return sqlPatterns.some(pattern => pattern.test(input));
  },

  // Validate file type is safe
  isSafeFileType: (mimeType: string): boolean => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff',
    ];
    return allowedTypes.includes(mimeType.toLowerCase());
  },

  // Check if file size is within limits
  isValidFileSize: (size: number, maxSize: number = 10 * 1024 * 1024): boolean => {
    return size > 0 && size <= maxSize;
  },
};
