// ============================================================
// IGWEMP — Vacancy Dashboard
// Map v_office_vacancy_dashboard to a visual React chart/table
// ============================================================

import React, { useState } from 'react';
import { BarChart3, Download, Filter, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';

// Mock Data representing `v_office_vacancy_dashboard`
const MOCK_VACANCY_DATA = [
  { office_id: 'off-001', office_name: 'BHS Peeri', designation: 'Master', sanctioned: 4, active_postings: 3, vacancies: 1, vacancy_percentage: 25 },
  { office_id: 'off-001', office_name: 'BHS Peeri', designation: 'Teacher', sanctioned: 10, active_postings: 10, vacancies: 0, vacancy_percentage: 0 },
  { office_id: 'off-002', office_name: 'GHS Koteranka', designation: 'Master', sanctioned: 5, active_postings: 2, vacancies: 3, vacancy_percentage: 60 },
  { office_id: 'off-002', office_name: 'GHS Koteranka', designation: 'Teacher', sanctioned: 8, active_postings: 8, vacancies: 0, vacancy_percentage: 0 },
  { office_id: 'off-003', office_name: 'HSS Rajouri', designation: 'Lecturer', sanctioned: 15, active_postings: 10, vacancies: 5, vacancy_percentage: 33.3 },
  { office_id: 'off-003', office_name: 'HSS Rajouri', designation: 'Teacher', sanctioned: 20, active_postings: 15, vacancies: 5, vacancy_percentage: 25 },
];

export function VacancyDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filtered = MOCK_VACANCY_DATA.filter(row => 
    !searchQuery || row.office_name.toLowerCase().includes(searchQuery.toLowerCase()) || row.designation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Aggregate by designation for the chart
  const chartData = Object.values(filtered.reduce((acc, row) => {
    if (!acc[row.designation]) {
      acc[row.designation] = { name: row.designation, sanctioned: 0, posted: 0, vacant: 0 };
    }
    acc[row.designation].sanctioned += row.sanctioned;
    acc[row.designation].posted += row.active_postings;
    acc[row.designation].vacant += row.vacancies;
    return acc;
  }, {} as Record<string, any>));

  const totalSanctioned = chartData.reduce((sum, item) => sum + item.sanctioned, 0);
  const totalVacant = chartData.reduce((sum, item) => sum + item.vacant, 0);
  const overallPercentage = totalSanctioned > 0 ? ((totalVacant / totalSanctioned) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-5 animate-enter max-w-6xl mx-auto">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <BarChart3 className="text-brand-400" />
            <span className="text-gradient-brand">Vacancy Dashboard</span>
          </h1>
          <p className="page-subtitle">
            Real-time tracking of sanctioned posts vs active occupancies.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost btn-sm gap-2">
            <Filter size={14} /> Filter
          </button>
          <button className="btn-secondary btn-sm gap-2">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-sm text-ink-muted">Total Sanctioned Posts</div>
          <div className="text-3xl font-bold text-ink-primary mt-1">{totalSanctioned}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-ink-muted">Total Vacancies</div>
          <div className="text-3xl font-bold text-red-400 mt-1">{totalVacant}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-ink-muted">Overall Vacancy Rate</div>
          <div className="text-3xl font-bold text-orange-400 mt-1">{overallPercentage}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart */}
        <div className="card p-5 lg:col-span-2 flex flex-col">
          <h2 className="text-sm font-semibold text-ink-primary mb-6">Staffing Overview by Designation</h2>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3d" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#13151f', borderColor: '#2a2e3d', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="posted" name="Active Postings" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                <Bar dataKey="vacant" name="Vacancies" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data Grid */}
        <div className="card lg:col-span-1 flex flex-col">
          <div className="p-4 border-b border-surface-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input 
                type="text" 
                placeholder="Search offices..." 
                className="input w-full pl-9 py-1.5 text-sm"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px]">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2/50 text-ink-muted text-xs sticky top-0 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-2 font-medium">Office</th>
                  <th className="px-4 py-2 font-medium">Desig</th>
                  <th className="px-4 py-2 font-medium text-right">Vacant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-4">
                {filtered.map((row, i) => (
                  <tr key={i} className="hover:bg-surface-3/30">
                    <td className="px-4 py-3 font-medium text-ink-primary truncate max-w-[120px]">{row.office_name}</td>
                    <td className="px-4 py-3 text-ink-secondary">{row.designation}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "font-bold",
                        row.vacancy_percentage >= 50 ? "text-red-400" :
                        row.vacancy_percentage > 0 ? "text-orange-400" : "text-green-400"
                      )}>
                        {row.vacancies} <span className="text-[10px] font-normal opacity-50">/ {row.sanctioned}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
