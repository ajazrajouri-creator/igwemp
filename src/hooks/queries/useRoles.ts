import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { Role, Policy, RoleAssignment } from '../../types';

export const roleKeys = {
  all: ['roles'] as const,
  policies: () => ['policies'] as const,
  assignments: (userId?: string) => userId ? ['role_assignments', 'user', userId] as const : ['role_assignments'] as const,
};

export function useRoles() {
  return useQuery({
    queryKey: roleKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('hierarchy_weight', { ascending: false });
      
      if (error) throw error;
      return data as Role[];
    },
  });
}

export function usePolicies() {
  return useQuery({
    queryKey: roleKeys.policies(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('policies')
        .select('*')
        .order('module');
      
      if (error) throw error;
      return data as Policy[];
    },
  });
}

export function useRoleAssignments(userId?: string) {
  return useQuery({
    queryKey: roleKeys.assignments(userId),
    queryFn: async () => {
      let query = supabase
        .from('role_assignments')
        .select('*, role:role_id(*), scopes:role_assignment_scopes(*, item:scope_item_id(*))');
        
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as RoleAssignment[];
    },
  });
}
