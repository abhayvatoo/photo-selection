'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { PLAN_LIMITS, formatPrice, getPlanPrice } from '@/lib/subscription';
import { useToast } from '@/hooks/useToast';
import { csrfPostJSON } from '@/lib/csrf-fetch';

const plans = [
  {
    name: 'Starter',
    key: 'starter' as const,
    price: 0,
    description: 'Perfect for trying out our platform',
    features: PLAN_LIMITS.STARTER.features,
    limits: PLAN_LIMITS.STARTER,
    popular: false,
  },
  {
    name: 'Professional',
    key: 'professional' as const,
    price: getPlanPrice('PROFESSIONAL'),
    description: 'Best for growing photography businesses',
    features: PLAN_LIMITS.PROFESSIONAL.features,
    limits: PLAN_LIMITS.PROFESSIONAL,
    popular: true,
  },
  {
    name: 'Enterprise',
    key: 'enterprise' as const,
    price: getPlanPrice('ENTERPRISE'),
    description: 'For large studios and agencies',
    features: PLAN_LIMITS.ENTERPRISE.features,
    limits: PLAN_LIMITS.ENTERPRISE,
    popular: false,
  },
];

interface PricingSectionProps {
  showHeader?: boolean;
  headerTitle?: string;
  headerSubtitle?: string;
  className?: string;
  compact?: boolean;
}

export default function PricingSection({
  showHeader = true,
  headerTitle = 'Simple, transparent pricing',
  headerSubtitle = 'Choose the perfect plan for your photography business',
  className = '',
  compact = false,
}: PricingSectionProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleSelectPlan = async (planKey: string) => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    setLoading(planKey);

    try {
      const response = await csrfPostJSON(
        '/api/stripe/create-checkout-session',
        {
          planType: planKey,
        }
      );

      const data = await response.json();

      if (data.success) {
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          // For free plan or development mode
          router.push(data.redirectUrl || '/dashboard');
        }
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error selecting plan:', error);
      showToast('Failed to select plan. Please try again.', 'error');
    } finally {
      setLoading(null);
    }
  };

  const formatLimit = (limit: number, unit: string) => {
    if (limit === -1) return 'Unlimited';
    return `${limit} ${unit}`;
  };

  return (
    <div className={`${compact ? 'py-8' : 'py-12'} ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {showHeader && (
          <div className="text-center">
            <h2
              className={`font-bold text-gray-900 ${compact ? 'text-3xl' : 'text-4xl sm:text-5xl'}`}
            >
              {headerTitle}
            </h2>
            <p
              className={`mt-4 text-gray-600 ${compact ? 'text-lg' : 'text-xl'}`}
            >
              {headerSubtitle}
            </p>
          </div>
        )}

        <div
          className={`${showHeader ? 'mt-16' : ''} grid grid-cols-1 gap-8 lg:grid-cols-3`}
        >
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`relative rounded-2xl border ${
                plan.popular ? 'border-blue-500 shadow-lg' : 'border-gray-200'
              } bg-white p-8`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900">
                  {plan.name}
                </h3>
                <p className="mt-2 text-gray-600">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatPrice(plan.price)}
                  </span>
                  <span className="text-gray-600">/month</span>
                </div>
              </div>

              <div className="mt-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  What's included:
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">
                      {formatLimit(plan.limits.maxWorkspaces, 'workspace')}
                      {plan.limits.maxWorkspaces === 1 ? '' : 's'}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">
                      {formatLimit(plan.limits.maxPhotosPerWorkspace, 'photo')}
                      {plan.limits.maxPhotosPerWorkspace === 1 ? '' : 's'} per
                      workspace
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">
                      {formatLimit(plan.limits.maxUsersPerWorkspace, 'user')}
                      {plan.limits.maxUsersPerWorkspace === 1 ? '' : 's'} per
                      workspace
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">
                      {plan.limits.maxStorageGB}GB storage
                    </span>
                  </li>
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => handleSelectPlan(plan.key)}
                  disabled={loading === plan.key}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-center transition-colors ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'
                      : 'bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-400'
                  }`}
                >
                  {loading === plan.key ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Processing...
                    </div>
                  ) : (
                    `Get ${plan.name}`
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {!compact && (
          <div className="mt-16 text-center">
            <p className="text-gray-600">
              All plans include a 14-day free trial. No credit card required for
              Starter plan.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Need something custom?{' '}
              <a
                href="mailto:support@photoselection.com"
                className="text-blue-600 hover:underline"
              >
                Contact us
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
