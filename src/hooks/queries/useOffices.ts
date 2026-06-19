import { useQuery} from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { Office, HierarchyLevel } from '../../types';

export const officeKeys = {
  all: ['offices'] as const,
  levels: ['hierarchy_levels'] as const,
  tree: () => [...officeKeys.all, 'tree'] as const};

export function useHierarchyLevels() {
  return useQuery({
    queryKey: officeKeys.levels,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hierarchy_levels')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return data as HierarchyLevel[];
    }});
}

export function useOffices() {
  return useQuery({
    queryKey: officeKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offices')
        .select('*, level:hierarchy_levels(*)')
        .is('deleted_at', null)
        .order('path');
      
      if (error) throw error;
      return data as Office[];
    }});
}

export function useOfficeHierarchy() {
  const { data: offices, ...rest } = useOffices();

  // Helper to transform flat offices array into a tree using parent_office_id
  const tree = offices;

  return {
    data: tree,
    ...rest};
}
