// ============================================================
// IGWEMP — TopBar
// Search, Notifications, Delegation Banner, Profile
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, ChevronDown, LogOut, User, Settings,
  Zap, X, ShieldAlert, Menu,
} from 'lucide-react';
import { cn, formatRelativeTime, initials } from '../../lib/utils';
import { ROUTES } from '../../lib/constants';
import { useAuth } from '../../core/auth/AuthContext';
import type { NotificationDelivery, DelegationOfAuthority } from '../../types';

// ─── Notification Bell ────────────────────────────────────────
function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: NotificationDelivery[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const priorityIcon: Record<string, string> = {
    URGENT: '🔴',
    HIGH: '🟡',
    NORMAL: '🟢',
    LOW: '⚪',
  };

  return (
    <div className="relative">
      <button
        id="notification-bell-btn"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'btn-icon relative transition-all duration-150',
          open ? 'bg-surface-3 text-ink-primary' : 'text-ink-secondary hover:bg-surface-3 hover:text-ink-primary'
        )}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-brand-500 text-white text-[10px] font-bold
                           w-4 h-4 rounded-full flex items-center justify-center animate-pulse-soft">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 w-80 bg-surface-2 border border-surface-4 rounded-lg shadow-card-hover z-40 animate-slide-up overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-4">
              <span className="text-sm font-semibold text-ink-primary">Notifications</span>
              <button className="text-xs text-brand-400 hover:text-brand-300">Mark all read</button>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-surface-4/40">
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-ink-muted">No notifications</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.delivery_id}
                    className={cn(
                      'px-4 py-3 cursor-pointer hover:bg-surface-3/50 transition-colors',
                      !n.read_at && 'bg-brand-950/30'
                    )}
                    onClick={() => {
                      if (n.action_url) navigate(n.action_url);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-sm mt-0.5">{priorityIcon[n.priority]}</span>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-xs font-medium leading-snug', !n.read_at ? 'text-ink-primary' : 'text-ink-secondary')}>
                          {n.title}
                        </p>
                        <p className="text-[11px] text-ink-muted mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-[10px] text-ink-disabled mt-1">
                          {formatRelativeTime(new Date(n.created_at))}
                        </p>
                      </div>
                      {!n.read_at && (
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-surface-4 px-4 py-2.5">
              <button
                className="text-xs text-brand-400 hover:text-brand-300 w-full text-center"
                onClick={() => { navigate(ROUTES.NOTIFICATIONS); setOpen(false); }}
              >
                View all notifications →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── User Menu ────────────────────────────────────────────────
function UserMenu() {
  const { user, primaryRole, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const displayName = user?.party?.display_name || user?.username || 'User';
  const email = user?.party?.email || '';
  const roleLabel = primaryRole?.role_code?.replace('_', ' ') || '';

  return (
    <div className="relative">
      <button
        id="user-menu-btn"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-surface-3 transition-colors duration-150 cursor-pointer"
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {initials(displayName)}
        </div>
        <div className="hidden md:block text-left min-w-0">
          <div className="text-xs font-medium text-ink-primary truncate max-w-[120px]">{displayName}</div>
          <div className="text-[10px] text-ink-muted truncate">{roleLabel}</div>
        </div>
        <ChevronDown size={12} className="text-ink-muted flex-shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 w-56 bg-surface-2 border border-surface-4 rounded-lg shadow-card-hover z-40 animate-slide-up overflow-hidden">
            {/* Profile Summary */}
            <div className="px-4 py-3 border-b border-surface-4">
              <div className="text-sm font-semibold text-ink-primary">{displayName}</div>
              <div className="text-xs text-ink-muted mt-0.5">{email}</div>
              <div className="text-[10px] text-brand-400 mt-1">{roleLabel}</div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-ink-secondary hover:bg-surface-3 hover:text-ink-primary transition-colors"
                onClick={() => { navigate(ROUTES.EMPLOYEES); setOpen(false); }}
              >
                <User size={14} /> My Profile
              </button>
              <button
                className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-ink-secondary hover:bg-surface-3 hover:text-ink-primary transition-colors"
                onClick={() => { navigate(ROUTES.ADMIN); setOpen(false); }}
              >
                <Settings size={14} /> Settings
              </button>
            </div>

            <div className="border-t border-surface-4 py-1">
              <button
                id="sign-out-btn"
                className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-950/40 transition-colors"
                onClick={() => { signOut(); setOpen(false); }}
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Delegation Banner [ADJ-04] ───────────────────────────────
function DelegationBannerStrip({ delegation }: { delegation: DelegationOfAuthority | null }) {
  const [dismissed, setDismissed] = useState(false);
  if (!delegation || dismissed) return null;

  const delegatorName = delegation.delegator?.party?.display_name || 'Superior Officer';
  const expiresOn = delegation.effective_to
    ? new Date(delegation.effective_to).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'N/A';

  return (
    <div className="delegation-banner" id="delegation-active-banner">
      <Zap size={14} className="text-brand-400 flex-shrink-0" />
      <span className="flex-1 text-xs">
        <span className="font-semibold text-brand-300">Acting on behalf of:</span>{' '}
        {delegatorName} · Authority: {delegation.delegation_type.replace('_', ' ')} · Expires: {expiresOn}
      </span>
      <button
        className="text-ink-muted hover:text-ink-secondary flex-shrink-0"
        onClick={() => setDismissed(true)}
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ─── TopBar ───────────────────────────────────────────────────
interface TopBarProps {
  notifications: NotificationDelivery[];
  unreadCount: number;
  activeDelegation: DelegationOfAuthority | null;
  onMenuToggle: () => void;
}

export function TopBar({ notifications, unreadCount, activeDelegation, onMenuToggle }: TopBarProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex-shrink-0">
      {/* Delegation Banner */}
      <DelegationBannerStrip delegation={activeDelegation} />

      {/* Main TopBar */}
      <header className="h-14 bg-surface-1 border-b border-surface-4 flex items-center gap-3 px-4">
        {/* Mobile Menu Toggle */}
        <button
          className="btn-icon text-ink-secondary md:hidden"
          onClick={onMenuToggle}
        >
          <Menu size={17} />
        </button>

        {/* Breadcrumb — placeholder */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-ink-muted flex-shrink-0">
          <ShieldAlert size={13} className="text-brand-500" />
          <span>UT Administration</span>
          <span>›</span>
          <span>School Education</span>
          <span>›</span>
          <span className="text-ink-secondary">CEO Anantnag</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Global Search */}
        <div className={cn(
          'flex items-center gap-2 bg-surface-3 border rounded-lg px-3 py-1.5 transition-all duration-200',
          searchFocused ? 'border-brand-600 w-64 shadow-glow-sm' : 'border-surface-4 w-44'
        )}>
          <Search size={14} className="text-ink-muted flex-shrink-0" />
          <input
            id="global-search-input"
            type="text"
            placeholder="Search… (⌘K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="bg-transparent text-xs text-ink-primary placeholder:text-ink-disabled outline-none flex-1 min-w-0"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-ink-muted hover:text-ink-secondary">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Notification Bell */}
        <NotificationBell notifications={notifications} unreadCount={unreadCount} />

        {/* User Menu */}
        <UserMenu />
      </header>
    </div>
  );
}
