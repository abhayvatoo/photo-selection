import { prisma } from '@/lib/db';
import { STRIPE_CONFIG } from '@/lib/stripe';

export type PlanLimits = {
  maxWorkspaces: number;
  maxPhotosPerWorkspace: number;
  maxUsersPerWorkspace: number;
  maxStorageGB: number;
  features: string[];
};

export const PLAN_LIMITS: Record<'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE', PlanLimits> = {
  STARTER: {
    maxWorkspaces: 1,
    maxPhotosPerWorkspace: 50,
    maxUsersPerWorkspace: 3,
    maxStorageGB: 1,
    features: ['Basic photo selection', 'Email notifications', 'Basic support']
  },
  PROFESSIONAL: {
    maxWorkspaces: 5,
    maxPhotosPerWorkspace: 500,
    maxUsersPerWorkspace: 15,
    maxStorageGB: 10,
    features: [
      'Advanced photo selection',
      'Custom branding',
      'Priority support',
      'Analytics dashboard',
      'Bulk operations'
    ]
  },
  ENTERPRISE: {
    maxWorkspaces: -1, // Unlimited
    maxPhotosPerWorkspace: -1, // Unlimited
    maxUsersPerWorkspace: -1, // Unlimited
    maxStorageGB: 100,
    features: [
      'Everything in Professional',
      'White-label solution',
      'API access',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee'
    ]
  }
};

export async function getUserSubscription(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      }
    }
  });

  return subscription;
}

export async function getUserPlanLimits(userId: string): Promise<PlanLimits> {
  const subscription = await getUserSubscription(userId);
  
  if (!subscription) {
    return PLAN_LIMITS.STARTER;
  }

  return PLAN_LIMITS[subscription.planType];
}

/**
 * Checks if user can create additional workspaces based on their subscription plan
 * Only counts workspaces where user has BUSINESS_OWNER or SUPER_ADMIN role
 * @param userId - The user ID to check limits for
 * @returns Object with allowed status, current count, and limit
 */
export async function checkWorkspaceLimit(userId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
  // Get user's current subscription plan limits
  const limits = await getUserPlanLimits(userId);
  
  // Count workspaces where user has ownership/admin privileges
  // This prevents counting workspaces where user is just a STAFF or USER
  const currentWorkspaces = await prisma.workspace.count({
    where: {
      users: {
        some: {
          id: userId,
          role: { in: ['BUSINESS_OWNER', 'SUPER_ADMIN'] }
        }
      }
    }
  });

  return {
    // -1 indicates unlimited (Enterprise plan)
    allowed: limits.maxWorkspaces === -1 || currentWorkspaces < limits.maxWorkspaces,
    current: currentWorkspaces,
    limit: limits.maxWorkspaces
  };
}

/**
 * Checks if workspace can accept more photos based on subscription plan limits
 * @param workspaceId - The workspace ID to check photo count for
 * @param userId - The user ID to get subscription limits from
 * @returns Object with allowed status, current count, and limit
 */
export async function checkPhotoLimit(workspaceId: string, userId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
  // Get user's subscription plan limits
  const limits = await getUserPlanLimits(userId);
  
  // Count total photos in the specific workspace
  const currentPhotos = await prisma.photo.count({
    where: { workspaceId }
  });

  return {
    // -1 indicates unlimited photos (Enterprise plan)
    allowed: limits.maxPhotosPerWorkspace === -1 || currentPhotos < limits.maxPhotosPerWorkspace,
    current: currentPhotos,
    limit: limits.maxPhotosPerWorkspace
  };
}

/**
 * Checks if workspace can accept more users based on subscription plan limits
 * @param workspaceId - The workspace ID to check user count for
 * @param userId - The user ID to get subscription limits from
 * @returns Object with allowed status, current count, and limit
 */
export async function checkUserLimit(workspaceId: string, userId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
  // Get user's subscription plan limits
  const limits = await getUserPlanLimits(userId);
  
  // Count all users currently assigned to this workspace
  const currentUsers = await prisma.user.count({
    where: { workspaceId }
  });

  return {
    // -1 indicates unlimited users (Enterprise plan)
    allowed: limits.maxUsersPerWorkspace === -1 || currentUsers < limits.maxUsersPerWorkspace,
    current: currentUsers,
    limit: limits.maxUsersPerWorkspace
  };
}

export function formatPlanName(planType: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'): string {
  switch (planType) {
    case 'STARTER':
      return 'Starter';
    case 'PROFESSIONAL':
      return 'Professional';
    case 'ENTERPRISE':
      return 'Enterprise';
    default:
      return 'Unknown';
  }
}

export function getPlanPrice(planType: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'): number {
  const planKey = planType.toLowerCase() as keyof typeof STRIPE_CONFIG.products;
  return STRIPE_CONFIG.products[planKey]?.amount || 0;
}

export function formatPrice(amount: number): string {
  return `$${(amount / 100).toFixed(2)}`;
}

export function isSubscriptionActive(subscription: any): boolean {
  if (!subscription) return false;
  
  return subscription.status === 'ACTIVE' || subscription.status === 'TRIALING';
}

export function isSubscriptionExpired(subscription: any): boolean {
  if (!subscription) return true;
  
  return new Date() > new Date(subscription.currentPeriodEnd);
}

export function getSubscriptionStatus(subscription: any): string {
  if (!subscription) return 'No subscription';
  
  if (isSubscriptionExpired(subscription)) {
    return 'Expired';
  }
  
  switch (subscription.status) {
    case 'ACTIVE':
      return 'Active';
    case 'TRIALING':
      return 'Trial';
    case 'PAST_DUE':
      return 'Past due';
    case 'CANCELED':
      return 'Canceled';
    case 'UNPAID':
      return 'Unpaid';
    case 'INCOMPLETE':
      return 'Incomplete';
    case 'INCOMPLETE_EXPIRED':
      return 'Incomplete (expired)';
    default:
      return 'Unknown';
  }
}

export async function createDevelopmentSubscription(
  userId: string,
  planType: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
) {
  if (!STRIPE_CONFIG.isDevelopment) {
    throw new Error('Development subscriptions only available in development mode');
  }

  const subscription = await prisma.subscription.upsert({
    where: { userId },
    update: {
      planType,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      isDevelopmentMode: true,
      stripeSubscriptionId: `sub_dev_${Date.now()}`,
      stripeCustomerId: `cus_dev_${userId}`,
      stripePriceId: STRIPE_CONFIG.products[planType.toLowerCase() as keyof typeof STRIPE_CONFIG.products].priceId,
    },
    create: {
      userId,
      planType,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isDevelopmentMode: true,
      stripeSubscriptionId: `sub_dev_${Date.now()}`,
      stripeCustomerId: `cus_dev_${userId}`,
      stripePriceId: STRIPE_CONFIG.products[planType.toLowerCase() as keyof typeof STRIPE_CONFIG.products].priceId,
    }
  });

  return subscription;
}
