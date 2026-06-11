import React from 'react';
import { useOrders } from '../../hooks/queries/useOrders';
import { FileText, Plus, Search, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function OrdersListPage() {
  const { data: orders, isLoading } = useOrders();
  const navigate = useNavigate();

  if (isLoading) return <div className="p-4 sm:p-8 text-ink-muted">Loading orders...</div>;

  return (
    <div className="space-y-4 sm:space-y-6 animate-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink-primary">Orders & Circulars</h1>
          <p className="text-xs sm:text-sm text-ink-muted">Manage formal government directives and notifications.</p>
        </div>
        <button 
          className="btn-primary btn-sm w-full sm:w-auto flex justify-center"
          onClick={() => navigate('/orders/create')}
        >
          <Plus size={16} /> Draft Order
        </button>
      </div>

      <div className="flex gap-4 mb-4 sm:mb-6">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-disabled" size={16} />
          <input 
            type="text" 
            placeholder="Search by order number or type..." 
            className="w-full pl-9 pr-4 py-2 bg-surface-2 border border-surface-4 rounded-lg focus:outline-none focus:border-brand/50 text-sm"
          />
        </div>
      </div>

      <div className="card p-0 overflow-hidden border-surface-4">
        {/* Desktop Table */}
        <table className="hidden sm:table w-full text-left text-sm">
          <thead className="bg-surface-2 border-b border-surface-4 text-ink-secondary">
            <tr>
              <th className="px-6 py-3 font-medium">Order Number</th>
              <th className="px-6 py-3 font-medium">Type</th>
              <th className="px-6 py-3 font-medium">Issued By</th>
              <th className="px-6 py-3 font-medium">Issue Date</th>
              <th className="px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-4">
            {orders?.map(order => (
              <tr key={order.id} className="hover:bg-surface-2/50 transition-colors cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                <td className="px-6 py-4">
                  <div className="font-bold text-ink-primary flex items-center gap-2">
                    <FileText size={16} className="text-brand-muted" />
                    {order.order_number}
                  </div>
                </td>
                <td className="px-6 py-4 text-ink-secondary">{order.order_type?.name}</td>
                <td className="px-6 py-4">
                  <div className="text-ink-primary font-medium">{order.issuing_office?.office_name}</div>
                  <div className="text-[10px] text-ink-muted uppercase">{order.issuing_user?.username}</div>
                </td>
                <td className="px-6 py-4 text-ink-secondary">{new Date(order.issue_date).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                    order.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-500' :
                    order.status === 'DRAFT' ? 'bg-yellow-500/10 text-yellow-600' :
                    'bg-surface-4 text-ink-muted'
                  }`}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-ink-muted">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Mobile Card List */}
        <div className="sm:hidden flex flex-col divide-y divide-surface-4">
          {orders?.map(order => (
            <div 
              key={order.id} 
              className="p-4 active:bg-surface-2 transition-colors cursor-pointer"
              onClick={() => navigate(`/orders/${order.id}`)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 font-bold text-ink-primary text-sm">
                  <FileText size={14} className="text-brand-muted" />
                  {order.order_number}
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                  order.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-500' :
                  order.status === 'DRAFT' ? 'bg-yellow-500/10 text-yellow-600' :
                  'bg-surface-4 text-ink-muted'
                }`}>
                  {order.status}
                </span>
              </div>
              
              <div className="text-xs text-ink-secondary mb-3">
                {order.order_type?.name}
              </div>

              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-xs text-ink-primary font-medium">{order.issuing_office?.office_name}</span>
                  <span className="text-[10px] text-ink-muted">{new Date(order.issue_date).toLocaleDateString()}</span>
                </div>
                <ChevronRight size={16} className="text-ink-disabled" />
              </div>
            </div>
          ))}
          {(!orders || orders.length === 0) && (
            <div className="p-8 text-center text-ink-muted text-sm">
              No orders found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
