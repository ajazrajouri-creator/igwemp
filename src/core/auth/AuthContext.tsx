// ============================================================
// IGWEMP — Auth Context
// Wraps Supabase Auth with user account + role data
// ============================================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { UserAccount, RoleAssignment, SectionMembership } from '../../types';

// ─── Dev Mode Flag ────────────────────────────────────────────
// When Supabase is not configured, run with mock data
const DEV_MODE = !isSupabaseConfigured;

// ─── Mock data for Phase 1 dev (before Supabase schema) ──────
const createMockUser = (id: string, username: string): UserAccount => ({
  id,
  user_id: id,
  tenant_id: 'sed-tenant-001',
  party_id: 'party-001',
  supabase_auth_id: `mock-auth-${id}`,
  username,
  status: 'ACTIVE',
  is_active: true,
  is_mfa_enabled: true,
  last_login_at: new Date().toISOString(),
  created_at: '2026-01-01T00:00:00Z',
  updated_at: new Date().toISOString(),
  party: {
    id: 'party-001',
    party_id: 'party-001',
    tenant_id: 'sed-tenant-001',
    party_type: 'PERSON',
    display_name: 'Abdul Karim',
    first_name: 'Abdul',
    last_name: 'Karim',
    aadhaar_hash: null,
    aadhaar_last4: null,
    pan_hash: null,
    pan_masked: null,
    dob: '1978-03-15',
    gender: 'MALE',
    is_active: true,
    deleted_at: null,
    mobile: '+91-9419000001',
    email: `${username}@jksed.gov.in`,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  role_assignments: []
});

const createMockRole = (userId: string, roleCode: string, officeId: string): RoleAssignment => ({
  id: `ra-${userId}`,
  assignment_id: `ra-${userId}`,
  tenant_id: 'sed-tenant-001',
  user_id: userId,
  role_id: `role-${roleCode}`,
  role_code: roleCode,
  office_id: officeId,
  section_id: null,
  effective_from: '2024-08-01',
  effective_to: null,
  assigned_by: null,
  assignment_reason: null,
  assigned_order_id: null,
  created_at: '2024-08-01T00:00:00Z',
  updated_at: '2024-08-01T00:00:00Z',
});

const MOCK_PROFILES = {
  CEO: {
    user: createMockUser('user-ceo-001', 'ceo.rajouri'),
    role: createMockRole('user-ceo-001', 'DISTRICT_ADMIN', 'office-ceo-rajouri'),
  },
  ZEO: {
    user: createMockUser('user-zeo-001', 'zeo.peeri'),
    role: createMockRole('user-zeo-001', 'ZONAL_ADMIN', 'office-zeo-peeri'),
  },
  HOI: {
    user: createMockUser('user-hoi-001', 'hoi.hsspeeri'),
    role: createMockRole('user-hoi-001', 'SCHOOL_HEAD', 'office-hss-peeri'),
  },
  TEACHER: {
    user: createMockUser('user-tch-001', 'teacher.hsspeeri'),
    role: createMockRole('user-tch-001', 'SCHOOL_EMPLOYEE', 'office-hss-peeri'),
  }
};

type MockProfileKey = keyof typeof MOCK_PROFILES;

// ─── Context Types ────────────────────────────────────────────
interface AuthContextValue {
  session: Session | null;
  supabaseUser: User | null;
  user: UserAccount | null;
  primaryRole: RoleAssignment | null;
  sectionMemberships: SectionMembership[];
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;

  // Permission helpers
  hasRole: (roleCode: string) => boolean;
  hasAnyRole: (roleCodes: string[]) => boolean;
  isSectionMember: (sectionId: string) => boolean;
  isSectionHead: (sectionId: string) => boolean;
  
  // Dev mode
  switchDevRole?: (roleKey: MockProfileKey) => void;
}

// ─── Context ──────────────────────────────────────────────────
export const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  
  // Dev mode defaults to TEACHER
  const [activeDevRole, setActiveDevRole] = useState<MockProfileKey>('TEACHER');
  
  const [user, setUser] = useState<UserAccount | null>(
    DEV_MODE ? { ...MOCK_PROFILES[activeDevRole].user, role_assignments: [MOCK_PROFILES[activeDevRole].role] } : null
  );
  const [primaryRole, setPrimaryRole] = useState<RoleAssignment | null>(
    DEV_MODE ? MOCK_PROFILES[activeDevRole].role : null
  );
  
  const [sectionMemberships, setSectionMemberships] = useState<SectionMembership[]>([]);
  const [isLoading, setIsLoading] = useState(!DEV_MODE);

  const loadUserAccount = useCallback(async (authUser: User) => {
    if (DEV_MODE) return;
    try {
      const { data, error } = await supabase
        .from('user_accounts')
        .select(`
          *,
          party:parties(*),
          role_assignments(*),
          section_memberships(*)
        `)
        .eq('supabase_auth_id', authUser.id)
        .single();

      if (error) throw error;
      if (data) {
        setUser(data as UserAccount);
        const roles = (data.role_assignments as RoleAssignment[]) || [];
        const now = new Date().toISOString();
        const activeRole = roles.find(
          (r) => r.effective_from <= now && (!r.effective_to || r.effective_to > now)
        );
        setPrimaryRole(activeRole || null);
        setSectionMemberships((data.section_memberships as SectionMembership[]) || []);
      }
    } catch (err) {
      console.error('[AuthContext] Failed to load user account:', err);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (supabaseUser) await loadUserAccount(supabaseUser);
  }, [supabaseUser, loadUserAccount]);

  useEffect(() => {
    if (DEV_MODE) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      if (session?.user) loadUserAccount(session.user);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        loadUserAccount(session.user);
      } else {
        setUser(null);
        setPrimaryRole(null);
        setSectionMemberships([]);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadUserAccount]);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (DEV_MODE) {
      // In dev mode, any credentials work
      setUser({ ...MOCK_PROFILES[activeDevRole].user, role_assignments: [MOCK_PROFILES[activeDevRole].role] });
      setPrimaryRole(MOCK_PROFILES[activeDevRole].role);
      return { error: null };
    }
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);
    return { error: error?.message || null };
  };

  const signOut = async () => {
    if (DEV_MODE) {
      setUser(null);
      setPrimaryRole(null);
      return;
    }
    await supabase.auth.signOut();
  };

  const hasRole = (roleCode: string): boolean => {
    if (!user?.role_assignments) return false;
    const now = new Date().toISOString();
    return user.role_assignments.some(
      (r) => r.role_code === roleCode
        && r.effective_from <= now
        && (!r.effective_to || r.effective_to > now)
    );
  };

  const hasAnyRole = (roleCodes: string[]): boolean =>
    roleCodes.some((code) => hasRole(code));

  const isSectionMember = (sectionId: string): boolean =>
    sectionMemberships.some(
      (m) => m.section_id === sectionId && (!m.effective_to || m.effective_to > new Date().toISOString())
    );

  const isSectionHead = (sectionId: string): boolean =>
    sectionMemberships.some(
      (m) =>
        m.section_id === sectionId &&
        m.section_role === 'HEAD' &&
        (!m.effective_to || m.effective_to > new Date().toISOString())
    );

  const isAuthenticated = DEV_MODE ? !!user : !!session && !!user;

  const switchDevRole = (roleKey: MockProfileKey) => {
    setActiveDevRole(roleKey);
    const mock = MOCK_PROFILES[roleKey];
    setUser({ ...mock.user, role_assignments: [mock.role] });
    setPrimaryRole(mock.role);
    // Add a slight reload simulation if we want, but simple state update works for React
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        supabaseUser,
        user,
        primaryRole,
        sectionMemberships,
        isLoading,
        isAuthenticated,
        signIn,
        signOut,
        refreshUser,
        hasRole,
        hasAnyRole,
        isSectionMember,
        isSectionHead,
        switchDevRole,
      }}
    >
      {children}
      {DEV_MODE && (
        <div className="fixed bottom-4 right-4 bg-white border border-border shadow-xl rounded-xl p-3 z-[9999] text-xs">
          <div className="font-semibold text-ink mb-2">Mock Role Switcher</div>
          <div className="flex flex-col gap-1">
            {(Object.keys(MOCK_PROFILES) as MockProfileKey[]).map(key => (
              <button
                key={key}
                onClick={() => switchDevRole(key)}
                className={`px-3 py-1.5 text-left rounded-md ${activeDevRole === key ? 'bg-primary text-white' : 'hover:bg-surface-alt'}`}
              >
                {key} ({MOCK_PROFILES[key].role.role_code})
              </button>
            ))}
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
