/**
 * Application Constants
 * Centralized location for all magic numbers and hardcoded values
 */

// File Upload Constants
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  MAX_SIZE_MB: 10,
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
  ],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'],
} as const;

// Rate Limiting Constants
export const RATE_LIMITS = {
  GENERAL: 100, // requests per hour
  AUTHENTICATION: 10, // requests per hour
  UPLOAD: 50, // requests per hour
  PAYMENT: 10, // requests per hour
  ADMIN: 3, // requests per hour
  SENSITIVE: 5, // requests per hour
  INVITATION: 10, // requests per hour
} as const;

// Pagination Constants
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1,
} as const;

// Database Constants
export const DATABASE = {
  MAX_BULK_OPERATIONS: 50, // Maximum items in bulk operations
  TRANSACTION_TIMEOUT: 30000, // 30 seconds
} as const;

// Session Constants
export const SESSION = {
  IDLE_TIMEOUT: 30 * 60 * 1000, // 30 minutes in milliseconds
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes in milliseconds
} as const;

// Validation Constants
export const VALIDATION = {
  EMAIL_MAX_LENGTH: 255,
  NAME_MAX_LENGTH: 100,
  NAME_MIN_LENGTH: 1,
  PASSWORD_MIN_LENGTH: 8,
  TOKEN_LENGTH: 64,
  WORKSPACE_NAME_MAX_LENGTH: 100,
} as const;

// UI Constants
export const UI = {
  MODAL_ANIMATION_DURATION: 200, // milliseconds
  TOAST_DURATION: 5000, // milliseconds
  DEBOUNCE_DELAY: 300, // milliseconds
  GRID_BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
  },
} as const;

// Business Logic Constants
export const BUSINESS = {
  FREE_TIER_PHOTO_LIMIT: 100,
  PROFESSIONAL_TIER_PHOTO_LIMIT: 5000,
  ENTERPRISE_TIER_PHOTO_LIMIT: 50000,
  FREE_TIER_WORKSPACE_LIMIT: 1,
  PROFESSIONAL_TIER_WORKSPACE_LIMIT: 5,
  ENTERPRISE_TIER_WORKSPACE_LIMIT: 50,
} as const;

// Security Constants
export const SECURITY = {
  CSRF_TOKEN_LENGTH: 32,
  INVITATION_TOKEN_EXPIRY_HOURS: 72,
  PASSWORD_RESET_TOKEN_EXPIRY_HOURS: 1,
  MAX_FAILED_LOGIN_ATTEMPTS: 5,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Resource not found',
  INVALID_INPUT: 'Invalid input provided',
  RATE_LIMITED: 'Too many requests, please try again later',
  FILE_TOO_LARGE: 'File too large',
  INVALID_FILE_TYPE: 'Invalid file type',
  WORKSPACE_ACCESS_DENIED: 'Workspace not found or access denied',
  CSRF_INVALID: 'Invalid CSRF token',
  SERVER_ERROR: 'Internal server error',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  PHOTO_UPLOADED: 'Photo uploaded successfully',
  PHOTO_DELETED: 'Photo deleted successfully',
  USER_CREATED: 'User created successfully',
  INVITATION_SENT: 'Invitation sent successfully',
  WORKSPACE_CREATED: 'Workspace created successfully',
} as const;
