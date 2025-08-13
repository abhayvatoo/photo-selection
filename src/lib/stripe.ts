import Stripe from 'stripe';

// Development mode check
const isDevelopment = process.env.NODE_ENV === 'development';

// Server-side Stripe instance - use dummy key in development if not provided
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || (isDevelopment ? 'sk_test_development_dummy_key' : '');

export const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-07-30.basil',
  typescript: true,
}) : null;

// Stripe configuration
export const STRIPE_CONFIG = {
  // Development mode - similar to email magic links
  isDevelopment: process.env.NODE_ENV === 'development',
  
  // Stripe publishable key for client-side
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || (isDevelopment ? 'pk_test_development_dummy_key' : ''),
  
  // Webhook secret for verifying Stripe events
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || (isDevelopment ? 'whsec_development_dummy_secret' : ''),
  
  // Product and price IDs (these would be created in Stripe Dashboard)
  products: {
    starter: {
      priceId: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter_dev',
      amount: 0, // Free plan
    },
    professional: {
      priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional_dev',
      amount: 2900, // $29.00
    },
    enterprise: {
      priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_dev',
      amount: 9900, // $99.00
    },
  },
};

// Development helper - simulate subscription creation
export const createDevelopmentSubscription = async (
  userId: string,
  planType: 'starter' | 'professional' | 'enterprise'
) => {
  if (!STRIPE_CONFIG.isDevelopment) {
    throw new Error('Development subscription creation only available in development mode');
  }

  // Simulate subscription object
  const mockSubscription = {
    id: `sub_dev_${Date.now()}`,
    customer: `cus_dev_${userId}`,
    status: 'active' as const,
    current_period_start: Math.floor(Date.now() / 1000),
    current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
    items: {
      data: [{
        price: {
          id: STRIPE_CONFIG.products[planType].priceId,
          unit_amount: STRIPE_CONFIG.products[planType].amount,
          currency: 'usd',
          recurring: {
            interval: 'month' as const,
          },
        },
      }],
    },
    metadata: {
      userId,
      planType,
      developmentMode: 'true',
    },
  };

  console.log('🔧 Development Mode: Created mock subscription:', {
    subscriptionId: mockSubscription.id,
    userId,
    planType,
    amount: STRIPE_CONFIG.products[planType].amount,
  });

  return mockSubscription;
};

// Helper to get plan type from price ID
export const getPlanTypeFromPriceId = (priceId: string): 'starter' | 'professional' | 'enterprise' | null => {
  for (const [planType, config] of Object.entries(STRIPE_CONFIG.products)) {
    if (config.priceId === priceId) {
      return planType as 'starter' | 'professional' | 'enterprise';
    }
  }
  return null;
};

// Format price for display
export const formatPrice = (amount: number): string => {
  if (amount === 0) return 'Free';
  return `$${(amount / 100).toFixed(0)}`;
};
