import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { EmployeeUpdateRequest} from '../../types';

const IS_DEV_MODE = !isSupabaseConfigured;

// ─── Mock Data ─────────────────────────────────────────────────────────────
const MOCK_MY_PROFILE = {
  id: 'emp-teacher-001',
  employee_code: 'TCH-2019-042',
  employment_status: 'ACTIVE',
  first_name: 'Meenakshi',
  last_name: 'Sharma',
  designation: 'Teacher (TGT)',
  cadre: 'TGT Science',
  current_office: 'Govt HSS Peeri',
  current_posting: 'Posted (Substantive) since 2021-04-01',
  mobile_no: '9876543210',
  address: 'H.No 12, Ward 3, Peeri, Rajouri',
  date_of_birth: '1988-06-15',
  date_of_initial_appointment: '2019-08-01'};

const MOCK_MY_REQUESTS: EmployeeUpdateRequest[] = [
  {
    id: 'req-001',
    request_type: 'MOBILE_UPDATE',
    status: 'RETURNED',
    submitted_at: '2026-05-20T10:00:00Z',
    reviewer_remarks: 'Please attach proof of new mobile number.',
    proposed_value: '9988776655'},
  {
    id: 'req-002',
    request_type: 'QUALIFICATION_UPDATE',
    status: 'PENDING',
    submitted_at: '2026-06-10T14:00:00Z',
    reviewer_remarks: null,
    proposed_value: 'M.Sc Physics, University of Jammu, 2023'},
];

// ─── Keys ──────────────────────────────────────────────────────────────────
export const employeeSelfServiceKeys = {
  all: ['employeeSelfService'] as const,
  profile: () => [...employeeSelfServiceKeys.all, 'profile'] as const,
  requests: () => [...employeeSelfServiceKeys.all, 'requests'] as const};

// ─── Hooks ─────────────────────────────────────────────────────────────────
export function useMyEmployeeProfile() {
  return useQuery({
    queryKey: employeeSelfServiceKeys.profile(),
    queryFn: async () => {
      if (IS_DEV_MODE) return MOCK_MY_PROFILE;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      // RLS ensures only own profile returned
      const { data, error } = await supabase
        .from('v_employee_current_state')
        .select('*')
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    }});
}

export function useMyUpdateRequests() {
  return useQuery({
    queryKey: employeeSelfServiceKeys.requests(),
    queryFn: async () => {
      if (IS_DEV_MODE) return MOCK_MY_REQUESTS;
      const { data, error } = await supabase
        .from('employee_change_requests')
        .select('*, items:employee_change_request_items(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }});
}

export function useSubmitUpdateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      request_type: string;
      reason: string;
      proposed_values: Record<string, any>;
      target_entity_type: string;
      target_record_id?: string;
    }) => {
      if (IS_DEV_MODE) {
        return { id: 'new-mock-req', status: 'SUBMITTED', ...payload };
      }
      // Insert into employee_change_requests (existing S6 table)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: request, error: reqError } = await supabase
        .from('employee_change_requests')
        .insert({
          request_type: payload.request_type,
          reason: payload.reason,
          status: 'SUBMITTED',
          submitted_at: new Date().toISOString()})
        .select()
        .single();
      if (reqError) throw reqError;

      const { error: itemError } = await supabase
        .from('employee_change_request_items')
        .insert({
          change_request_id: request.id,
          target_entity_type: payload.target_entity_type,
          target_record_id: payload.target_record_id,
          operation: 'UPDATE',
          proposed_values: payload.proposed_values,
          status: 'PENDING'});
      if (itemError) throw itemError;
      return request;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: employeeSelfServiceKeys.requests() });
    }});
}
