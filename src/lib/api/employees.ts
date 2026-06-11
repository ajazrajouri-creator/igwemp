import { supabase } from '../supabase';
import type { JSONBValue } from '../../types';

export const EmployeeAPI = {
  /**
   * Evaluates if the current user has access to a specific employee for a given action.
   * Leverages the database RPC `can_access_employee`.
   */
  async checkAccess(employeeId: string, action: string = 'READ'): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('can_access_employee', { p_employee_id: employeeId, p_action: action });
      
    if (error) {
      console.error('Access check failed:', error);
      return false;
    }
    return !!data;
  },

  /**
   * Fetches the optimized current state view for an employee.
   */
  async getCurrentState(employeeId: string) {
    const { data, error } = await supabase
      .from('v_employee_current_state')
      .select('*')
      .eq('employee_id', employeeId)
      .single();
      
    if (error) throw error;
    return data;
  },

  /**
   * Submits a new workflow-backed employee change request
   */
  async submitChangeRequest(
    employeeId: string, 
    requestType: string, 
    reason: string,
    items: Array<{
      targetEntityType: 'PROFILE' | 'SERVICE' | 'POSTING' | 'ARRANGEMENT' | 'QUALIFICATION' | 'SUBJECT' | 'DOCUMENT';
      targetRecordId?: string;
      operation: 'CREATE' | 'UPDATE' | 'CLOSE' | 'CORRECT';
      proposedValues: JSONBValue;
      existingRecordVersion?: number;
    }>
  ) {
    // 1. Create the request
    const { data: request, error: reqError } = await supabase
      .from('employee_change_requests')
      .insert({
        employee_id: employeeId,
        request_type: requestType,
        reason,
        status: 'SUBMITTED',
        // requested_by is typically handled by RLS/Auth or explicitly passed if needed
      })
      .select()
      .single();

    if (reqError) throw reqError;

    // 2. Insert items
    const { error: itemsError } = await supabase
      .from('employee_change_request_items')
      .insert(
        items.map(i => ({
          change_request_id: request.id,
          target_entity_type: i.targetEntityType,
          target_record_id: i.targetRecordId,
          operation: i.operation,
          proposed_values: i.proposedValues,
          existing_record_version: i.existingRecordVersion
        }))
      );

    if (itemsError) throw itemsError;

    return request;
  },

  /**
   * Applies an approved change request securely using the backend RPC to enforce optimistic locking and transactions.
   */
  async applyApprovedChangeRequest(requestId: string) {
    const { data, error } = await supabase
      .rpc('apply_approved_employee_change_request', { p_request_id: requestId });
      
    if (error) throw error;
    return data; // { success: true, message: '...' }
  }
};
