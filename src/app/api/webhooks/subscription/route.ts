import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';
import crypto from 'crypto';

// This would be your webhook secret from Stripe/payment provider
const WEBHOOK_SECRET = process.env.SUBSCRIPTION_WEBHOOK_SECRET;

function verifyWebhookSignature(body: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn('SUBSCRIPTION_WEBHOOK_SECRET not configured');
    return process.env.NODE_ENV === 'development'; // Allow in development
  }

  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body, 'utf8')
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature =
      request.headers.get('stripe-signature') ||
      request.headers.get('webhook-signature') ||
      '';

    // Verify webhook signature for security
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);

    // Handle subscription created/activated
    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'invoice.payment_succeeded'
    ) {
      const subscription = event.data.object;
      const customerEmail =
        subscription.customer_email ||
        event.data.object.customer_details?.email;

      if (!customerEmail) {
        console.error('No customer email found in webhook');
        return NextResponse.json(
          { error: 'Customer email required' },
          { status: 400 }
        );
      }

      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { email: customerEmail },
      });

      if (user) {
        // Update existing user to BUSINESS_OWNER
        if (user.role === UserRole.USER) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { role: UserRole.BUSINESS_OWNER },
          });
          console.log(`Updated user ${customerEmail} to BUSINESS_OWNER`);
        }
      } else {
        // Create new user as BUSINESS_OWNER
        user = await prisma.user.create({
          data: {
            email: customerEmail,
            role: UserRole.BUSINESS_OWNER,
            name: subscription.customer_name || null,
          },
        });
        console.log(`Created new BUSINESS_OWNER user: ${customerEmail}`);
      }

      // Create a default workspace for the business owner
      const workspace = await prisma.workspace.create({
        data: {
          name: `${user.name || user.email}'s Workspace`,
          slug: `workspace-${user.id}`,
          description: 'Default workspace for business owner',
        },
      });

      // Assign user to their workspace
      await prisma.user.update({
        where: { id: user.id },
        data: { workspaceId: workspace.id },
      });

      console.log(`Created workspace ${workspace.slug} for ${customerEmail}`);

      return NextResponse.json({
        success: true,
        message: 'Business owner created successfully',
        userId: user.id,
        workspaceId: workspace.id,
      });
    }

    // Handle subscription cancellation
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customerEmail = subscription.customer_email;

      if (customerEmail) {
        // Optionally downgrade user or suspend workspace
        await prisma.user.updateMany({
          where: { email: customerEmail },
          data: { role: UserRole.USER }, // Downgrade to regular user
        });

        // Suspend their workspaces
        const user = await prisma.user.findUnique({
          where: { email: customerEmail },
        });

        if (user?.workspaceId) {
          await prisma.workspace.update({
            where: { id: user.workspaceId },
            data: { status: 'SUSPENDED' },
          });
        }

        console.log(
          `Downgraded user ${customerEmail} due to subscription cancellation`
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription cancelled, user downgraded',
      });
    }

    // Handle other webhook events as needed
    console.log(`Unhandled webhook event: ${event.type}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
