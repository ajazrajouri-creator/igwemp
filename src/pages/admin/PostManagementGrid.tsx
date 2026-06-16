// ============================================================
// IGWEMP — Post Management Grid
// Admin UI to manage raw public.posts records
// ============================================================

import React, { useState } from 'react';
import { Database, Plus, Search, Filter, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';

// Mock Data representing `public.posts`
const MOCK_POSTS = [
  { id: 'post-1', post_number: '1', designation: 'Master', office: 'BHS Peeri', status: 'ACTIVE', effective_from: '2026-06-01', created_by: 'Admin' },
  { id: 'post-2', post_number: '2', designation: 'Master', office: 'BHS Peeri', status: 'ABOLISHED', effective_from: '2026-06-01', created_by: 'Admin' },
  { id: 'post-3', post_number: '3', designation: 'Teacher', office: 'BHS Peeri', status: 'ACTIVE', effective_from: '2026-06-01', created_by: 'System' },
  { id: 'post-4', post_number: '1', designation: 'Principal', office: 'HSS Rajouri', status: 'ACTIVE', effective_from: '2026-06-01', created_by: 'Admin' },
  { id: 'post-5', post_number: '1', designation: 'Headmaster', office: 'GHS Koteranka', status: 'ACTIVE', effective_from: '2026-06-01', created_by: 'Admin' },
];

export function PostManagementGrid() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ABOLISHED'>('ALL');

  const filtered = MOCK_POSTS.filter(post => {
    if (statusFilter !== 'ALL' && post.status !== statusFilter) return false;
    if (searchQuery && !post.office.toLowerCase().includes(searchQuery.toLowerCase()) && !post.designation.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5 animate-enter max-w-7xl mx-auto">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Database className="text-brand-400" />
            <span className="text-gradient-brand">Physical Posts Repository</span>
          </h1>
          <p className="page-subtitle">
            Direct management of `public.posts` rows. 1 Row = 1 Sanctioned Physical Post.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary btn-sm gap-2">
            <Plus size={14} /> Manually Create Post
          </button>
        </div>
      </div>

      <div className="bg-orange-950/20 border border-orange-900/30 rounded-xl p-4 flex gap-3 text-sm">
        <AlertTriangle className="text-orange-400 shrink-0" size={18} />
        <div className="text-orange-200">
          <strong>Direct Modification Warning:</strong> Posts are typically generated via the Census mechanism. Manually creating or abolishing posts here bypasses the census approval workflow.
        </div>
      </div>

      {/* Grid Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center p-3 rounded-t-xl bg-surface-2 border-b border-surface-4 mt-4">
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input 
            type="text" 
            placeholder="Search by office or designation..." 
            className="input w-full pl-9 py-1.5 text-sm"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="input py-1.5 text-sm"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="ABOLISHED">Abolished Only</option>
          </select>
          <button className="btn-ghost btn-sm gap-2 text-ink-muted hover:text-ink-primary">
            <Filter size={14} /> Advanced
          </button>
        </div>
      </div>

      {/* Data Grid */}
      <div className="card overflow-hidden mt-0 rounded-t-none border-t-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-2/30 text-xs uppercase text-ink-muted border-b border-surface-4">
              <tr>
                <th className="px-5 py-3 font-medium">Post ID</th>
                <th className="px-5 py-3 font-medium">Post #</th>
                <th className="px-5 py-3 font-medium">Office</th>
                <th className="px-5 py-3 font-medium">Designation</th>
                <th className="px-5 py-3 font-medium">Effective From</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-4">
              {filtered.map(post => (
                <tr key={post.id} className="hover:bg-surface-3/30 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-ink-muted">{post.id}</td>
                  <td className="px-5 py-3 font-medium text-ink-primary">{post.post_number}</td>
                  <td className="px-5 py-3 text-ink-secondary">{post.office}</td>
                  <td className="px-5 py-3 text-ink-secondary">{post.designation}</td>
                  <td className="px-5 py-3 text-ink-muted">{formatDate(post.effective_from, 'short')}</td>
                  <td className="px-5 py-3">
                    <span className={cn(
                      'badge text-[10px]',
                      post.status === 'ACTIVE' ? 'bg-green-950/40 text-green-400 border-green-900/50' :
                      'bg-red-950/40 text-red-400 border-red-900/50'
                    )}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button className="text-ink-muted hover:text-ink-primary transition-colors p-1 rounded-md hover:bg-surface-3">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-ink-muted">
                    No posts found in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
