import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with subscription
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    // Handle development mode
    if (STRIPE_CONFIG.isDevelopment || user.subscription.isDevelopmentMode) {
      return NextResponse.json({ 
        success: true,
        message: 'Development mode - no customer portal available',
        redirectUrl: '/dashboard/billing'
      });
    }

    // Ensure we have a Stripe customer ID
    if (!user.subscription.stripeCustomerId) {
      return NextResponse.json({ 
        error: 'No Stripe customer ID found' 
      }, { status: 400 });
    }

    // Create customer portal session
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.subscription.stripeCustomerId,
      return_url: `${request.nextUrl.origin}/dashboard/billing`,
    });

    return NextResponse.json({ 
      success: true,
      portalUrl: portalSession.url 
    });

  } catch (error) {
    console.error('Customer portal session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create customer portal session' },
      { status: 500 }
    );
  }
}
