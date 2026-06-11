import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { EmployeeProfileExt } from '../../types';

export const employeeKeys = {
  all: ['employees'] as const,
  list: (filters: Record<string, any>) => [...employeeKeys.all, 'list', filters] as const,
  detail: (id: string) => [...employeeKeys.all, 'detail', id] as const,
  postings: (id: string) => [...employeeKeys.all, 'postings', id] as const,
  serviceRecords: (id: string) => [...employeeKeys.all, 'serviceRecords', id] as const,
};

export function useEmployees(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: employeeKeys.list(filters),
    queryFn: async () => {
      let query = supabase.from('v_employee_current_state').select('*');

      if (filters.office_id) query = query.eq('current_office_id', filters.office_id);
      if (filters.cadre_id) query = query.eq('cadre_id', filters.cadre_id);
      if (filters.status) query = query.eq('employment_status', filters.status);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useEmployeeProfile(id: string) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: async () => {
      // First get the core extended profile
      const { data, error } = await supabase
        .from('employee_profiles')
        .select(`
          *,
          person:person_party_id(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as EmployeeProfileExt;
    },
    enabled: !!id,
  });
}

export function useEmployeePostings(id: string) {
  return useQuery({
    queryKey: employeeKeys.postings(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_postings')
        .select('*, office:office_id(*)')
        .eq('employee_id', id)
        .order('effective_from', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}
