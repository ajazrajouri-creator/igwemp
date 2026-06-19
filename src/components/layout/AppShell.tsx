// ============================================================
// IGWEMP — App Shell
// Main layout: Sidebar + TopBar + Content area
// ============================================================

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MOCK_NOTIFICATIONS, MOCK_ACTIVE_DELEGATION, MOCK_WORK_QUEUE_ITEMS } from '../../lib/mockData';
import { cn } from '../../lib/utils';

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Compute stats from mock data
  const unreadNotifications = MOCK_NOTIFICATIONS.filter((n) => !n.read_at);
  const overdueItems = MOCK_WORK_QUEUE_ITEMS.filter((i) => i.priority === 'OVERDUE');

  return (
    <div className="flex h-screen overflow-hidden bg-surface-1">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
        unreadCount={unreadNotifications.length}
        overdueCount={overdueItems.length}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* TopBar */}
        <TopBar
          notifications={MOCK_NOTIFICATIONS}
          unreadCount={unreadNotifications.length}
          activeDelegation={MOCK_ACTIVE_DELEGATION}
          onMenuToggle={() => setSidebarCollapsed((c) => !c)}
        />

        {/* Page Content */}
        <main
          id="main-content"
          className={cn(
            'flex-1 overflow-y-auto overflow-x-hidden',
            'bg-gradient-to-b from-surface-1 to-surface-0'
          )}
        >
          <div className="max-w-screen-2xl mx-auto p-6 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
