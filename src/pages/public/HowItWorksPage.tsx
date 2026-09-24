import React from 'react';
import { ShieldCheck, Sparkles, Building2, ShoppingCart, Truck, Leaf, CheckCircle2, ArrowRight } from 'lucide-react';

export const HowItWorksPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const steps = [
    {
      num: '01',
      title: 'Company Registration & Compliance Verification',
      role: 'All Businesses',
      desc: 'Enter your corporate details including CIN / Registration Number, GSTIN, and corporate headquarters. Upload an official document. Platform administrators verify legitimacy to safeguard the commercial network.',
      icon: ShieldCheck,
      color: 'emerald',
    },
    {
      num: '02',
      title: 'AI-Assisted Listing & Smart Valuation',
      role: 'For Sellers',
      desc: 'Sellers provide basic details of their surplus lot. Gemini AI automatically classifies the category, writes B2B technical specs, checks for duplicate listings, and recommends optimal secondary-market pricing.',
      icon: Sparkles,
      color: 'blue',
    },
    {
      num: '03',
      title: 'Enterprise Discovery & Smart Matching',
      role: 'For Buyers',
      desc: 'Browse surplus materials with advanced multi-parameter filtering (category, condition, location, price, MOQ). Use AI demand matching to find relevant raw materials matching manufacturing input specifications.',
      icon: ShoppingCart,
      color: 'purple',
    },
    {
      num: '04',
      title: 'Direct Negotiations & Commercial Orders',
      role: 'B2B Procurement',
      desc: 'Send direct inquiries to suppliers to inspect batches, request lab test reports, or schedule pickups. Buyers issue commercial purchase orders on formal B2B invoice terms.',
      icon: Truck,
      color: 'amber',
    },
    {
      num: '05',
      title: 'Automated Circular Tracking & ESG Ledger',
      role: 'Environmental Governance',
      desc: 'Upon successful delivery, the transaction is permanently recorded in the platform ESG ledger. Both parties receive auditable certificates of landfill diversion and CO₂ offset.',
      icon: Leaf,
      color: 'teal',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Standard Operating Procedures
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          How ResourceX Powers Circular B2B Transactions
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          A compliant, auditable, and automated workflow connecting enterprise surplus suppliers with manufacturing buyers.
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-extrabold text-sm shrink-0">
                  {step.num}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {step.role}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                    {step.desc}
                  </p>
                </div>
              </div>

              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0 hidden md:flex">
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="p-8 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold">Ready to participate in the circular economy?</h3>
          <p className="text-xs text-slate-400 mt-1">Register your business today. Verification typically takes under 24 hours.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/register')}
            className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-colors shadow-xs"
          >
            Register Now
          </button>
          <button
            onClick={() => navigate('/marketplace')}
            className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors"
          >
            View Marketplace
          </button>
        </div>
      </div>
    </div>
  );
};
