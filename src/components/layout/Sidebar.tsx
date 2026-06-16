// ============================================================
// IGWEMP — Sidebar Navigation
// Work Queue First [ADJ-06] — My Work Queue is item #1
// ============================================================

import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, Inbox, Building2,
  FileText, FolderOpen, Users, School, BarChart3,
  Bell, Settings, ChevronDown, ChevronRight,
  Shield, FileSignature, UserCheck, Briefcase,
  AlertTriangle, CheckSquare, Clock, GitBranch,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ROUTES } from '../../lib/constants';
import { useAuth } from '../../core/auth/AuthContext';

// ─── Nav Item Types ───────────────────────────────────────────
interface NavItem {
  label: string;
  icon: React.ReactNode;
  to?: string;
  children?: NavItem[];
  badge?: number;
  badgeColor?: string;
  highlight?: boolean;  // primary items get accent treatment
  roles?: string[];     // restrict visibility
}

// ─── Navigation Config ────────────────────────────────────────
function useNavItems(unreadCount: number, overdueCount: number) {
  const { hasAnyRole } = useAuth();

  const items: NavItem[] = [
    // ── PRIMARY — Work Queue First [ADJ-06] ──────────────────
    {
      label: 'My Work Queue',
      icon: <ClipboardList size={16} />,
      to: ROUTES.WORK_QUEUE,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeColor: 'bg-red-500',
      highlight: true,
    },
    {
      label: 'Section Queue',
      icon: <Inbox size={16} />,
      to: ROUTES.SECTION_QUEUE,
      highlight: true,
    },
    {
      label: 'Office Inbox',
      icon: <Building2 size={16} />,
      to: ROUTES.OFFICE_INBOX,
    },

    // ── GOVERNANCE ────────────────────────────────────────────
    {
      label: 'Orders & Circulars',
      icon: <FileSignature size={16} />,
      children: [
        { label: 'Published Orders', icon: <FileText size={14} />, to: ROUTES.ORDERS },
        { label: 'My Drafts', icon: <Clock size={14} />, to: `${ROUTES.ORDERS}?tab=drafts` },
        { label: 'Create Order', icon: <CheckSquare size={14} />, to: ROUTES.ORDERS_CREATE },
      ],
    },

    // ── WORKFLOW ──────────────────────────────────────────────
    {
      label: 'Cases',
      icon: <FolderOpen size={16} />,
      children: [
        { label: 'My Cases', icon: <Briefcase size={14} />, to: ROUTES.CASES },
        { label: "Section's Cases", icon: <GitBranch size={14} />, to: `${ROUTES.CASES}?scope=section` },
        { label: 'All Office Cases', icon: <AlertTriangle size={14} />, to: `${ROUTES.CASES}?scope=office` },
      ],
    },

    // ── DELEGATION [ADJ-04] ───────────────────────────────────
    {
      label: 'Delegations',
      icon: <UserCheck size={16} />,
      to: ROUTES.DELEGATIONS,
    },

    // ── EDUCATION [Phase 4] ───────────────────────────────────
    {
      label: 'Employees',
      icon: <Users size={16} />,
      to: ROUTES.EMPLOYEES,
    },
    {
      label: 'Schools',
      icon: <School size={16} />,
      to: ROUTES.SCHOOLS,
    },
    {
      label: 'Post Census',
      icon: <Building2 size={16} />,
      children: [
        { label: 'Submit Census', icon: <FileText size={14} />, to: '/posts/census' },
        { label: 'Review Census', icon: <Shield size={14} />, to: '/posts/review' },
      ],
    },
    {
      label: 'Infrastructure',
      icon: <Building2 size={16} />,
      children: [
        { label: 'Submit Census', icon: <FileText size={14} />, to: '/infrastructure/census' },
        { label: 'Review Census', icon: <Shield size={14} />, to: '/infrastructure/review' },
      ],
    },

    // ── REPORTING (secondary — ADJ-06) ───────────────────────
    {
      label: 'Reports & Analytics',
      icon: <BarChart3 size={16} />,
      children: [
        { label: 'My Dashboard', icon: <LayoutDashboard size={14} />, to: ROUTES.DASHBOARDS },
        { label: 'Vacancy Dashboard', icon: <BarChart3 size={14} />, to: '/reports/vacancy' },
        { label: 'Deficiency Dashboard', icon: <AlertTriangle size={14} />, to: '/reports/deficiency' },
        { label: 'Standard Reports', icon: <FileText size={14} />, to: ROUTES.REPORTS },
      ],
    },

    // ── NOTIFICATIONS ─────────────────────────────────────────
    {
      label: 'Notifications',
      icon: <Bell size={16} />,
      to: ROUTES.NOTIFICATIONS,
      badge: unreadCount > 0 ? unreadCount : undefined,
      badgeColor: 'bg-brand-500',
    },
  ];

  // Admin items — restricted
  if (hasAnyRole(['PLATFORM_ADMIN', 'DEPT_ADMIN', 'DIRECTOR', 'CEO'])) {
    items.push({
      label: 'Administration',
      icon: <Settings size={16} />,
      children: [
        { label: 'Hierarchy Config', icon: <GitBranch size={14} />, to: ROUTES.ADMIN_HIERARCHY },
        { label: 'Sections & Members', icon: <Shield size={14} />, to: ROUTES.ADMIN_SECTIONS },
        { label: 'User Provisioning', icon: <Users size={14} />, to: ROUTES.ADMIN_USERS },
        { label: 'Responsibility Types', icon: <Briefcase size={14} />, to: ROUTES.ADMIN_RESPONSIBILITIES },
        { label: 'Workflow Templates', icon: <GitBranch size={14} />, to: ROUTES.ADMIN_WORKFLOWS },
        { label: 'Post Management', icon: <Building2 size={14} />, to: '/admin/posts' },
        { label: 'System Monitor', icon: <BarChart3 size={14} />, to: ROUTES.ADMIN_SYSTEM },
      ],
    });
  }

  return items;
}

// ─── Sub-Nav Item ─────────────────────────────────────────────
function SubNavItem({ item }: { item: NavItem }) {
  if (!item.to) return null;
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 pl-9 pr-3 py-2 rounded-md text-xs font-medium transition-all duration-150',
          isActive
            ? 'text-brand-300 bg-brand-900/50'
            : 'text-ink-muted hover:text-ink-secondary hover:bg-surface-3'
        )
      }
    >
      <span className="opacity-60">{item.icon}</span>
      {item.label}
    </NavLink>
  );
}

// ─── Nav Item Component ───────────────────────────────────────
function NavItemComponent({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const location = useLocation();
  const hasChildren = item.children && item.children.length > 0;

  // Auto-open if a child is active
  const isChildActive = item.children?.some((c) => c.to && location.pathname.startsWith(c.to.split('?')[0]));
  const [open, setOpen] = useState(isChildActive ?? false);

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'sidebar-nav-item w-full',
            isChildActive && 'text-ink-primary'
          )}
        >
          <span className="nav-icon flex-shrink-0">{item.icon}</span>
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </>
          )}
        </button>
        {open && !collapsed && (
          <div className="mt-0.5 space-y-0.5 animate-fade-in">
            {item.children!.map((child) => (
              <SubNavItem key={child.label} item={child} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!item.to) return null;

  return (
    <NavLink
      to={item.to}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'sidebar-nav-item',
          isActive && 'active',
          item.highlight && !collapsed && 'font-semibold'
        )
      }
    >
      <span className="nav-icon flex-shrink-0">{item.icon}</span>
      {!collapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {item.badge !== undefined && (
            <span
              className={cn(
                'text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                item.badgeColor || 'bg-brand-500'
              )}
            >
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
        </>
      )}
      {collapsed && item.badge !== undefined && (
        <span className={cn(
          'absolute top-1 right-1 w-2 h-2 rounded-full',
          item.badgeColor || 'bg-brand-500'
        )} />
      )}
    </NavLink>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────
interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  unreadCount: number;
  overdueCount: number;
}

export function Sidebar({ collapsed, onToggle, unreadCount, overdueCount }: SidebarProps) {
  const navItems = useNavItems(unreadCount, overdueCount);

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-surface-0 border-r border-surface-4 shadow-sidebar',
        'transition-all duration-250 ease-in-out flex-shrink-0',
        collapsed ? 'w-14' : 'w-60'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex items-center h-14 px-3 border-b border-surface-4 cursor-pointer flex-shrink-0',
          collapsed ? 'justify-center' : 'gap-3'
        )}
        onClick={onToggle}
      >
        <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center flex-shrink-0 shadow-glow-sm">
          <span className="text-white font-bold text-sm">IG</span>
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <div className="text-sm font-bold text-ink-primary leading-tight">IGWEMP</div>
            <div className="text-[9px] text-ink-muted leading-tight">Govt. of J&K</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
        {!collapsed && (
          <div className="sidebar-section-label">Work</div>
        )}

        {navItems.slice(0, 3).map((item) => (
          <NavItemComponent key={item.label} item={item} collapsed={collapsed} />
        ))}

        {!collapsed && <div className="sidebar-section-label mt-3">Governance</div>}
        <div className={collapsed ? 'mt-2' : ''}>
          {navItems.slice(3, 6).map((item) => (
            <NavItemComponent key={item.label} item={item} collapsed={collapsed} />
          ))}
        </div>

        {!collapsed && <div className="sidebar-section-label mt-3">Education</div>}
        <div className={collapsed ? 'mt-2' : ''}>
          {navItems.slice(6, 10).map((item) => (
            <NavItemComponent key={item.label} item={item} collapsed={collapsed} />
          ))}
        </div>

        {!collapsed && <div className="sidebar-section-label mt-3">Reporting</div>}
        <div className={collapsed ? 'mt-2' : ''}>
          {navItems.slice(10, 12).map((item) => (
            <NavItemComponent key={item.label} item={item} collapsed={collapsed} />
          ))}
        </div>

        {navItems.length > 12 && (
          <>
            {!collapsed && <div className="sidebar-section-label mt-3">System</div>}
            <div className={collapsed ? 'mt-2' : ''}>
              {navItems.slice(12).map((item) => (
                <NavItemComponent key={item.label} item={item} collapsed={collapsed} />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-surface-4 p-2 flex-shrink-0">
        {!collapsed ? (
          <div className="px-2 py-2">
            <div className="text-[9px] text-ink-disabled text-center">
              IGWEMP v1.0 · School Education Dept · J&K UT
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="System Online" />
          </div>
        )}
      </div>
    </aside>
  );
}
