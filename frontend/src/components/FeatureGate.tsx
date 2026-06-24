'use client';

import React, { ReactNode } from 'react';
import { useSubscription } from './SubscriptionContext';
import PremiumLockScreen from './PremiumLockScreen';

interface FeatureGateProps {
  feature: string;
  featureName: string;
  requiredPlan?: string;
  featureDescription?: string;
  children: ReactNode;
}

export default function FeatureGate({
  feature,
  featureName,
  requiredPlan = 'Premium',
  featureDescription,
  children
}: FeatureGateProps) {
  const { hasFeature, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-neutral-500 text-xs font-semibold animate-pulse">Resolving subscription permissions...</p>
      </div>
    );
  }

  const isAllowed = hasFeature(feature);

  if (!isAllowed) {
    return (
      <PremiumLockScreen
        featureName={featureName}
        requiredPlan={requiredPlan}
        featureDescription={featureDescription}
      />
    );
  }

  return <>{children}</>;
}
