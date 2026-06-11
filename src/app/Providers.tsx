// ============================================================
// IGWEMP — Providers
// Auth, Query, Tenant — all wrapped here
// ============================================================

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import { AuthProvider } from '../core/auth/AuthContext';
import { TenantProvider } from '../core/tenant/TenantContext';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <TenantProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </TenantProvider>
    </QueryClientProvider>
  );
}
