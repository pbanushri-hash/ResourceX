import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Resource, Order } from '../../types';
import { 
  Layers, 
  PackagePlus, 
  ShoppingBag, 
  TrendingUp, 
  Sparkles, 
  Calculator, 
  Building2, 
  Leaf, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { VerificationBanner } from '../../components/common/VerificationBanner';
import { VerificationBadge, OrderStatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { VerificationModal } from '../../components/modals/VerificationModal';

export const SellerDashboard: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifModalOpen, setVerifModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getSellerStats(),
      api.getSellerResources(),
      api.getOrders()
    ]).then(([st, res, ord]) => {
      setStats(st);
      setResources(res);
      setOrders(ord);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  return (
    <div className="space-y-8">
      
      {/* Verification Compliance Notice */}
      <VerificationBanner onOpenVerificationModal={() => setVerifModalOpen(true)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Supplier Command: {user.companyName}
            </h1>
            <VerificationBadge status={user.verificationStatus} />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Surplus inventory management, Gemini smart valuation, and order clearance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="seller-add-btn"
            onClick={() => navigate('/seller/add-resource')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>List Surplus Resource</span>
          </button>
          <button
            id="seller-pricing-btn"
            onClick={() => navigate('/seller/ai-pricing')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Valuation</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Active Listings</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{stats?.activeListings || 0}</p>
          <p className="text-[11px] text-slate-400">Published in marketplace</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Available Units</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700">{stats?.availableQuantity || 0}</p>
          <p className="text-[11px] text-slate-400">Total surplus in inventory</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Customer Orders</span>
            <ShoppingBag className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{orders.length}</p>
          <p className="text-[11px] text-slate-400">{stats?.pendingOrders || 0} awaiting fulfillment</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Realized Revenue</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            ₹{(stats?.totalRevenue || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400">Monetized from surplus assets</p>
        </div>
      </div>

      {/* Main Section: Surplus Listings */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">My Surplus Lots</h3>
            <p className="text-xs text-slate-500">Commercial inventory published to the network</p>
          </div>
          {resources.length > 0 && (
            <button
              onClick={() => navigate('/seller/resources')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Manage all ({resources.length})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading surplus inventory...</div>
        ) : resources.length === 0 ? (
          <EmptyState
            id="seller-empty-state"
            title="No resources listed yet."
            description="Start by adding your first surplus resource. Use Gemini AI to auto-classify categories, craft B2B specifications, and calculate secondary market pricing."
            icon={Layers}
            actionLabel="Start by adding your first surplus resource"
            onAction={() => navigate('/seller/add-resource')}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.slice(0, 6).map(res => (
              <div
                key={res.id}
                onClick={() => navigate(`/resource/${res.id}`)}
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-400 cursor-pointer transition-all space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                    {res.category}
                  </span>
                  <span className={`text-[11px] font-bold ${res.availability === 'available' ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {res.availability.toUpperCase()}
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-sm truncate">{res.name}</h4>

                <div className="flex items-baseline justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="font-extrabold text-slate-900">
                    ₹{res.sellingPrice.toLocaleString('en-IN')} <span className="text-[10px] font-normal text-slate-400">/{res.unit}</span>
                  </span>
                  <span className="text-slate-500 font-medium">
                    Stock: {res.quantity} {res.unit}
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
