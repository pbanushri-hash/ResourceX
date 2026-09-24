import React from 'react';
import { Recycle, ShieldCheck, Target, Award, Globe, Leaf, Users, ArrowRight } from 'lucide-react';

export const AboutPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Our Circular Economy Mission
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Eliminating Industrial Surplus Waste Through Intelligent Enterprise Commerce
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          ResourceX was architected to bridge the multi-billion dollar gap between industrial surplus disposal and raw material procurement.
        </p>
      </div>

      {/* Core Mission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Recycle className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Closing the Loop</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Every unused barrel, excess pallet, obsolete machine, or overstocked raw material has utility elsewhere. We ensure zero usable enterprise materials are directed to landfills.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Verified B2B Trust</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Unlike informal scrap channels or peer-to-peer marketplaces, ResourceX mandates GST, CIN, and tax registration verification for all corporate participants.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Auditable ESG Logs</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Transactions calculate live carbon offset equivalents and landfill diversion weights, enabling enterprises to fulfill BRSR (Business Responsibility and Sustainability Reporting).
          </p>
        </div>
      </div>

      {/* Philosophy Section */}
      <div className="p-8 rounded-2xl bg-slate-900 text-white space-y-6">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-2xl font-bold">Why B2B Circularity Matters Now</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Traditional industrial procurement follows a linear model: Extract, Produce, Discard. Warehouses accumulate deadstock that depreciates and costs rent, while other factories face supply chain shortages. ResourceX unlocks this locked capital.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" />
            <div>
              <span className="font-bold text-white block">Immediate Working Capital</span>
              <span className="text-slate-400">Sellers convert idle inventory and warehouse overflow into revenue immediately.</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" />
            <div>
              <span className="font-bold text-white block">Cost Savings for Buyers</span>
              <span className="text-slate-400">Buyers procure authentic materials at 20% to 50% discount compared to primary OEM pricing.</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pt-6">
        <button
          onClick={() => navigate('/marketplace')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors shadow-xs"
        >
          <span>Explore Verified Listings</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};

function CheckCircle2(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  );
}
