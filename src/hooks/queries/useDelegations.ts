import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { DelegationOfAuthority } from '../../types';

export const delegationKeys = {
  all: ['delegations'] as const,
  byUser: (userId: string) => [...delegationKeys.all, 'user', userId] as const,
};

export function useDelegations(userId?: string) {
  return useQuery({
    queryKey: userId ? delegationKeys.byUser(userId) : delegationKeys.all,
    queryFn: async () => {
      let query = supabase
        .from('delegations_of_authority')
        .select('*, delegator:delegated_by(*), delegate:delegated_to(*), scopes:delegation_scopes(*)');
        
      if (userId) {
        query = query.or(`delegated_by.eq.${userId},delegated_to.eq.${userId}`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as DelegationOfAuthority[];
    },
  });
}
