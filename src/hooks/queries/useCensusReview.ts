import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../core/auth/AuthContext';

interface ApproveCensusSubmissionInput {
  submission_id: string;
  selected_abolition_post_ids?: string[];
}

interface ApproveCensusSubmissionResult {
  success: boolean;
  message: string;
  submission_id: string;
  posts_created: number;
  posts_abolished: number;
}

export function useApproveCensusSubmission() {
  const queryClient = useQueryClient();
  useAuth();
  const isDevMode = !isSupabaseConfigured;

  return useMutation({
    mutationFn: async ({ submission_id, selected_abolition_post_ids = [] }: ApproveCensusSubmissionInput): Promise<ApproveCensusSubmissionResult> => {
      if (isDevMode) {
        // Mock atomic RPC behavior
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              success: true,
              message: 'MOCK: Post Census successfully approved and physical posts created/abolished.',
              submission_id,
              posts_created: 0,
              posts_abolished: selected_abolition_post_ids.length});
          }, 800);
        });
      }

      // Production: Call the atomic RPC
      const { data, error } = await supabase.rpc('approve_post_census_submission', {
        p_submission_id: submission_id,
        p_abolition_post_ids: selected_abolition_post_ids});

      if (error) {
        throw new Error(error.message);
      }

      return data as ApproveCensusSubmissionResult;
    },
    onSuccess: () => {
      // Invalidate relevant queries so the UI refreshes
      queryClient.invalidateQueries({ queryKey: ['post_census_submissions'] });
      queryClient.invalidateQueries({ queryKey: ['office_vacancy_dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    }});
}
