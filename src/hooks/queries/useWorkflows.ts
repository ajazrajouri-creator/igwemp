import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { WorkflowDefinition, WorkflowVersion, WorkflowState, WorkflowTransition } from '../../types';

export const workflowKeys = {
  all: ['workflows'] as const,
  versions: (defId: string) => [...workflowKeys.all, 'versions', defId] as const,
  activeVersion: (defId: string) => [...workflowKeys.all, 'active_version', defId] as const,
  states: (versionId: string) => [...workflowKeys.all, 'states', versionId] as const,
  transitions: (versionId: string) => [...workflowKeys.all, 'transitions', versionId] as const,
};

export function useWorkflowDefinitions() {
  return useQuery({
    queryKey: workflowKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_definitions')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as WorkflowDefinition[];
    },
  });
}

export function useWorkflowVersions(definitionId: string) {
  return useQuery({
    queryKey: workflowKeys.versions(definitionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_versions')
        .select('*')
        .eq('workflow_id', definitionId)
        .order('version_number', { ascending: false });
      
      if (error) throw error;
      return data as WorkflowVersion[];
    },
    enabled: !!definitionId,
  });
}

export function useWorkflowStates(versionId: string) {
  return useQuery({
    queryKey: workflowKeys.states(versionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_states')
        .select('*')
        .eq('workflow_version_id', versionId);
      
      if (error) throw error;
      return data as WorkflowState[];
    },
    enabled: !!versionId,
  });
}
