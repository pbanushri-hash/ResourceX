import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';
import { Order, Resource } from '../../types';
import { 
  ShoppingBag, 
  ShoppingCart, 
  Sparkles, 
  Store, 
  Building2, 
  Leaf, 
  ArrowRight, 
  ShieldCheck,
  ChevronRight,
  MapPin,
  FileText,
  Phone,
  Mail,
  Layers,
  Plus,
  Trash2
} from 'lucide-react';
import { VerificationBanner } from '../../components/common/VerificationBanner';
import { VerificationBadge, OrderStatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { VerificationModal } from '../../components/modals/VerificationModal';

interface BuyerDashboardProps {
  navigate: (path: string) => void;
}

export const BuyerDashboard: React.FC<BuyerDashboardProps> = ({ navigate }) => {
  const { user } = useAuth();
  const { items: cartItems, totalItems, totalPrice, removeItem } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [recommended, setRecommended] = useState<Resource[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingRecommended, setLoadingRecommended] = useState(true);
  const [verifModalOpen, setVerifModalOpen] = useState(false);

  useEffect(() => {
    // Load buyer-specific orders from Firestore
    api.getBuyerOrders()
      .then(data => setOrders(data))
      .catch(err => console.warn('Failed to load buyer orders:', err))
      .finally(() => setLoadingOrders(false));

    // Load recommended active resources from Firestore
    api.getResources({ sortBy: 'newest' })
      .then(all => {
        // Filter only available resources
        const available = all.filter(r => r.availability !== 'sold' && (!r.status || r.status === 'active'));
        setRecommended(available.slice(0, 4));
      })
      .catch(err => console.warn('Failed to load recommended resources:', err))
      .finally(() => setLoadingRecommended(false));
  }, []);

  if (!user) return null;

  return (
    <div className="space-y-8">
      
      {/* Verification Notice */}
      <VerificationBanner onOpenVerificationModal={() => setVerifModalOpen(true)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Procurement Hub: {user.companyName}
            </h1>
            <VerificationBadge status={user.verificationStatus} />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Circular resource sourcing, B2B order tracking, and Scope 3 material traceability
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="buyer-browse-btn"
            onClick={() => navigate('/marketplace')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Browse Catalog</span>
          </button>
          <button
            id="buyer-ai-match-btn"
            onClick={() => navigate('/buyer/recommendations')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Material Matcher</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Purchase Orders</span>
            <ShoppingBag className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{orders.length}</p>
          <p className="text-[11px] text-slate-400">Executed B2B invoices</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Procurement Cart</span>
            <ShoppingCart className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700">{totalItems}</p>
          <p className="text-[11px] text-slate-400">₹{totalPrice.toLocaleString('en-IN')} pending checkout</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Company Verification</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-sm font-bold text-slate-900 capitalize mt-1.5">
            {user.verificationStatus === 'verified' ? 'Fully Approved' : 'Under Review'}
          </p>
          <p className="text-[11px] text-slate-400">GST: {user.gstNumber || 'Pending'}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Circular ESG Benefit</span>
            <Leaf className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-teal-700">
            {orders.reduce((sum, o) => sum + (o.items || []).reduce((s, i) => s + (i.estimatedWeightKg || 2) * i.quantity, 0), 0).toLocaleString('en-IN')} kg
          </p>
          <p className="text-[11px] text-slate-400">Industrial waste diverted</p>
        </div>
      </div>

      {/* Buyer Company Information Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Buyer Enterprise Profile</h3>
              <p className="text-xs text-slate-500">Corporate credentials used for verified secondary procurement contracts</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>Edit Profile</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-2">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Enterprise & Type</span>
            <p className="font-bold text-slate-800">{user.companyName}</p>
            <p className="text-[11px] text-slate-500">{user.businessType || 'Commercial Enterprise'}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Procurement Officer</span>
            <p className="font-bold text-slate-800">{user.name}</p>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <Mail className="w-3 h-3 text-slate-400" />
              <span className="truncate">{user.email}</span>
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Registered Location</span>
            <p className="font-semibold text-slate-800 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{user.city ? `${user.city}, ${user.state}` : 'Location Not Set'}</span>
            </p>
            <p className="text-[11px] text-slate-500 truncate">{user.address || 'Address pending'}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Statutory Identifiers</span>
            <p className="font-mono text-slate-800 font-semibold text-[11px]">GSTIN: {user.gstNumber || 'Not Provided'}</p>
            <p className="font-mono text-slate-500 text-[10px]">CIN: {user.registrationNumber || 'Pending'}</p>
          </div>
        </div>
      </div>

      {/* Grid: Saved Cart Resources & Recommended Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Saved Cart Resources (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Procurement Cart</h3>
              </div>
              {cartItems.length > 0 && (
                <button
                  onClick={() => navigate('/buyer/cart')}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <span>Go to Checkout</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <EmptyState
                id="dashboard-cart-empty"
                title="Your cart is empty."
                description="No surplus inventory items are saved for checkout yet. Browse the catalog to select manufacturing inputs."
                icon={ShoppingCart}
                actionLabel="Browse Surplus Catalog"
                onAction={() => navigate('/marketplace')}
              />
            ) : (
              <div className="space-y-3 divide-y divide-slate-100">
                <div className="space-y-3 pt-1">
                  {cartItems.slice(0, 3).map(({ resource, quantity }) => (
                    <div key={resource.id} className="flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{resource.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {quantity} {resource.unit} @ ₹{resource.sellingPrice.toLocaleString('en-IN')}/{resource.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-extrabold text-slate-900">
                          ₹{(quantity * resource.sellingPrice).toLocaleString('en-IN')}
                        </span>
                        <button
                          onClick={() => removeItem(resource.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">Total ({totalItems} items):</span>
                    <span className="font-extrabold text-slate-900 text-sm ml-1">
                      ₹{totalPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate('/buyer/cart')}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                  >
                    Proceed to Cart
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recommended Surplus Resources (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Recommended Surplus Lots</h3>
              </div>
              <button
                onClick={() => navigate('/marketplace')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <span>View Full Catalog</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {loadingRecommended ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading available surplus lots...</div>
            ) : recommended.length === 0 ? (
              <EmptyState
                id="dashboard-recommended-empty"
                title="No surplus resources available."
                description="There are currently no active surplus lots published by suppliers. Check back soon or list surplus from your facilities."
                icon={Store}
                actionLabel="Explore Marketplace"
                onAction={() => navigate('/marketplace')}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommended.map(res => (
                  <div
                    key={res.id}
                    onClick={() => navigate(`/marketplace/${res.id}`)}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-xs transition-all cursor-pointer bg-slate-50/40 flex flex-col justify-between space-y-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 text-[10px] text-slate-500">
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 font-semibold text-slate-700 uppercase">
                          {res.category}
                        </span>
                        <span className="font-semibold text-emerald-700">
                          {res.quantity} {res.unit} left
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 line-clamp-1 mt-1.5">{res.name}</h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{res.sellerCompanyName}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <div>
                        {res.resourceType === 'donation' ? (
                          <span className="font-bold text-purple-700">Free / Donation</span>
                        ) : (
                          <span className="font-extrabold text-slate-900 text-sm">
                            ₹{res.sellingPrice.toLocaleString('en-IN')}{' '}
                            <span className="text-[10px] font-normal text-slate-400">/{res.unit}</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-0.5">
                        View Lot <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Recent Orders Section */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Purchase Orders</h3>
            <p className="text-xs text-slate-500">Commercial transactions with verified surplus suppliers</p>
          </div>
          {orders.length > 0 && (
            <button
              onClick={() => navigate('/buyer/orders')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View all orders</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {loadingOrders ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading orders...</div>
        ) : orders.length === 0 ? (
          <EmptyState
            title="No orders found."
            description="You have not placed any surplus procurement orders yet. Browse verified commercial materials and place your first circular purchase."
            icon={ShoppingBag}
            actionLabel="Explore Marketplace"
            onAction={() => navigate('/marketplace')}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">Order #{order.id.slice(-6).toUpperCase()}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Supplier: <span className="font-medium text-slate-700">{order.sellerCompanyName}</span> • {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    {order.items.map(i => `${i.resourceName} (${i.quantity} ${i.unit})`).join(', ')}
                  </p>
                </div>

                <div className="sm:text-right space-y-1">
                  <span className="font-extrabold text-slate-900 text-sm block">
                    ₹{order.totalAmount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    {order.paymentStatus === 'pending_gateway' ? 'Invoice / Net 30' : order.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <VerificationModal
        isOpen={verifModalOpen}
        onClose={() => setVerifModalOpen(false)}
      />

    </div>
  );
};
