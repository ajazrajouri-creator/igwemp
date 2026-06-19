import { useQuery} from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

const IS_DEV_MODE = !isSupabaseConfigured;

// ─── Mock Data ─────────────────────────────────────────────────────────────
const MOCK_SCHOOL_SUMMARY = {
  school_name: 'Govt HSS Peeri',
  udise_code: '01020304050',
  school_type: 'HSS',
  zone: 'ZEO Peeri',
  total_students: 423,
  total_employees: 18,
  vacant_posts: 3,
  infrastructure_status: 'DRAFT',
  enrollment_status: 'DRAFT',
  post_census_status: 'SUBMITTED',
  returned_submissions: [
    {
      id: 'r1',
      module: 'Post Census',
      status: 'RETURNED',
      remarks: 'Please correct the data for Section B posts.',
      returned_at: '2026-06-10T08:30:00Z'},
  ],
  pending_tasks: 3,
  recent_orders: 2};

const MOCK_SUBMISSIONS_STATUS = [
  { module: 'Infrastructure Census', status: 'DRAFT', updated_at: '2026-06-14T10:00:00Z', remarks: null },
  { module: 'Student Enrollment', status: 'DRAFT', updated_at: '2026-06-15T14:30:00Z', remarks: null },
  { module: 'Post Census', status: 'RETURNED', updated_at: '2026-06-10T08:30:00Z', remarks: 'Please correct the data for Section B posts.' },
];

// ─── Keys ──────────────────────────────────────────────────────────────────
export const schoolPortalKeys = {
  all: ['schoolPortal'] as const,
  summary: (officeId: string) => [...schoolPortalKeys.all, 'summary', officeId] as const,
  submissionsStatus: (officeId: string) => [...schoolPortalKeys.all, 'submissionsStatus', officeId] as const};

// ─── Hooks ─────────────────────────────────────────────────────────────────
export function useSchoolDashboardSummary(officeId: string) {
  return useQuery({
    queryKey: schoolPortalKeys.summary(officeId),
    queryFn: async () => {
      if (IS_DEV_MODE) return MOCK_SCHOOL_SUMMARY;
      // Real query: join offices + submission statuses for this HOI office
      const { data, error } = await supabase
        .from('offices')
        .select('office_name, office_code')
        .eq('id', officeId)
        .single();
      if (error) throw error;
      return {
        ...MOCK_SCHOOL_SUMMARY,
        school_name: data.office_name,
        udise_code: data.office_code};
    },
    enabled: !!officeId});
}

export function useSchoolSubmissionsStatus(officeId: string) {
  return useQuery({
    queryKey: schoolPortalKeys.submissionsStatus(officeId),
    queryFn: async () => {
      if (IS_DEV_MODE) return MOCK_SUBMISSIONS_STATUS;
      const { data, error } = await supabase.rpc('get_school_submissions_status', { p_office_id: officeId });
      if (error) throw error;
      return data;
    },
    enabled: !!officeId});
}
