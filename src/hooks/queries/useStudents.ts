import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { StudentProfile } from '../../types';

const IS_DEV_MODE = !isSupabaseConfigured;

const MOCK_STUDENTS: StudentProfile[] = [
  { id: '11111111-1111-1111-1111-111111111111', tenant_id: 't1', student_code: 'STD001', admission_no: 'A001', student_name: 'John Doe', father_name: 'Richard Doe', mother_name: 'Jane Doe', guardian_name: null, date_of_birth: '2010-05-15', gender_id: 'm1', mobile_no: '9876543210', address_text: '123 Main St', village: 'Village A', panchayat: 'Panchayat A', is_cwsn: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '22222222-2222-2222-2222-222222222222', tenant_id: 't1', student_code: 'STD002', admission_no: 'A002', student_name: 'Mary Jane', father_name: 'Peter Jane', mother_name: 'Mary Jane Sr', guardian_name: null, date_of_birth: '2011-08-20', gender_id: 'f1', mobile_no: '9876543211', address_text: '456 Side St', village: 'Village B', panchayat: 'Panchayat B', is_cwsn: true, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const useStudents = (filters?: { officeId?: string; classId?: string }) => {
  return useQuery({
    queryKey: ['students', filters],
    queryFn: async () => {
      if (IS_DEV_MODE) {
        return MOCK_STUDENTS; // Filtering could be applied on mock enrollments but we just return students here for now
      }
      let q = supabase.from('student_profiles').select('*').eq('is_active', true);
      // If we had a robust view like v_student_current_enrollment, we'd query that instead for filtered students
      const { data, error } = await q;
      if (error) throw error;
      return data as StudentProfile[];
    }
  });
};

export const useStudentCurrentEnrollment = (filters?: { officeId?: string; classId?: string }) => {
  return useQuery({
    queryKey: ['v_student_current_enrollment', filters],
    queryFn: async () => {
      if (IS_DEV_MODE) {
        // Mock data mapping
        return MOCK_STUDENTS.map(s => ({
          tenant_id: 't1',
          student_id: s.id,
          student_name: s.student_name,
          gender_id: s.gender_id,
          academic_session_id: 'sess1',
          office_id: 'o1',
          office_path: '1.2.3',
          office_name: 'Primary School A',
          class_id: 'c1',
          section_name: 'A',
          roll_no: '1',
          enrollment_status_id: 'e1'
        }));
      }
      let q = supabase.from('v_student_current_enrollment').select('*');
      if (filters?.officeId) q = q.eq('office_id', filters.officeId);
      if (filters?.classId) q = q.eq('class_id', filters.classId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    }
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { profile: Partial<StudentProfile>, enrollment: any }) => {
      if (IS_DEV_MODE) {
        return { success: true, id: 'new-id' };
      }
      // Usually done via an RPC to ensure both profile and enrollment are created together
      const { data, error } = await supabase.rpc('create_student_with_enrollment', { payload });
      if (error) {
        // Fallback if RPC doesn't exist yet, we'd insert profile then enrollment
        const { data: prof, error: e1 } = await supabase.from('student_profiles').insert([payload.profile]).select().single();
        if (e1) throw e1;
        const { error: e2 } = await supabase.from('student_enrollments').insert([{ ...payload.enrollment, student_id: prof.id }]);
        if (e2) throw e2;
        return { success: true, id: prof.id };
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['v_student_current_enrollment'] });
    }
  });
};
