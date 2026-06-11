// ============================================================
// IGWEMP — Constants
// ============================================================

export const APP_NAME = 'IGWEMP';
export const APP_VERSION = '1.0.0';
export const APP_FULL_NAME = 'Integrated Governance, Workflow & Education Management Platform';

// ─── Pagination ───────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

// ─── Work Queue Priority Colors ───────────────────────────────
export const PRIORITY_CONFIG = {
  OVERDUE: {
    label: 'Overdue',
    color: 'text-red-400',
    bg: 'bg-red-950/40',
    border: 'border-red-800/50',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
    dot: '🔴',
  },
  DUE_TODAY: {
    label: 'Due Today',
    color: 'text-orange-400',
    bg: 'bg-orange-950/40',
    border: 'border-orange-800/50',
    badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    dot: '🟠',
  },
  DUE_THIS_WEEK: {
    label: 'Due This Week',
    color: 'text-yellow-400',
    bg: 'bg-yellow-950/40',
    border: 'border-yellow-800/50',
    badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    dot: '🟡',
  },
  UPCOMING: {
    label: 'Upcoming',
    color: 'text-blue-400',
    bg: 'bg-blue-950/40',
    border: 'border-blue-800/50',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    dot: '🔵',
  },
  NO_DEADLINE: {
    label: 'No Deadline',
    color: 'text-slate-400',
    bg: 'bg-slate-950/40',
    border: 'border-slate-800/50',
    badge: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    dot: '⚫',
  },
} as const;

// ─── Role Display Names ───────────────────────────────────────
export const ROLE_LABELS: Record<string, string> = {
  PLATFORM_ADMIN: 'Platform Administrator',
  DEPT_ADMIN: 'Department Administrator',
  DIRECTOR: 'Director',
  DEPUTY_DIRECTOR: 'Deputy Director',
  CEO: 'Chief Education Officer',
  DCEO: 'Deputy CEO',
  ZEO: 'Zonal Education Officer',
  DZEO: 'Deputy ZEO',
  HOI: 'Head of Institution',
  SECTION_HEAD: 'Section Head',
  OFFICER: 'Officer',
  CLERK: 'Clerk',
  EMPLOYEE: 'Employee',
  AUDITOR: 'Auditor',
  REPORT_VIEWER: 'Report Viewer',
};

// ─── Section Types ────────────────────────────────────────────
export const SECTION_TYPE_LABELS: Record<string, string> = {
  ESTABLISHMENT: 'Establishment Section',
  ACADEMIC: 'Academic Section',
  ACCOUNTS: 'Accounts Section',
  INFRASTRUCTURE: 'Infrastructure Section',
  SCHOLARSHIP: 'Scholarship Section',
  LEGAL: 'Legal Section',
  CONFIDENTIAL: 'Confidential Section',
  PLANNING: 'Planning Section',
  GENERAL: 'General Section',
  CUSTOM: 'Custom Section',
};

// ─── Responsibility Categories ────────────────────────────────
export const RESPONSIBILITY_CATEGORY_LABELS: Record<string, string> = {
  ACADEMIC: 'Academic',
  ADMINISTRATIVE: 'Administrative',
  ELECTORAL: 'Electoral',
  COMMITTEE: 'Committee',
  SURVEY: 'Survey',
  EXAMINATION: 'Examination',
};

// ─── Case Status ──────────────────────────────────────────────
export const CASE_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  OPEN: { label: 'Open', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  PENDING_APPROVAL: { label: 'Pending Approval', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  RETURNED: { label: 'Returned', color: 'text-red-400', bg: 'bg-red-500/10' },
  ESCALATED: { label: 'Escalated', color: 'text-red-500', bg: 'bg-red-500/15' },
  CLOSED: { label: 'Closed', color: 'text-green-400', bg: 'bg-green-500/10' },
  REJECTED: { label: 'Rejected', color: 'text-slate-400', bg: 'bg-slate-500/10' },
};

// ─── Navigation Routes ────────────────────────────────────────
export const ROUTES = {
  // Auth
  LOGIN: '/login',
  MFA: '/mfa',

  // Primary — Work Queue First [ADJ-06]
  WORK_QUEUE: '/work-queue',
  SECTION_QUEUE: '/section-queue',
  OFFICE_INBOX: '/office-inbox',

  // Governance
  ORDERS: '/orders',
  ORDERS_CREATE: '/orders/create',
  ORDER_DETAIL: (id: string) => `/orders/${id}`,
  CIRCULARS: '/circulars',

  // Cases
  CASES: '/cases',
  CASE_DETAIL: (id: string) => `/cases/${id}`,

  // Delegation [ADJ-04]
  DELEGATIONS: '/delegations',

  // Education [Phase 4]
  EMPLOYEES: '/employees',
  EMPLOYEE_DETAIL: (id: string) => `/employees/${id}`,
  SCHOOLS: '/schools',
  SCHOOL_DETAIL: (id: string) => `/schools/${id}`,

  // Reports
  REPORTS: '/reports',
  DASHBOARDS: '/dashboards',
  NOTIFICATIONS: '/notifications',

  // Admin
  ADMIN: '/admin',
  ADMIN_HIERARCHY: '/admin/hierarchy',
  ADMIN_SECTIONS: '/admin/sections',
  ADMIN_USERS: '/admin/users',
  ADMIN_RESPONSIBILITIES: '/admin/responsibilities',
  ADMIN_WORKFLOWS: '/admin/workflows',
  ADMIN_NOTIFICATIONS: '/admin/notifications',
  ADMIN_SYSTEM: '/admin/system',

  // Errors
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/403',
} as const;
