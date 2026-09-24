import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Order } from '../../types';
import { ShoppingBag, Truck, CheckCircle2, Clock, MapPin, Building2 } from 'lucide-react';
import { OrderStatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';

export const BuyerOrdersPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBuyerOrders()
      .then(data => setOrders(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Procurement Orders & Invoices
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Track fulfillment status, supplier dispatch, and circular diversion logs.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading order ledger...</div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders found."
          description="Your procurement history is empty. When you purchase surplus materials or equipment, your orders and invoice details will appear here."
          icon={ShoppingBag}
          actionLabel="Browse Marketplace"
          onAction={() => navigate('/marketplace')}
        />
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-slate-900">PO #{order.id}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                  </p>
                </div>

                <div className="sm:text-right">
                  <span className="text-xs text-slate-400 block font-medium">Order Value</span>
                  <span className="text-lg font-extrabold text-slate-900">
                    ₹{order.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Supplier and shipping info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Supplier Organization</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{order.sellerCompanyName}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Delivery Destination</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{order.shippingAddress}</span>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Supplied Line Items</span>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50/40 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-900">{item.resourceName}</span>
                        <span className="text-slate-500 text-[11px] block">{item.category} • {item.quantity} {item.unit} @ ₹{item.pricePerUnit.toLocaleString('en-IN')}/{item.unit}</span>
                      </div>
                      <span className="font-bold text-slate-900">₹{item.totalPrice.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {order.notes && (
                <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-700">Order Notes: </span>
                  {order.notes}
                </div>
              )}

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
