// ============================================================
// IGWEMP — Stub Pages for Phase 1
// Placeholder pages for routes not yet implemented
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Construction, ArrowLeft } from 'lucide-react';
import { useAuth } from '../core/auth/AuthContext';

// ─── Generic Stub Page ────────────────────────────────────────
function StubPage({ title, description, icon }: {
  title: string;
  description: string;
  icon: string;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-enter">
      <div className="w-20 h-20 rounded-2xl bg-surface-3 flex items-center justify-center text-4xl">
        {icon}
      </div>
      <div className="text-center">
        <h1 className="text-xl font-bold text-ink-primary">{title}</h1>
        <p className="text-sm text-ink-muted mt-2 max-w-md">{description}</p>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-3 border border-surface-4">
        <Construction size={14} className="text-yellow-400" />
        <span className="text-xs text-ink-secondary">Coming in a future sprint</span>
      </div>
      <button className="btn-ghost btn-sm" onClick={() => navigate(-1)}>
        <ArrowLeft size={13} /> Go back
      </button>
    </div>
  );
}

// ─── Office Inbox ─────────────────────────────────────────────
export function OfficeInboxPage() {
  return (
    <StubPage
      title="Office Inbox"
      description="Office-level case inbox where the Office Head distributes incoming cases to sections. Coming in Sprint S11."
      icon="🏢"
    />
  );
}

// ─── Orders ───────────────────────────────────────────────────
export function OrdersListPage() {
  return (
    <StubPage
      title="Orders & Circulars"
      description="Manage published orders, create drafts, and track order compliance. Coming in Sprint S9."
      icon="📄"
    />
  );
}

export function OrderCreatePage() {
  return (
    <StubPage
      title="Create Order"
      description="Draft a new governance order with reference number generation and workflow assignment. Coming in Sprint S9."
      icon="✏️"
    />
  );
}

export function OrderDetailPage() {
  return (
    <StubPage
      title="Order Detail"
      description="View published order details, compliance status, and linked cases. Coming in Sprint S9."
      icon="📋"
    />
  );
}

// ─── Cases ────────────────────────────────────────────────────
export function CasesListPage() {
  return (
    <StubPage
      title="Cases"
      description="View and manage all cases assigned to you, your section, and your office. Coming in Sprint S10."
      icon="📁"
    />
  );
}

export function CaseDetailPage() {
  return (
    <StubPage
      title="Case Detail"
      description="Full case detail with timeline, documents, ATR submission, and workflow history. Coming in Sprint S10."
      icon="🗂️"
    />
  );
}

// ─── Delegation ───────────────────────────────────────────────
export function DelegationPage() {
  return (
    <StubPage
      title="Delegation of Authority"
      description="Manage authority delegations — create, view active delegations, and track delegation audit trail. Coming in Sprint S12."
      icon="⚡"
    />
  );
}

// ─── Employees ────────────────────────────────────────────────
export function EmployeesListPage() {
  return (
    <StubPage
      title="Employees"
      description="Employee master records, service history, posting history, and responsibility management. Coming in Phase 4 (Sprint S20)."
      icon="👥"
    />
  );
}

export function EmployeeDetailPage() {
  return (
    <StubPage
      title="Employee Profile"
      description="Complete employee profile with responsibilities, posting history, qualifications, and documents. Coming in Phase 4."
      icon="👤"
    />
  );
}

// ─── Schools ──────────────────────────────────────────────────
export function SchoolsListPage() {
  return (
    <StubPage
      title="Schools"
      description="School registry with infrastructure, enrollment, and post strength data. Coming in Phase 4 (Sprint S23)."
      icon="🏫"
    />
  );
}

export function SchoolDetailPage() {
  return (
    <StubPage
      title="School Profile"
      description="Complete school profile with infrastructure, post strength, and enrollment records. Coming in Phase 4."
      icon="🏫"
    />
  );
}

// ─── Reports ──────────────────────────────────────────────────
export function ReportsPage() {
  return (
    <StubPage
      title="Reports & Analytics"
      description="Standard reports, custom report builder, scheduled reports, and PDF/Excel exports. Coming in Phase 5 (Sprint S29)."
      icon="📊"
    />
  );
}

export function DashboardsPage() {
  return (
    <StubPage
      title="Dashboards"
      description="Role-scoped analytics dashboards for Directorate, District, Zone, and School levels. Coming in Phase 5."
      icon="📈"
    />
  );
}

// ─── Notifications ────────────────────────────────────────────
export function NotificationsPage() {
  return (
    <StubPage
      title="Notification Inbox"
      description="Full notification inbox with filtering by type, date, and read status. Coming in Sprint S18."
      icon="🔔"
    />
  );
}

// ─── Admin ────────────────────────────────────────────────────
export function AdminPage() {
  return (
    <StubPage
      title="Administration Console"
      description="System configuration, user provisioning, workflow templates, and platform settings. Coming in Sprint S3."
      icon="⚙️"
    />
  );
}

export function AdminHierarchyPage() {
  return (
    <StubPage
      title="Hierarchy Configuration"
      description="Configure organizational hierarchy levels, offices, and reporting structure. Coming in Sprint S3."
      icon="🌳"
    />
  );
}

export function AdminSectionsPage() {
  return (
    <StubPage
      title="Sections & Members"
      description="Manage office sections and section membership assignments. Coming in Sprint S4."
      icon="🗂️"
    />
  );
}

export function AdminUsersPage() {
  return (
    <StubPage
      title="User Provisioning"
      description="Create and manage user accounts, role assignments, and bulk import. Coming in Sprint S3."
      icon="👥"
    />
  );
}

export function AdminResponsibilitiesPage() {
  return (
    <StubPage
      title="Responsibility Types"
      description="Configure responsibility type master data (Teacher, HOI, Nodal Officer, etc.). Coming in Sprint S13."
      icon="📋"
    />
  );
}

export function AdminWorkflowsPage() {
  return (
    <StubPage
      title="Workflow Templates"
      description="Design and manage workflow templates with conditional routing and escalation rules. Coming in Sprint S14."
      icon="⚙️"
    />
  );
}

export function AdminSystemPage() {
  return (
    <StubPage
      title="System Monitor"
      description="Background job status, Edge Function health, audit archiver status, and system metrics. Coming in Phase 2."
      icon="🖥️"
    />
  );
}

// ─── Error Pages ──────────────────────────────────────────────
export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-5 animate-enter">
      <div className="text-7xl font-black text-surface-4">404</div>
      <div className="text-center">
        <h1 className="text-lg font-bold text-ink-primary">Page Not Found</h1>
        <p className="text-sm text-ink-muted mt-1">The page you are looking for does not exist.</p>
      </div>
      <button className="btn-primary" onClick={() => navigate('/work-queue')}>
        Back to Work Queue
      </button>
    </div>
  );
}

export function UnauthorizedPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-5 animate-enter">
      <div className="text-7xl font-black text-surface-4">403</div>
      <div className="text-center">
        <h1 className="text-lg font-bold text-ink-primary">Access Denied</h1>
        <p className="text-sm text-ink-muted mt-1">
          You do not have permission to access this resource.
        </p>
      </div>
      <button className="btn-primary" onClick={() => navigate('/work-queue')}>
        Back to Work Queue
      </button>
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────
export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('ceo.anantnag@jksed.gov.in');
  const [password, setPassword] = useState('demo1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      navigate('/work-queue');
    }
  };

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-brand">
            <span className="text-white font-black text-xl">IG</span>
          </div>
          <h1 className="text-xl font-bold text-ink-primary">IGWEMP</h1>
          <p className="text-xs text-ink-muted mt-1">School Education Department · J&K UT</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <h2 className="text-base font-semibold text-ink-primary">Sign In</h2>

          {error && (
            <div className="px-3 py-2 rounded-md bg-red-950/50 border border-red-800/50 text-xs text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="input-label">Email / Username</label>
            <input
              id="login-email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@jksed.gov.in"
              required
            />
          </div>
          <div>
            <label className="input-label">Password</label>
            <input
              id="login-password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-xs text-ink-disabled">
            Government of Jammu & Kashmir · Secure Portal
          </p>
        </form>
      </div>
    </div>
  );
}
