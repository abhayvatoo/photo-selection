import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  // Enhanced logging for production
  console.log(`[WEBHOOK] ${new Date().toISOString()} - Received webhook request`);
  
  if (!signature) {
    console.error('[WEBHOOK] Missing stripe-signature header');
    return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
  }

  if (!STRIPE_CONFIG.webhookSecret) {
    console.log('[WEBHOOK] ⚠️  Webhook signature verification skipped (development mode)');
    return NextResponse.json({ received: true }, { status: 200 });
  }

  let event: Stripe.Event;

  try {
    if (!stripe) {
      console.error('[WEBHOOK] Stripe not configured');
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_CONFIG.webhookSecret
    );
    
    console.log(`[WEBHOOK] ✅ Signature verified for event: ${event.type} (ID: ${event.id})`);
  } catch (err) {
    console.error('[WEBHOOK] ⚠️  Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    console.log(`[WEBHOOK] Processing event: ${event.type}`);
    
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`[WEBHOOK] Unhandled event type: ${event.type} - ignoring`);
    }

    const processingTime = Date.now() - startTime;
    console.log(`[WEBHOOK] ✅ Successfully processed ${event.type} in ${processingTime}ms`);
    
    return NextResponse.json({ 
      received: true, 
      eventId: event.id,
      eventType: event.type,
      processingTime 
    }, { status: 200 });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[WEBHOOK] ❌ Error processing webhook ${event.type}:`, error);
    console.error(`[WEBHOOK] Event ID: ${event.id}, Processing time: ${processingTime}ms`);
    
    // Return 200 to prevent Stripe from retrying if it's a known issue
    // Return 500 for unexpected errors to trigger Stripe retry
    const shouldRetry = !(error instanceof Error && error.message.includes('User not found'));
    const statusCode = shouldRetry ? 500 : 200;
    
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      eventId: event.id,
      eventType: event.type,
      shouldRetry 
    }, { status: statusCode });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout session completed:', session.id);

  if (!session.metadata?.userId || !session.metadata?.planType) {
    console.error('Missing metadata in checkout session');
    return;
  }

  const userId = session.metadata.userId;
  const planType = session.metadata.planType.toUpperCase() as 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

  // Get the subscription from Stripe
  if (session.subscription && typeof session.subscription === 'string') {
    if (!stripe) {
      console.error('Stripe not configured');
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    
    await prisma.subscription.upsert({
      where: { userId },
      update: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: subscription.items.data[0]?.price.id,
        planType,
        status: mapStripeStatus(subscription.status),
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        isDevelopmentMode: false,
      },
      create: {
        userId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: subscription.items.data[0]?.price.id,
        planType,
        status: mapStripeStatus(subscription.status),
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        isDevelopmentMode: false,
      }
    });

    // Update user role to BUSINESS_OWNER if they're subscribing to a paid plan
    if (planType !== 'STARTER') {
      await prisma.user.update({
        where: { id: userId },
        data: { role: 'BUSINESS_OWNER' }
      });
    }

    console.log(`Subscription created for user ${userId} with plan ${planType}`);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Processing subscription created:', subscription.id);
  
  // Find user by customer ID
  const existingSubscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: subscription.customer as string }
  });

  if (existingSubscription) {
    await updateSubscriptionFromStripe(subscription);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Processing subscription updated:', subscription.id);
  await updateSubscriptionFromStripe(subscription);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processing subscription deleted:', subscription.id);
  
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'CANCELED',
      cancelAtPeriodEnd: true,
    }
  });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Processing invoice payment succeeded:', invoice.id);
  
  if ((invoice as any).subscription) {
    if (!stripe) {
      console.error('Stripe not configured');
      return;
    }

    const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
    await updateSubscriptionFromStripe(subscription);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Processing invoice payment failed:', invoice.id);
  
  await prisma.subscription.updateMany({
    where: { stripeCustomerId: invoice.customer as string },
    data: { status: 'PAST_DUE' }
  });
}

async function updateSubscriptionFromStripe(subscription: Stripe.Subscription) {
  const planType = getPlanTypeFromPriceId(subscription.items.data[0]?.price.id);
  
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: mapStripeStatus(subscription.status),
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      planType: planType || 'STARTER',
    }
  });
}

function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'UNPAID' | 'TRIALING' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' {
  switch (stripeStatus) {
    case 'active':
      return 'ACTIVE';
    case 'canceled':
      return 'CANCELED';
    case 'past_due':
      return 'PAST_DUE';
    case 'unpaid':
      return 'UNPAID';
    case 'trialing':
      return 'TRIALING';
    case 'incomplete':
      return 'INCOMPLETE';
    case 'incomplete_expired':
      return 'INCOMPLETE_EXPIRED';
    default:
      return 'ACTIVE';
  }
}

function getPlanTypeFromPriceId(priceId?: string): 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | null {
  if (!priceId) return null;
  
  const products = STRIPE_CONFIG.products;
  
  if (priceId === products.starter.priceId) return 'STARTER';
  if (priceId === products.professional.priceId) return 'PROFESSIONAL';
  if (priceId === products.enterprise.priceId) return 'ENTERPRISE';
  
  return null;
}
