import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { PersonResponsibility, ResponsibilityType } from '../../types';

export const responsibilityKeys = {
  all: ['responsibilities'] as const,
  types: () => ['responsibility_types'] as const,
  byPerson: (personId: string) => [...responsibilityKeys.all, 'person', personId] as const,
};

export function useResponsibilityTypes() {
  return useQuery({
    queryKey: responsibilityKeys.types(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('responsibility_types')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as ResponsibilityType[];
    },
  });
}

export function usePersonResponsibilities(personId?: string) {
  return useQuery({
    queryKey: personId ? responsibilityKeys.byPerson(personId) : responsibilityKeys.all,
    queryFn: async () => {
      let query = supabase
        .from('person_responsibilities')
        .select('*, responsibility_type:resp_type_id(*)');
        
      if (personId) {
        query = query.eq('person_id', personId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as PersonResponsibility[];
    },
  });
}
