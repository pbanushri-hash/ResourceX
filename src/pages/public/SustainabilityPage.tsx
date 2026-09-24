import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { SustainabilityMetrics } from '../../types';
import { Leaf, Recycle, TrendingUp, Building2, Package, Award, ArrowUpRight } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';

export const SustainabilityPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const [metrics, setMetrics] = useState<SustainabilityMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSustainability()
      .then(data => setMetrics(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
          <Leaf className="w-3.5 h-3.5" />
          <span>ESG Scope 3 Verified Ledger</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Circular Economy Impact Dashboard
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          Aggregated environmental indices computed from real industrial surplus resources procured, exchanged, and diverted from landfills on ResourceX.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          Calculating environmental indices...
        </div>
      ) : !metrics || metrics.isEmpty ? (
        <EmptyState
          title="No sustainability data available yet."
          description="The sustainability ledger starts empty. When verified businesses place orders and complete circular deliveries, live waste diverted (kg), CO₂ reduction, and reuse indices will automatically compute and display here."
          icon={Leaf}
          actionLabel="Explore Marketplace to Create Impact"
          onAction={() => navigate('/marketplace')}
        />
      ) : (
        <div className="space-y-8">
          
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Industrial Waste Diverted</span>
              <p className="text-3xl font-extrabold text-emerald-700">
                {metrics.totalWasteDivertedKg.toLocaleString('en-IN')} <span className="text-sm font-semibold text-slate-600">kg</span>
              </p>
              <p className="text-[11px] text-slate-500">Diverted from industrial incineration or landfill dumps</p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">CO₂ Equivalent Mitigated</span>
              <p className="text-3xl font-extrabold text-teal-700">
                {metrics.co2AvoidedKg.toLocaleString('en-IN')} <span className="text-sm font-semibold text-slate-600">kg CO₂e</span>
              </p>
              <p className="text-[11px] text-slate-500">Avoided through secondary raw material reuse</p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Surplus Resources Reused</span>
              <p className="text-3xl font-extrabold text-slate-900">
                {metrics.totalResourcesReused.toLocaleString('en-IN')} <span className="text-sm font-semibold text-slate-600">units</span>
              </p>
              <p className="text-[11px] text-slate-500">Commercial materials successfully re-circulated</p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Corporate Partners</span>
              <p className="text-3xl font-extrabold text-slate-900">
                {metrics.activeBusinesses}
              </p>
              <p className="text-[11px] text-slate-500">Trading verified circular assets</p>
            </div>
          </div>

          {/* Breakdown by Category */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Circular Impact by Material Category</h3>
                <p className="text-xs text-slate-500">Estimated weight diverted per resource class</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                {metrics.categoryBreakdown.length} Categories Active
              </span>
            </div>

            <div className="space-y-4">
              {metrics.categoryBreakdown.map((cat, idx) => {
                const maxWeight = Math.max(...metrics.categoryBreakdown.map(c => c.weightKg), 1);
                const percent = Math.round((cat.weightKg / maxWeight) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800">{cat.category}</span>
                      <span className="text-slate-600">
                        {cat.weightKg.toLocaleString('en-IN')} kg diverted ({cat.count} transactions)
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Contributing Companies */}
          {metrics.topContributors && metrics.topContributors.length > 0 && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Enterprise Circular Champions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {metrics.topContributors.map((c, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">{c.companyName}</span>
                      <span className="text-[11px] text-slate-500">{c.reusedCount} surplus resources recirculated</span>
                    </div>
                    <Award className="w-5 h-5 text-amber-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
