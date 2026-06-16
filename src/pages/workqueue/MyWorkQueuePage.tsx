// ============================================================
// IGWEMP — My Work Queue Page [ADJ-06 PRIMARY LANDING]
// Work Queue First Experience — personal queue with priority lanes
// ============================================================

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Clock, Calendar, ListTodo, CheckCircle2,
  Filter, RefreshCw, ChevronDown, ChevronRight, ExternalLink,
  Zap, ArrowRight, MoreHorizontal, Inbox, TrendingUp,
  FileText, CheckSquare, ClipboardCheck, Search, X,
} from 'lucide-react';
import { cn, formatDate, getDaysOverdue, getDaysUntilDue } from '../../lib/utils';
import { PRIORITY_CONFIG, CASE_STATUS_CONFIG } from '../../lib/constants';
import { MOCK_WORK_QUEUE_ITEMS } from '../../lib/mockData';
import { useAuth } from '../../core/auth/AuthContext';
import type { WorkQueueItem, WorkQueuePriority, WorkQueueItemType } from '../../types';

// ─── Stat Card ────────────────────────────────────────────────
function QueueStatCard({ label, value, color, icon }: {
  label: string; value: number; color: string; icon: React.ReactNode;
}) {
  return (
    <div className="stat-card group cursor-default">
      <div className="flex items-center justify-between">
        <span className="text-ink-muted">{icon}</span>
        <span className={cn('stat-value', color)}>{value}</span>
      </div>
      <span className="stat-label mt-1">{label}</span>
    </div>
  );
}

// ─── Work Item Card ───────────────────────────────────────────
const ITEM_TYPE_ICONS: Record<WorkQueueItemType, React.ReactNode> = {
  CASE: <FileText size={14} />,
  APPROVAL: <CheckSquare size={14} />,
  ATR: <ClipboardCheck size={14} />,
  VERIFICATION: <CheckCircle2 size={14} />,
  INSPECTION: <Search size={14} />,
  INFORMATION: <Inbox size={14} />,
};

const ITEM_TYPE_LABELS: Record<WorkQueueItemType, string> = {
  CASE: 'Case',
  APPROVAL: 'Approval Required',
  ATR: 'ATR',
  VERIFICATION: 'Verification',
  INSPECTION: 'Inspection',
  INFORMATION: 'Information',
};

function WorkItemCard({ item, onOpen }: { item: WorkQueueItem; onOpen: (id: string) => void }) {
  const cfg = PRIORITY_CONFIG[item.priority];
  const statusCfg = CASE_STATUS_CONFIG[item.case?.status || 'OPEN'];
  const daysOverdue = getDaysOverdue(item.due_at);
  const daysUntil = getDaysUntilDue(item.due_at);

  const caseTypeLabel = item.case?.case_type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Case';

  return (
    <div
      id={`work-item-${item.item_id}`}
      className="work-item group"
      onClick={() => onOpen(item.case_id)}
    >
      {/* Type Icon */}
      <div className={cn('p-2 rounded-md flex-shrink-0', cfg.badge.split(' ').slice(0,1).join(' '), 'bg-surface-3')}>
        <span className={cfg.color}>
          {ITEM_TYPE_ICONS[item.item_type]}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-ink-primary truncate">{caseTypeLabel}</span>
              <span className={cn('badge text-[10px]', statusCfg?.bg, statusCfg?.color, 'border-transparent')}>
                {statusCfg?.label}
              </span>
              <span className={cn('badge text-[10px]', cfg.badge)}>
                {ITEM_TYPE_LABELS[item.item_type]}
              </span>
            </div>
            <div className="text-xs text-ink-muted mt-0.5">
              Case #{item.case_id.slice(-6).toUpperCase()}
              {item.case?.order_id && ` · Order #${item.case.order_id.slice(-6).toUpperCase()}`}
            </div>
          </div>

          {/* Deadline */}
          <div className={cn('text-right flex-shrink-0', cfg.color)}>
            {item.priority === 'OVERDUE' && daysOverdue !== null && (
              <div className="text-xs font-semibold">{daysOverdue}d overdue</div>
            )}
            {item.priority === 'DUE_TODAY' && (
              <div className="text-xs font-semibold">Due today</div>
            )}
            {(item.priority === 'DUE_THIS_WEEK' || item.priority === 'UPCOMING') && daysUntil !== null && (
              <div className="text-xs font-medium">Due in {daysUntil}d</div>
            )}
            {item.priority === 'NO_DEADLINE' && (
              <div className="text-xs text-ink-muted">No deadline</div>
            )}
            {item.due_at && (
              <div className="text-[10px] text-ink-disabled mt-0.5">
                {formatDate(item.due_at, 'short')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Arrow */}
      <ArrowRight
        size={14}
        className="text-ink-disabled group-hover:text-brand-400 flex-shrink-0 transition-colors"
      />
    </div>
  );
}

// ─── Priority Lane ────────────────────────────────────────────
const LANE_CONFIGS: { priority: WorkQueuePriority; icon: React.ReactNode; headerClass: string }[] = [
  { priority: 'OVERDUE', icon: <AlertTriangle size={14} />, headerClass: 'text-red-400 bg-red-950/40' },
  { priority: 'DUE_TODAY', icon: <Clock size={14} />, headerClass: 'text-orange-400 bg-orange-950/30' },
  { priority: 'DUE_THIS_WEEK', icon: <Calendar size={14} />, headerClass: 'text-yellow-400 bg-yellow-950/30' },
  { priority: 'UPCOMING', icon: <ListTodo size={14} />, headerClass: 'text-blue-400 bg-blue-950/30' },
  { priority: 'NO_DEADLINE', icon: <Inbox size={14} />, headerClass: 'text-slate-400 bg-slate-950/30' },
];

function PriorityLane({
  priority,
  items,
  onOpen,
  defaultExpanded = true,
}: {
  priority: WorkQueuePriority;
  items: WorkQueueItem[];
  onOpen: (id: string) => void;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  if (items.length === 0) return null;

  const cfg = PRIORITY_CONFIG[priority];
  const lane = LANE_CONFIGS.find((l) => l.priority === priority)!;

  return (
    <div className={cn('priority-lane', `priority-lane-${priority.toLowerCase().replace('_', '-')}`)}>
      {/* Lane Header */}
      <button
        id={`priority-lane-${priority.toLowerCase()}`}
        className={cn('priority-lane-header w-full', lane.headerClass)}
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-2">
          {lane.icon}
          <span>{cfg.label}</span>
          <span className="text-xs font-normal opacity-70">({items.length})</span>
        </div>
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* Lane Items */}
      {expanded && (
        <div className="animate-fade-in">
          {items.map((item) => (
            <WorkItemCard key={item.item_id} item={item} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export function MyWorkQueuePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<WorkQueueItemType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const displayName = user?.party?.display_name || 'Officer';

  // Filter items
  const filteredItems = useMemo(() => {
    let items = MOCK_WORK_QUEUE_ITEMS;
    if (filterType !== 'ALL') {
      items = items.filter((i) => i.item_type === filterType);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (i) =>
          i.case_id.toLowerCase().includes(q) ||
          i.case?.case_type.toLowerCase().includes(q) ||
          i.case?.order_id?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [filterType, searchQuery]);

  // Group by priority
  const groupedItems = useMemo(() => {
    const groups: Partial<Record<WorkQueuePriority, WorkQueueItem[]>> = {};
    for (const item of filteredItems) {
      const key = item.priority as WorkQueuePriority;
      if (!groups[key]) groups[key] = [];
      groups[key]!.push(item);
    }
    return groups;
  }, [filteredItems]);

  // Stats
  const stats = {
    overdue: MOCK_WORK_QUEUE_ITEMS.filter((i) => i.priority === 'OVERDUE').length,
    dueToday: MOCK_WORK_QUEUE_ITEMS.filter((i) => i.priority === 'DUE_TODAY').length,
    pending: MOCK_WORK_QUEUE_ITEMS.filter((i) => ['IN_PROGRESS', 'UNASSIGNED'].includes(i.status)).length,
    pendingApproval: MOCK_WORK_QUEUE_ITEMS.filter((i) => i.status === 'SUBMITTED').length,
  };

  const handleOpen = (caseId: string) => {
    navigate(`/cases/${caseId}`);
  };

  const priorityOrder: WorkQueuePriority[] = ['OVERDUE', 'DUE_TODAY', 'DUE_THIS_WEEK', 'UPCOMING', 'NO_DEADLINE'];

  return (
    <div className="space-y-5 animate-enter">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <span className="text-gradient-brand">My Work Queue</span>
          </h1>
          <p className="page-subtitle">
            Welcome, <span className="text-ink-secondary font-medium">{displayName}</span> ·{' '}
            <span className="text-ink-muted">CEO Office, Anantnag</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button id="refresh-queue-btn" className="btn-ghost btn-sm gap-1.5">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QueueStatCard label="Overdue" value={stats.overdue} color="text-red-400" icon={<AlertTriangle size={15} />} />
        <QueueStatCard label="Due Today" value={stats.dueToday} color="text-orange-400" icon={<Clock size={15} />} />
        <QueueStatCard label="In Progress" value={stats.pending} color="text-yellow-400" icon={<TrendingUp size={15} />} />
        <QueueStatCard label="Pending Approval" value={stats.pendingApproval} color="text-brand-400" icon={<CheckSquare size={15} />} />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-1 p-1 bg-surface-3 rounded-lg overflow-x-auto hide-scrollbar w-full sm:w-auto">
          {(['ALL', 'CASE', 'APPROVAL', 'ATR', 'VERIFICATION'] as const).map((type) => (
            <button
              key={type}
              id={`filter-${type.toLowerCase()}`}
              onClick={() => setFilterType(type)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-all',
                filterType === type
                  ? 'bg-surface-1 text-ink-primary shadow-card'
                  : 'text-ink-muted hover:text-ink-secondary'
              )}
            >
              {type === 'ALL' ? 'All Items' : type.charAt(0) + type.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-surface-3 border border-surface-4 rounded-lg px-3 py-2 sm:py-1.5 w-full sm:flex-1 sm:max-w-xs">
          <Search size={13} className="text-ink-muted flex-shrink-0" />
          <input
            type="text"
            placeholder="Search queue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-ink-primary placeholder:text-ink-disabled outline-none flex-1"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-ink-muted hover:text-ink-secondary">
              <X size={11} />
            </button>
          )}
        </div>

        <div className="flex-1" />
        <span className="text-xs text-ink-muted">
          {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Priority Lanes */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">📭</span>
            <div className="empty-state-title">No items in queue</div>
            <div className="empty-state-desc">
              {searchQuery ? 'No items match your search.' : 'Your work queue is clear. Great work!'}
            </div>
          </div>
        ) : (
          priorityOrder.map((priority) =>
            groupedItems[priority]?.length ? (
              <PriorityLane
                key={priority}
                priority={priority}
                items={groupedItems[priority]!}
                onOpen={handleOpen}
                defaultExpanded={priority !== 'UPCOMING' && priority !== 'NO_DEADLINE'}
              />
            ) : null
          )
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectedItems.size > 0 && (
        <div className="fixed bottom-20 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3
                        bg-surface-2 border border-surface-4 rounded-xl shadow-card-hover animate-slide-up z-50
                        w-[calc(100%-32px)] sm:w-auto overflow-x-auto hide-scrollbar whitespace-nowrap">
          <span className="text-sm text-ink-secondary flex-shrink-0">{selectedItems.size} selected</span>
          <div className="w-px h-4 bg-surface-5 flex-shrink-0" />
          <button className="btn-primary btn-sm flex-shrink-0">Approve Selected</button>
          <button className="btn-secondary btn-sm flex-shrink-0">Return Selected</button>
          <button className="btn-ghost btn-sm flex-shrink-0">Export</button>
          <button
            className="btn-ghost btn-sm text-ink-muted flex-shrink-0"
            onClick={() => setSelectedItems(new Set())}
          >
            <X size={13} /> Clear
          </button>
        </div>
      )}
    </div>
  );
}
