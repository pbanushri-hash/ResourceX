import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { 
  BarChart3, 
  TrendingUp, 
  Layers, 
  Leaf, 
  DollarSign, 
  ArrowUpRight 
} from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';

export const SellerAnalyticsPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getSellerStats(),
      api.getSellerResources()
    ]).then(([st, res]) => {
      setStats(st);
      setResources(res);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Surplus Monetization & Impact Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Comprehensive telemetry on inventory clearance rate, capital recovery, and environmental diversion.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading analytics...</div>
      ) : !stats || stats.isEmpty ? (
        <EmptyState
          title="No data available yet."
          description="Analytics will populate automatically as you list surplus resources and complete customer purchase orders."
          icon={BarChart3}
          actionLabel="List First Resource"
          onAction={() => navigate('/seller/add-resource')}
        />
      ) : (
        <div className="space-y-6">
          
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Total Realized Capital</span>
              <p className="text-2xl font-extrabold text-slate-900">
                ₹{stats.totalRevenue.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-400">Recovered from surplus sales</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Resources Sold / Cleared</span>
              <p className="text-2xl font-extrabold text-emerald-700">
                {stats.soldResourcesCount} <span className="text-sm font-semibold text-slate-500">items</span>
              </p>
              <p className="text-[11px] text-slate-400">Successfully recirculated</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Current Active Listings</span>
              <p className="text-2xl font-extrabold text-slate-900">
                {stats.activeListings}
              </p>
              <p className="text-[11px] text-slate-400">Live in public catalog</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Surplus Units in Stock</span>
              <p className="text-2xl font-extrabold text-teal-700">
                {stats.availableQuantity.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-400">Pending clearance</p>
            </div>
          </div>

          {/* Listings Distribution Table */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Inventory Distribution Overview</h3>
            <div className="divide-y divide-slate-100">
              {resources.map(res => (
                <div key={res.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 block">{res.name}</span>
                    <span className="text-slate-500 text-[11px]">{res.category} • {res.condition}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-slate-900 block">
                      ₹{res.sellingPrice.toLocaleString('en-IN')} / {res.unit}
                    </span>
                    <span className="text-slate-500 text-[11px]">Stock: {res.quantity} {res.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
