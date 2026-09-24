import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { SustainabilityMetrics } from '../../types';
import { 
  Recycle, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Package, 
  Layers, 
  Cpu, 
  Boxes, 
  Wrench, 
  Leaf, 
  Building2, 
  TrendingUp, 
  CheckCircle2,
  Store,
  ChevronRight
} from 'lucide-react';

interface HomePageProps {
  navigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const [metrics, setMetrics] = useState<SustainabilityMetrics | null>(null);

  useEffect(() => {
    api.getSustainability().then(data => setMetrics(data)).catch(() => {});
  }, []);

  const categories = [
    { name: 'Raw Materials', icon: Layers, desc: 'Metals, industrial polymers, chemicals & minerals', param: 'Raw Materials' },
    { name: 'Packaging Materials', icon: Boxes, desc: 'Cartons, drums, pallets & protective wraps', param: 'Packaging Materials' },
    { name: 'Machinery', icon: Wrench, desc: 'CNC tools, manufacturing plants & process machines', param: 'Machinery' },
    { name: 'Equipment', icon: Package, desc: 'Compressors, pumps, testing apparatus & forklifts', param: 'Equipment' },
    { name: 'Office Assets', icon: Building2, desc: 'IT equipment, workstations, racks & displays', param: 'Office Assets' },
    { name: 'Electronics', icon: Cpu, desc: 'PCBs, passives, semiconductors & wiring assemblies', param: 'Electronics' },
  ];

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:py-24 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl mx-4 sm:mx-6 lg:mx-8 px-6 sm:px-12 border border-slate-800 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_50%)]"></div>
        <div className="relative max-w-4xl space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered B2B Circular Marketplace</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-white">
            Monetize surplus resources. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Eliminate industrial waste.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
            ResourceX connects verified enterprises to buy, sell, or donate commercial raw materials, packaging, machinery, and equipment. Powered by Gemini AI for automated classification and smart circular pricing.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              id="hero-explore-btn"
              onClick={() => navigate('/marketplace')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm transition-all shadow-lg hover:shadow-emerald-500/20"
            >
              <Store className="w-4 h-4" />
              <span>Explore Surplus Resources</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="hero-seller-btn"
              onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-all"
            >
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Register Company</span>
            </button>
          </div>

          <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Verified GST & Registries</span>
            </div>
            <div className="flex items-center gap-2">
              <Recycle className="w-4 h-4 text-emerald-400" />
              <span>Zero-Landfill Circular Routing</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Gemini Smart Valuation</span>
            </div>
          </div>
        </div>
      </section>

      {/* Live ESG / Platform Data Metric Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold tracking-wider uppercase text-slate-400">Verified Platform Registry</span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">Live Circular Economy Impact Index</h2>
            </div>
            <button 
              onClick={() => navigate('/sustainability')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              <span>View Full ESG Ledger</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {metrics && !metrics.isEmpty ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-medium">Estimated Waste Diverted</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
                  {metrics.totalWasteDivertedKg.toLocaleString('en-IN')} <span className="text-sm font-semibold text-slate-600">kg</span>
                </p>
                <p className="text-[11px] text-slate-400">Avoided industrial landfill disposal</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-medium">Surplus Units Reused</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {metrics.totalResourcesReused.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-slate-400">Returned to industrial circulation</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-medium">Participating Businesses</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {metrics.activeBusinesses}
                </p>
                <p className="text-[11px] text-slate-400">Trading surplus across sectors</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-medium">Orders Completed</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {metrics.totalOrdersCompleted}
                </p>
                <p className="text-[11px] text-slate-400">Real B2B circular transactions</p>
              </div>
            </div>
          ) : (
            <div className="pt-6 text-center py-6 text-slate-500 text-xs">
              <Leaf className="w-6 h-6 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">Database Starting Clean: No transactions logged yet.</p>
              <p className="text-slate-400 mt-0.5">As verified businesses buy and sell surplus resources, authentic circular economy metrics will populate here in real-time.</p>
            </div>
          )}
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Browse Verified Categories</h2>
            <p className="text-sm text-slate-500 mt-1">Certified surplus materials available for commercial procurement</p>
          </div>
          <button
            onClick={() => navigate('/marketplace')}
            className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            <span>View all listings</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <button
                key={idx}
                id={`cat-card-${cat.param.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => navigate(`/marketplace?category=${encodeURIComponent(cat.param)}`)}
                className="group text-left p-6 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-emerald-50 text-slate-700 group-hover:text-emerald-700 flex items-center justify-center transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-emerald-700">
                  <span>Browse Category</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* How It Works Visual Flow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white border border-slate-800">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Enterprise Protocol</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
              The Verified B2B Circular Pipeline
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              How ResourceX guarantees legal compliance, quality traceability, and immediate market clearance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-extrabold text-sm">
                1
              </div>
              <h3 className="text-sm font-bold text-white">Corporate Verification</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Businesses register with verified GST and incorporation documents. Only vetted entities can buy or sell.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-extrabold text-sm">
                2
              </div>
              <h3 className="text-sm font-bold text-white">AI Auto-Cataloging</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sellers upload surplus lot notes. Gemini AI suggests standard categories, writes B2B specifications, and detects duplicate postings.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-extrabold text-sm">
                3
              </div>
              <h3 className="text-sm font-bold text-white">Smart Pricing & Match</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Smart valuation engine computes fair market discount based on condition, quantity, and secondary market liquidity.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-extrabold text-sm">
                4
              </div>
              <h3 className="text-sm font-bold text-white">Procure & Divert Waste</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Buyers place orders with commercial invoice terms. Every fulfillment instantly updates platform waste diversion metrics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="p-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 max-w-3xl mx-auto space-y-4">
          <Recycle className="w-10 h-10 text-emerald-700 mx-auto" />
          <h2 className="text-2xl font-extrabold text-emerald-950">Ready to transform enterprise surplus into capital?</h2>
          <p className="text-xs sm:text-sm text-emerald-800 max-w-xl mx-auto leading-relaxed">
            Join verified manufacturers, logistics hubs, and industrial suppliers across India and beyond. Reduce your disposal costs and hit ESG net-zero goals.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-xs"
            >
              Create Business Account
            </button>
            <button
              onClick={() => navigate('/marketplace')}
              className="px-6 py-2.5 rounded-lg bg-white border border-emerald-300 text-emerald-900 text-xs font-bold hover:bg-emerald-100/50 transition-colors"
            >
              Browse Surplus Inventory
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
