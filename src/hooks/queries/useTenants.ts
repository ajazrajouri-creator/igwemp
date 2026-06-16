import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { Tenant } from '../../types';

export const tenantKeys = {
  all: ['tenants'] as const,
  detail: (id: string) => [...tenantKeys.all, id] as const,
};

export function useTenants() {
  return useQuery({
    queryKey: tenantKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Tenant[];
    },
  });
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: tenantKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Tenant;
    },
    enabled: !!id,
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Tenant> }) => {
      const { data, error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Tenant;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.all });
      queryClient.setQueryData(tenantKeys.detail(data.id), data);
    },
  });
}
