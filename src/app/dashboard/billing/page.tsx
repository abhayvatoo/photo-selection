'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Calendar,
  AlertCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import {
  formatPlanName,
  formatPrice,
  getSubscriptionStatus,
  isSubscriptionActive,
} from '@/lib/subscription';
import { useToast } from '@/hooks/useToast';

interface Subscription {
  id: string;
  planType: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  isDevelopmentMode: boolean;
  stripeCustomerId?: string;
}

export default function BillingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (session?.user?.id) {
      fetchSubscription();
    }
  }, [session]);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/user/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        if (data.portalUrl) {
          window.open(data.portalUrl, '_blank');
        } else {
          // Development mode
          showToast(data.message, 'success');
        }
      } else {
        throw new Error(data.error || 'Failed to create portal session');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      showToast('Failed to open billing portal. Please try again.', 'error');
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPlanPrice = (planType: string) => {
    switch (planType) {
      case 'PROFESSIONAL':
        return 2900;
      case 'ENTERPRISE':
        return 9900;
      default:
        return 0;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Billing & Subscription
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your subscription and billing information
        </p>
      </div>

      {subscription ? (
        <div className="space-y-6">
          {/* Current Plan */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Current Plan
              </h2>
              {subscription.isDevelopmentMode && (
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  Development Mode
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center mb-2">
                  <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-500">
                    Plan
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPlanName(subscription.planType)}
                </p>
                <p className="text-gray-600">
                  {formatPrice(getPlanPrice(subscription.planType))}/month
                </p>
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <AlertCircle className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-500">
                    Status
                  </span>
                </div>
                <div className="flex items-center">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      isSubscriptionActive(subscription)
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {getSubscriptionStatus(subscription)}
                  </span>
                  {subscription.cancelAtPeriodEnd && (
                    <span className="ml-2 text-sm text-orange-600">
                      (Cancels at period end)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Billing Period */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Billing Period
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center mb-2">
                  <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-500">
                    Current Period Start
                  </span>
                </div>
                <p className="text-gray-900">
                  {formatDate(subscription.currentPeriodStart)}
                </p>
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-500">
                    Current Period End
                  </span>
                </div>
                <p className="text-gray-900">
                  {formatDate(subscription.currentPeriodEnd)}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Manage Subscription
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Billing Portal</p>
                  <p className="text-sm text-gray-600">
                    Update payment method, download invoices, and manage your
                    subscription
                  </p>
                </div>
                <button
                  onClick={handleManageBilling}
                  disabled={portalLoading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  {portalLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  {portalLoading ? 'Opening...' : 'Manage Billing'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Change Plan</p>
                  <p className="text-sm text-gray-600">
                    Upgrade or downgrade your subscription plan
                  </p>
                </div>
                <button
                  onClick={() => router.push('/pricing')}
                  className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
                >
                  View Plans
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* No Subscription */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Active Subscription
          </h2>
          <p className="text-gray-600 mb-6">
            You don&apos;t have an active subscription. Choose a plan to get started.
          </p>
          <button
            onClick={() => router.push('/pricing')}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            View Pricing Plans
          </button>
        </div>
      )}
    </div>
  );
}
