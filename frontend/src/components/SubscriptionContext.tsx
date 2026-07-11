'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SubscriptionPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number | null;
  description: string | null;
  isActive: boolean;
}

interface FeatureOverride {
  id: string;
  restaurantId: string;
  featureId: string;
  enabled: boolean;
  expiresAt: string | null;
  notes: string | null;
  feature: {
    code: string;
    name: string;
  };
}

interface SubscriptionContextType {
  resolvedFeatures: string[];
  currentPlan: SubscriptionPlan | null;
  overrides: FeatureOverride[];
  isLoading: boolean;
  hasFeature: (featureCode: string) => boolean;
  refreshFeatures: () => Promise<void>;
  tenantId: string | null;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [resolvedFeatures, setResolvedFeatures] = useState<string[]>([]);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [overrides, setOverrides] = useState<FeatureOverride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);

  const fetchFeatures = async () => {
    if (typeof window !== 'undefined' && window.location.pathname === '/admin/change-password') {
      setIsLoading(false);
      return;
    }
    try {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };

      const cookieToken = getCookie('adminToken');
      const token = sessionStorage.getItem('impersonatedToken') || localStorage.getItem('adminToken') || cookieToken;
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Decode JWT token
      const parts = token.split('.');
      if (parts.length < 2) {
        setIsLoading(false);
        return;
      }

      const payload = JSON.parse(atob(parts[1]));
      const tId = payload.tenantId;
      setTenantId(tId);

      if (!tId) {
        setIsLoading(false);
        return;
      }

      const res = await fetch(`/api/restaurants/${tId}/features`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setResolvedFeatures(data.resolvedFeatures || []);
        setCurrentPlan(data.plan || null);
        setOverrides(data.overrides || []);
      }
    } catch (error) {
      console.error('Error fetching subscription features:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  const hasFeature = (featureCode: string): boolean => {
    // If loading or resolving, default to true temporarily to prevent layout flashes, 
    // or false for safety. In production SaaS, we default to false for premium features.
    if (isLoading) return true; // Default true during initial loading to prevent flashes, checked again on mount
    return resolvedFeatures.includes(featureCode);
  };

  return (
    <SubscriptionContext.Provider
      value={{
        resolvedFeatures,
        currentPlan,
        overrides,
        isLoading,
        hasFeature,
        refreshFeatures: fetchFeatures,
        tenantId
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
