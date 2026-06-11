import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { UserAccount, UserPreference } from '../../types';

export const identityKeys = {
  all: ['identity'] as const,
  users: () => [...identityKeys.all, 'users'] as const,
  preferences: (userId: string) => [...identityKeys.all, 'preferences', userId] as const,
};

export function useUsers() {
  return useQuery({
    queryKey: identityKeys.users(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_accounts')
        .select('*, party:party_id(*)');
      
      if (error) throw error;
      return data as UserAccount[];
    },
  });
}

export function useUserPreferences(userId: string | null) {
  return useQuery({
    queryKey: identityKeys.preferences(userId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found
      return data as UserPreference | null;
    },
    enabled: !!userId,
  });
}
