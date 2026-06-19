// ============================================================
// IGWEMP — Tenant Context [ADJ-03]
// Multi-tenant awareness at the React layer
// ============================================================

import React, { createContext, useContext, useState } from 'react';
import type { Tenant, TenantConfig } from '../../types';

// ─── Phase 1 Seed Tenant: School Education Department ─────────
export const SED_TENANT: Tenant = {
  id: 'sed-tenant-001',
  tenant_id: 'sed-tenant-001',
  code: 'SED',
  tenant_code: 'SED',
  name: 'School Education Department',
  tenant_name: 'School Education Department',
  config: {
    display_name: 'School Education Department',
    short_code: 'SED',
    locale: 'en-IN',
    timezone: 'Asia/Kolkata',
    fiscal_year_start_month: 4,
    order_reference_prefix: 'IGWEMP-SED',
    mfa_required: true,
    mfa_methods: ['TOTP', 'OTP'],
    features: {
      scholarship_module: true,
      udise_integration: false,
      mobile_app: false,
    },
    notification_channels: ['IN_APP', 'EMAIL'],
    audit_retention_years: 7,
    document_storage_bucket: 'sed-documents',
  },
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

// ─── Context Types ────────────────────────────────────────────
interface TenantContextValue {
  tenant: Tenant | null;
  tenantConfig: TenantConfig | null;
  isFeatureEnabled: (featureKey: keyof TenantConfig['features']) => boolean;
  isChannelEnabled: (channel: string) => boolean;
}

const TenantContext = createContext<TenantContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────
export function TenantProvider({ children }: { children: React.ReactNode }) {
  // Phase 1: single SED tenant hard-coded
  // Phase 6: resolve tenant from JWT claim or subdomain
  const [tenant] = useState<Tenant>(SED_TENANT);

  const isFeatureEnabled = (featureKey: keyof TenantConfig['features']): boolean => {
    return tenant?.config?.features?.[featureKey] ?? false;
  };

  const isChannelEnabled = (channel: string): boolean => {
    return tenant?.config?.notification_channels?.includes(channel as 'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP') ?? false;
  };

  return (
    <TenantContext.Provider
      value={{
        tenant,
        tenantConfig: tenant?.config ?? null,
        isFeatureEnabled,
        isChannelEnabled,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────
export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within TenantProvider');
  return ctx;
}
