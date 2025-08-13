import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { withCSRFProtection } from '@/lib/csrf';
import { rateLimiters, applyRateLimit } from '@/lib/rate-limit';
import { validateInput } from '@/lib/validation';
import { z } from 'zod';

const createCheckoutSchema = z.object({
  planType: z.enum(['starter', 'professional', 'enterprise']),
  csrfToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimit(request, rateLimiters.payment);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Apply CSRF protection
  return withCSRFProtection(request, async () => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const validation = validateInput(createCheckoutSchema, body);
      
      if (!validation.success) {
        return NextResponse.json({ 
          error: 'Invalid input', 
          details: validation.errors 
        }, { status: 400 });
      }

      const { planType } = validation.data;

    // Get user with current subscription
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Handle free starter plan
    if (planType === 'starter') {
      // Create or update subscription to starter plan
      await prisma.subscription.upsert({
        where: { userId: user.id },
        update: {
          planType: 'STARTER',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          isDevelopmentMode: STRIPE_CONFIG.isDevelopment,
          stripeSubscriptionId: null,
          stripeCustomerId: null,
          stripePriceId: null,
        },
        create: {
          userId: user.id,
          planType: 'STARTER',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          isDevelopmentMode: STRIPE_CONFIG.isDevelopment,
        }
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Starter plan activated',
        redirectUrl: '/dashboard'
      });
    }

    // Handle development mode for paid plans
    if (STRIPE_CONFIG.isDevelopment) {
      // Create mock subscription for development
      await prisma.subscription.upsert({
        where: { userId: user.id },
        update: {
          planType: planType.toUpperCase() as 'PROFESSIONAL' | 'ENTERPRISE',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          isDevelopmentMode: true,
          stripeSubscriptionId: `sub_dev_${Date.now()}`,
          stripeCustomerId: `cus_dev_${user.id}`,
          stripePriceId: STRIPE_CONFIG.products[planType as keyof typeof STRIPE_CONFIG.products].priceId,
        },
        create: {
          userId: user.id,
          planType: planType.toUpperCase() as 'PROFESSIONAL' | 'ENTERPRISE',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isDevelopmentMode: true,
          stripeSubscriptionId: `sub_dev_${Date.now()}`,
          stripeCustomerId: `cus_dev_${user.id}`,
          stripePriceId: STRIPE_CONFIG.products[planType as keyof typeof STRIPE_CONFIG.products].priceId,
        }
      });

      return NextResponse.json({ 
        success: true, 
        message: `${planType} plan activated (development mode)`,
        redirectUrl: '/dashboard'
      });
    }

    // Production Stripe checkout session
    const priceId = STRIPE_CONFIG.products[planType as keyof typeof STRIPE_CONFIG.products].priceId;
    
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${request.nextUrl.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/pricing`,
      metadata: {
        userId: user.id,
        planType: planType,
      },
    });

    return NextResponse.json({ 
      success: true,
      checkoutUrl: checkoutSession.url 
    });

    } catch (error) {
      console.error('Checkout session creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }
  });
}
