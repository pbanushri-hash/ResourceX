import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Order } from '../../types';
import { ShoppingBag, Building2, MapPin, ArrowRight } from 'lucide-react';
import { OrderStatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';

export const AdminOrdersPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOrders()
      .then(data => setOrders(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Master Transaction & Order Ledger
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Audited log of all B2B commercial invoices and circular exchange fulfillment orders.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading transaction registry...</div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders found."
          description="There are currently no commercial purchase orders recorded across the marketplace."
          icon={ShoppingBag}
        />
      ) : (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-2">Order ID</th>
                  <th className="pb-3 px-2">Buyer Enterprise</th>
                  <th className="pb-3 px-2">Supplier Enterprise</th>
                  <th className="pb-3 px-2">Lots</th>
                  <th className="pb-3 px-2">Amount</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-2 font-mono font-bold text-slate-900">
                      PO #{o.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-3 px-2 font-semibold text-slate-800">
                      {o.buyerCompanyName}
                    </td>
                    <td className="py-3 px-2 font-semibold text-slate-800">
                      {o.sellerCompanyName}
                    </td>
                    <td className="py-3 px-2 text-slate-500">
                      {o.items.length} item(s)
                    </td>
                    <td className="py-3 px-2 font-extrabold text-slate-900">
                      ₹{o.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-2">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="py-3 px-2 text-right text-slate-400 text-[11px]">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
