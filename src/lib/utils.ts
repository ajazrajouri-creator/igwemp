// ============================================================
// IGWEMP — Utility Functions
// ============================================================

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { WorkQueuePriority } from '../types';

// ─── Tailwind Class Merging ───────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date Utilities ───────────────────────────────────────────
export function formatDate(date: string | Date | null, format: 'short' | 'long' | 'relative' = 'short'): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;

  if (format === 'relative') {
    return formatRelativeTime(d);
  }

  const options: Intl.DateTimeFormatOptions =
    format === 'long'
      ? { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { day: '2-digit', month: 'short', year: 'numeric' };

  return d.toLocaleDateString('en-IN', options);
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(date, 'short');
}

export function getWorkQueuePriority(dueAt: string | null): WorkQueuePriority {
  if (!dueAt) return 'NO_DEADLINE';
  const now = new Date();
  const due = new Date(dueAt);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffMs < 0) return 'OVERDUE';
  if (diffHours <= 24) return 'DUE_TODAY';
  if (diffHours <= 168) return 'DUE_THIS_WEEK'; // 7 days
  return 'UPCOMING';
}

export function getDaysOverdue(dueAt: string | null): number | null {
  if (!dueAt) return null;
  const due = new Date(dueAt);
  const now = new Date();
  const diffMs = now.getTime() - due.getTime();
  if (diffMs <= 0) return null;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function getDaysUntilDue(dueAt: string | null): number | null {
  if (!dueAt) return null;
  const due = new Date(dueAt);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  if (diffMs <= 0) return null;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// ─── String Utilities ─────────────────────────────────────────
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength - 3)}...`;
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0].toUpperCase())
    .slice(0, 2)
    .join('');
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ─── Crypto Utilities ─────────────────────────────────────────
export async function sha256(content: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ─── Validation Helpers ───────────────────────────────────────
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export function isValidAadhaar(aadhaar: string): boolean {
  return /^\d{12}$/.test(aadhaar);
}

// ─── Array Utilities ──────────────────────────────────────────
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce(
    (groups, item) => {
      const groupKey = String(item[key]);
      return { ...groups, [groupKey]: [...(groups[groupKey] || []), item] };
    },
    {} as Record<string, T[]>
  );
}

// ─── Tenant Utilities [ADJ-03] ────────────────────────────────
export function getTenantFromJWT(jwt: string): string | null {
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1]));
    return payload.tenant_id || null;
  } catch {
    return null;
  }
}
