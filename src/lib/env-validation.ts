import { z } from 'zod';

// Environment validation schemas
const requiredEnvSchema = z.object({
  DATABASE_URL: z.string().url('Invalid database URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('Invalid NEXTAUTH_URL'),
});

const optionalEnvSchema = z.object({
  // Stripe configuration
  STRIPE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_STARTER_PRICE_ID: z.string().optional(),
  STRIPE_PROFESSIONAL_PRICE_ID: z.string().optional(),
  STRIPE_ENTERPRISE_PRICE_ID: z.string().optional(),

  // Email configuration
  EMAIL_SERVER: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_SERVER_HOST: z.string().optional(),
  EMAIL_SERVER_PORT: z.string().optional(),
  EMAIL_SERVER_USER: z.string().optional(),
  EMAIL_SERVER_PASSWORD: z.string().optional(),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // File storage (optional)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Security settings
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ENABLE_SECURITY_HEADERS: z.string().optional().transform(val => (val || 'true') === 'true'),
  ENABLE_RATE_LIMITING: z.string().optional().transform(val => (val || 'true') === 'true'),
  ENABLE_CSRF_PROTECTION: z.string().optional().transform(val => (val || 'true') === 'true'),
});

export interface EnvironmentConfig {
  isProduction: boolean;
  isDevelopment: boolean;
  hasStripe: boolean;
  hasEmail: boolean;
  hasGoogleAuth: boolean;
  hasFileStorage: boolean;
  securityEnabled: {
    headers: boolean;
    rateLimiting: boolean;
    csrfProtection: boolean;
  };
}

export class EnvironmentValidator {
  private static validatedEnv: z.infer<typeof requiredEnvSchema> & z.infer<typeof optionalEnvSchema> | null = null;
  private static config: EnvironmentConfig | null = null;

  /**
   * Validate environment variables on startup
   */
  static validateEnvironment(): {
    success: boolean;
    errors?: string[];
    warnings?: string[];
    config?: EnvironmentConfig;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate required environment variables
      const requiredResult = requiredEnvSchema.safeParse(process.env);
      if (!requiredResult.success) {
        errors.push(...requiredResult.error.issues.map((err: any) => 
          `${err.path.join('.')}: ${err.message}`
        ));
      }

      // Validate optional environment variables
      const optionalResult = optionalEnvSchema.safeParse(process.env);
      if (!optionalResult.success) {
        warnings.push(...optionalResult.error.issues.map((err: any) => 
          `${err.path.join('.')}: ${err.message}`
        ));
      }

      if (errors.length > 0) {
        return { success: false, errors, warnings };
      }

      // Merge validated environment variables  
      const requiredEnv = requiredResult.data!;
      const optionalEnv = optionalResult.data!;
      this.validatedEnv = { ...requiredEnv, ...optionalEnv };

      // Generate configuration
      this.config = this.generateConfig();

      // Additional validation warnings
      this.addConfigurationWarnings(warnings);

      return { 
        success: true, 
        warnings: warnings.length > 0 ? warnings : undefined,
        config: this.config,
      };

    } catch (err: any) {
      errors.push(`Environment validation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return { success: false, errors };
    }
  }

  /**
   * Generate configuration object from validated environment
   */
  private static generateConfig(): EnvironmentConfig {
    if (!this.validatedEnv) {
      throw new Error('Environment not validated');
    }

    const env = this.validatedEnv;

    return {
      isProduction: env.NODE_ENV === 'production',
      isDevelopment: env.NODE_ENV === 'development',
      hasStripe: !!(env.STRIPE_SECRET_KEY && env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
      hasEmail: !!(env.EMAIL_SERVER || (env.EMAIL_SERVER_HOST && env.EMAIL_SERVER_USER)),
      hasGoogleAuth: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      hasFileStorage: !!(
        (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_S3_BUCKET) ||
        (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET)
      ),
      securityEnabled: {
        headers: env.ENABLE_SECURITY_HEADERS,
        rateLimiting: env.ENABLE_RATE_LIMITING,
        csrfProtection: env.ENABLE_CSRF_PROTECTION,
      },
    };
  }

  /**
   * Add configuration-specific warnings
   */
  private static addConfigurationWarnings(warnings: string[]): void {
    if (!this.config || !this.validatedEnv) return;

    const env = this.validatedEnv;

    // Production-specific warnings
    if (this.config.isProduction) {
      if (!this.config.hasStripe) {
        warnings.push('Production environment without Stripe configuration - subscription features will be disabled');
      }
      
      if (!this.config.hasEmail) {
        warnings.push('Production environment without email configuration - magic links will not work');
      }

      if (env.NEXTAUTH_SECRET.length < 64) {
        warnings.push('NEXTAUTH_SECRET should be at least 64 characters in production');
      }

      if (!env.STRIPE_WEBHOOK_SECRET && this.config.hasStripe) {
        warnings.push('STRIPE_WEBHOOK_SECRET missing - webhook signature verification disabled');
      }
    }

    // Development-specific warnings
    if (this.config.isDevelopment) {
      if (this.config.hasStripe && !env.STRIPE_WEBHOOK_SECRET) {
        warnings.push('Development mode: Stripe webhook signature verification disabled');
      }
    }

    // Security warnings
    if (!this.config.securityEnabled.headers) {
      warnings.push('Security headers disabled - application may be vulnerable to XSS and other attacks');
    }

    if (!this.config.securityEnabled.rateLimiting) {
      warnings.push('Rate limiting disabled - application vulnerable to DoS attacks');
    }

    if (!this.config.securityEnabled.csrfProtection) {
      warnings.push('CSRF protection disabled - application vulnerable to CSRF attacks');
    }
  }

  /**
   * Get validated environment variables
   */
  static getEnv(): z.infer<typeof requiredEnvSchema> & z.infer<typeof optionalEnvSchema> {
    if (!this.validatedEnv) {
      throw new Error('Environment not validated. Call validateEnvironment() first.');
    }
    return this.validatedEnv;
  }

  /**
   * Get configuration
   */
  static getConfig(): EnvironmentConfig {
    if (!this.config) {
      throw new Error('Environment not validated. Call validateEnvironment() first.');
    }
    return this.config;
  }

  /**
   * Check if specific feature is enabled
   */
  static isFeatureEnabled(feature: keyof EnvironmentConfig): boolean {
    if (!this.config) return false;
    return this.config[feature] as boolean;
  }

  /**
   * Get security configuration
   */
  static getSecurityConfig(): EnvironmentConfig['securityEnabled'] {
    if (!this.config) {
      return { headers: true, rateLimiting: true, csrfProtection: true };
    }
    return this.config.securityEnabled;
  }

  /**
   * Validate specific environment variable at runtime
   */
  static validateEnvVar(key: string, schema: z.ZodSchema): {
    success: boolean;
    value?: any;
    error?: string;
  } {
    try {
      const result = schema.safeParse(process.env[key]);
      if (result.success) {
        return { success: true, value: result.data };
      } else {
        return {
          success: false,
          error: result.error.issues.map((e: any) => e.message).join(', ')
        };
      }
    } catch (err: any) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }
}

/**
 * Initialize environment validation on module load
 */
export function initializeEnvironment(): void {
  if (typeof window !== 'undefined') return; // Client-side skip

  const result = EnvironmentValidator.validateEnvironment();
  
  if (!result.success) {
    console.error('❌ Environment validation failed:');
    if (result.errors) {
      result.errors.forEach((error: any) => {
        console.error(`  - ${error}`);
      });
    }
    process.exit(1);
  }

  if (result.warnings && result.warnings.length > 0) {
    console.warn('⚠️  Environment warnings:');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  console.log('✅ Environment validation passed');
  
  if (result.config) {
    console.log('📋 Configuration:', {
      environment: result.config.isProduction ? 'production' : 'development',
      features: {
        stripe: result.config.hasStripe,
        email: result.config.hasEmail,
        googleAuth: result.config.hasGoogleAuth,
        fileStorage: result.config.hasFileStorage,
      },
      security: result.config.securityEnabled,
    });
  }
}

// Auto-initialize in server environments
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  initializeEnvironment();
}
