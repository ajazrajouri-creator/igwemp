import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { Party, PersonParty, OrgParty, EmployeeProfile } from '../../types';

export const partyKeys = {
  all: ['parties'] as const,
  persons: () => [...partyKeys.all, 'persons'] as const,
  orgs: () => [...partyKeys.all, 'orgs'] as const,
  employees: () => [...partyKeys.all, 'employees'] as const,
};

export function usePersonParties() {
  return useQuery({
    queryKey: partyKeys.persons(),
    queryFn: async () => {
      // In a real app, this would be a joined query or a view
      // For now, we query person_parties and join with parties
      const { data, error } = await supabase
        .from('person_parties')
        .select('*, party:party_id(*)');
      
      if (error) throw error;
      return data;
    },
  });
}

export function useOrgParties() {
  return useQuery({
    queryKey: partyKeys.orgs(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_parties')
        .select('*, party:party_id(*)');
      
      if (error) throw error;
      return data;
    },
  });
}

export function useEmployeeProfiles() {
  return useQuery({
    queryKey: partyKeys.employees(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('*, person:person_id(*, party:party_id(*))');
      
      if (error) throw error;
      return data as EmployeeProfile[];
    },
  });
}
