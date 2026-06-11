import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmployeeAPI } from '../../lib/api/employees';
import { supabase } from '../../lib/supabase';

// Properly mock the supabase client module
vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  }
}));

describe('Employee Logic & Access Evaluation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should deny update profile for standard users', async () => {
    const employeeId = 'test-id';
    
    // Simulate can_access_employee returning false
    (supabase.rpc as any).mockResolvedValueOnce({ data: false, error: null });

    const result = await EmployeeAPI.checkAccess(employeeId, 'UPDATE');
    expect(supabase.rpc).toHaveBeenCalledWith('can_access_employee', { p_employee_id: employeeId, p_action: 'UPDATE' });
    expect(result).toBe(false);
  });

  it('should allow profile access for authorized scope', async () => {
    const employeeId = 'test-id-2';
    
    (supabase.rpc as any).mockResolvedValueOnce({ data: true, error: null });

    const result = await EmployeeAPI.checkAccess(employeeId, 'READ');
    expect(result).toBe(true);
  });

  it('SCHOOL_TYPE fail-closed constraint (Mocked DB Evaluation)', async () => {
    const employeeId = 'test-id-school';
    
    // Simulate database returning false because SCHOOL_TYPE fact is missing
    (supabase.rpc as any).mockResolvedValueOnce({ data: false, error: null });

    const result = await EmployeeAPI.checkAccess(employeeId, 'READ');
    expect(result).toBe(false);
  });
});

describe('Employee Change Request RPC logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should prevent duplicate RPC invocation returning safely', async () => {
    const requestId = 'req-123';
    
    (supabase.rpc as any).mockResolvedValueOnce({ data: { success: true, message: 'Already applied.' }, error: null });

    const result = await EmployeeAPI.applyApprovedChangeRequest(requestId);
    expect(supabase.rpc).toHaveBeenCalledWith('apply_approved_employee_change_request', { p_request_id: requestId });
    expect(result.message).toBe('Already applied.');
  });
});
