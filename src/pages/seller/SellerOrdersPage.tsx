import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Order } from '../../types';
import { ShoppingBag, Truck, CheckCircle2, Clock, Building2, MapPin, AlertCircle } from 'lucide-react';
import { OrderStatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';

export const SellerOrdersPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await api.getSellerOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, status: Order['status']) => {
    try {
      const updated = await api.updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Customer Purchase Orders
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Process incoming B2B procurement requests, update dispatch status, and log circular handoffs.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading incoming orders...</div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders found."
          description="You haven't received any customer purchase orders yet. Once buyers select your surplus resources, orders will appear here for fulfillment."
          icon={ShoppingBag}
          actionLabel="View My Resources"
          onAction={() => navigate('/seller/resources')}
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
                    Received on {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Fulfillment Status Changer */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">Update Status:</span>
                  <select
                    value={order.status}
                    onChange={e => handleUpdateStatus(order.id, e.target.value as any)}
                    className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-semibold"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing Lot</option>
                    <option value="shipped">In Transit / Shipped</option>
                    <option value="delivered">Delivered & Reused</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Buyer & Destination Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Buyer Enterprise</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{order.buyerCompanyName} ({order.buyerName})</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Delivery Warehouse</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{order.shippingAddress}</span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Ordered Surplus Lots</span>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50/40 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-900">{item.resourceName}</span>
                        <span className="text-slate-500 text-[11px] block">
                          {item.quantity} {item.unit} @ ₹{item.pricePerUnit.toLocaleString('en-IN')}/{item.unit}
                        </span>
                      </div>
                      <span className="font-extrabold text-slate-900">₹{item.totalPrice.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500 gap-2">
                <div>
                  {order.notes && (
                    <span><strong className="text-slate-700">Client Notes:</strong> {order.notes}</span>
                  )}
                </div>
                <div className="sm:text-right font-extrabold text-slate-900 text-sm">
                  PO Total: ₹{order.totalAmount.toLocaleString('en-IN')}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
