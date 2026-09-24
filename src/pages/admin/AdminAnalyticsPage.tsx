import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { BarChart3, TrendingUp, Building2, Leaf, Layers, ShieldCheck, DollarSign } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';

export const AdminAnalyticsPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminAnalytics()
      .then(data => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          System Macro Analytics & Circular Economy Ledger
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time aggregation of gross market volume, diverted industrial waste, and business verification rates.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Aggregating platform metrics...</div>
      ) : !stats || stats.isEmpty ? (
        <EmptyState
          title="No data available yet."
          description="Analytics will populate as businesses register, submit verification dossiers, publish surplus lots, and complete transactions."
          icon={BarChart3}
        />
      ) : (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Gross Platform Volume</span>
              <p className="text-2xl font-extrabold text-slate-900">
                ₹{(stats.totalTradeVolume || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-400">{stats.totalOrders} executed orders</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Landfill Diversion Impact</span>
              <p className="text-2xl font-extrabold text-emerald-700">
                {(stats.wasteDivertedKg || 0).toLocaleString('en-IN')} <span className="text-sm font-semibold text-slate-500">kg</span>
              </p>
              <p className="text-[11px] text-slate-400">Recirculated surplus materials</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Total Registered Entities</span>
              <p className="text-2xl font-extrabold text-slate-900">
                {stats.totalBusinesses}
              </p>
              <p className="text-[11px] text-slate-400">{stats.verifiedBusinesses} verified businesses</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Catalog Listings</span>
              <p className="text-2xl font-extrabold text-teal-700">
                {stats.totalResources}
              </p>
              <p className="text-[11px] text-slate-400">{stats.activeResources} currently tradeable</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-base font-bold text-slate-900">Environmental Scope 3 Impact</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                ResourceX calculates industrial carbon abatement based on life-cycle displacement benchmarks for raw metals, recycled plastics, and industrial machinery.
              </p>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-4">
                <Leaf className="w-8 h-8 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-lg font-extrabold text-emerald-900">
                    {(stats.co2SavedKg || 0).toLocaleString('en-IN')} kg CO₂e
                  </span>
                  <p className="text-xs text-emerald-700">Avoided virgin manufacturing emissions</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-base font-bold text-slate-900">Network Governance Health</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Corporate Verification Clearance Rate</span>
                  <span className="font-bold text-slate-800">
                    {stats.totalBusinesses > 0 ? Math.round((stats.verifiedBusinesses / stats.totalBusinesses) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Pending Compliance Audits</span>
                  <span className="font-bold text-amber-600">{stats.pendingVerifications}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Total Active Lots</span>
                  <span className="font-bold text-slate-800">{stats.activeResources}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
