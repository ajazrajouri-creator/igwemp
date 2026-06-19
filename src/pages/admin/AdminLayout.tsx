import { Outlet, NavLink } from 'react-router-dom';
import { Building2, Network, Snail as Structure, Folders, Database, Users, Shield,  Link, Award, ArrowRightLeft } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/admin/organizations', icon: <Building2 size={16} />, label: 'Organizations' },
  { to: '/admin/hierarchy', icon: <Network size={16} />, label: 'Hierarchy Builder' },
  { to: '/admin/offices', icon: <Structure size={16} />, label: 'Offices' },
  { to: '/admin/sections', icon: <Folders size={16} />, label: 'Sections' },
  { to: '/admin/master-data', icon: <Database size={16} />, label: 'Master Data' },
  { to: '/admin/users', icon: <Users size={16} />, label: 'Users & Accounts' },
  { to: '/admin/policies', icon: <Shield size={16} />, label: 'Roles & Policies' },
  { to: '/admin/assignments', icon: <Link size={16} />, label: 'Role Assignments' },
  { to: '/admin/delegations', icon: <ArrowRightLeft size={16} />, label: 'Delegations' },
  { to: '/admin/responsibilities', icon: <Award size={16} />, label: 'Responsibilities' },
];

export function AdminLayout() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Admin Sidebar */}
      <aside className="w-64 border-r border-surface-4 bg-surface-1 p-4 flex flex-col gap-1 overflow-y-auto">
        <h2 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2 px-3">
          Admin Console
        </h2>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand/10 text-brand'
                  : 'text-ink-secondary hover:bg-surface-3 hover:text-ink-primary'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </aside>

      {/* Admin Content Area */}
      <main className="flex-1 bg-surface-0 overflow-y-auto relative p-6">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
