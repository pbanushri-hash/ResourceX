import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ShieldCheck, 
  Leaf, 
  CheckCircle2, 
  AlertCircle,
  Truck
} from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { VerificationBanner } from '../../components/common/VerificationBanner';

export const BuyerCartPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { items, updateQuantity, removeItem, clearCart, totalPrice, totalItems } = useCart();
  const { user, isVerified } = useAuth();
  
  const [shippingAddress, setShippingAddress] = useState(user ? `${user.address}, ${user.city}, ${user.state}` : '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<{ message: string; orderIds: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalWasteKg = items.reduce((sum, it) => {
    const weight = it.resource.sustainabilityInfo?.estimatedWeightKg || 2;
    return sum + (weight * it.quantity);
  }, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (!isVerified && user?.role !== 'admin') {
      setError('Business verification is required before placing purchase orders. Please submit or await verification approval.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res: any = await api.createOrder({
        items: items.map(i => ({
          resourceId: i.resource.id,
          resourceName: i.resource.name,
          quantity: i.quantity
        })),
        shippingAddress,
        notes: notes || 'B2B commercial invoice terms'
      });

      setOrderResult({
        message: res?.message || 'Purchase order submitted successfully.',
        orderIds: Array.isArray(res?.orders) ? res.orders.map((o: any) => o.id) : [res?.id || 'PO-PROCESSED']
      });
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (orderResult) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-5">
        <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
        <h2 className="text-2xl font-extrabold text-slate-900">Purchase Order Transmitted</h2>
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3 text-xs">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span>Commercial Purchase Orders Generated:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase font-bold text-[10px]">
              Status: Pending Review
            </span>
          </div>
          <p className="text-slate-600 leading-relaxed">{orderResult.message}</p>
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 space-y-1 text-[11px]">
            <span className="font-bold block">Payment Gateway Notice:</span>
            <p>
              Payment gateway integration is currently not configured. This order has been submitted to the supplier under standard B2B commercial invoice terms. The supplier has received an automated notification to review and confirm the dispatch lot.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-200 text-slate-500 font-mono text-[11px]">
            Generated PO Reference(s): {orderResult.orderIds.join(', ')}
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={() => navigate('/buyer/orders')}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs"
          >
            Track in My Orders
          </button>
          <button
            onClick={() => navigate('/marketplace')}
            className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Procurement & Purchase Cart
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review surplus materials, calculate shipping destination, and execute commercial invoices.
        </p>
      </div>

      <VerificationBanner />

      {items.length === 0 ? (
        <EmptyState
          id="cart-empty-state"
          title="Your procurement cart is empty."
          description="You haven't added any surplus items to your order. Browse the catalog to select manufacturing materials, packaging lots, or machinery."
          icon={ShoppingCart}
          actionLabel="Browse Verified Marketplace"
          onAction={() => navigate('/marketplace')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Cart items list (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs divide-y divide-slate-100">
              {items.map(({ resource, quantity }) => {
                const subtotal = quantity * resource.sellingPrice;
                return (
                  <div key={resource.id} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {resource.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {resource.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Supplier: <span className="font-semibold text-slate-700">{resource.sellerCompanyName}</span> ({resource.location})
                      </p>
                      <p className="text-xs font-extrabold text-slate-900 pt-1">
                        ₹{resource.sellingPrice.toLocaleString('en-IN')} <span className="text-[10px] text-slate-400 font-normal">/ {resource.unit}</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
                          disabled={quantity <= (resource.minOrderQuantity || 1)}
                          onClick={() => updateQuantity(resource.id, Math.max(resource.minOrderQuantity || 1, quantity - 1))}
                          className="p-1.5 hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-slate-800">{quantity}</span>
                        <button
                          disabled={quantity >= resource.quantity}
                          onClick={() => updateQuantity(resource.id, Math.min(resource.quantity, quantity + 1))}
                          className="p-1.5 hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        MOQ: {resource.minOrderQuantity || 1} {resource.unit} (Stock: {resource.quantity})
                      </span>

                      <div className="text-right">
                        <span className="text-xs font-extrabold text-slate-900 block">
                          ₹{subtotal.toLocaleString('en-IN')}
                        </span>
                        <button
                          onClick={() => removeItem(resource.id)}
                          className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center gap-0.5 mt-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs px-2">
              <button
                onClick={() => clearCart()}
                className="text-slate-400 hover:text-rose-600 transition-colors"
              >
                Clear entire cart
              </button>
              <button
                onClick={() => navigate('/marketplace')}
                className="text-emerald-700 font-semibold hover:underline"
              >
                Continue browsing
              </button>
            </div>
          </div>

          {/* Checkout & Summary Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
              <h3 className="text-base font-bold text-slate-900">Procurement Summary</h3>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Total Items</span>
                  <span className="font-semibold text-slate-900">{totalItems} units</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Goods Value</span>
                  <span className="font-semibold text-slate-900">₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Applicable GST / Tax</span>
                  <span className="font-semibold text-slate-900">As per statutory B2B invoice</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900">Total Purchase Value</span>
                  <span className="text-xl font-extrabold text-slate-900">₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* ESG Scope 3 diverted weight block */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                <Leaf className="w-6 h-6 text-emerald-600 shrink-0" />
                <div className="text-xs text-emerald-950">
                  <span className="font-bold block">Environmental Diversion</span>
                  <span className="text-[11px] text-emerald-800">
                    Executing this order diverts approx. <strong className="font-bold">{totalWasteKg} kg</strong> of industrial waste from landfills.
                  </span>
                </div>
              </div>

              <form onSubmit={handleCheckout} className="space-y-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Delivery Warehouse / Plant Address *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={shippingAddress}
                    onChange={e => setShippingAddress(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Purchase Order Notes / Transport Instructions
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Forklift offloading required; inspect seal on arrival"
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-500 space-y-1">
                  <span className="font-semibold text-slate-700 block">B2B Terms & Settlement Notice:</span>
                  <p className="leading-tight">
                    Payment gateway is not configured for direct card billing. Orders are logged under formal commercial invoice agreements subject to seller acceptance.
                  </p>
                </div>

                <button
                  id="checkout-submit-btn"
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Truck className="w-4 h-4 text-emerald-400" />
                  <span>{submitting ? 'Transmitting Order...' : 'Execute Purchase Order'}</span>
                </button>
              </form>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
