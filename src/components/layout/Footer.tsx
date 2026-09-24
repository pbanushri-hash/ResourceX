import React from 'react';
import { Recycle, ShieldCheck, Leaf, Globe2, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-emerald-400">
                <Recycle className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-base font-extrabold text-slate-900">
                Resource<span className="text-emerald-600">X</span>
              </span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed max-w-xs">
              The verified B2B circular marketplace helping manufacturing and enterprise sectors eliminate resource waste and monetize industrial surplus inventory.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Verified Corporate Entities</span>
            </div>
          </div>

          {/* Marketplace Navigation */}
          <div>
            <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-3">
              Marketplace
            </p>
            <ul className="space-y-2">
              <li>
                <button onClick={() => navigate('/marketplace')} className="hover:text-slate-900 transition-colors">
                  All Surplus Categories
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/marketplace?category=Raw%20Materials')} className="hover:text-slate-900 transition-colors">
                  Raw Materials & Feedstock
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/marketplace?category=Packaging%20Materials')} className="hover:text-slate-900 transition-colors">
                  Packaging & Logistics Assets
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/marketplace?category=Machinery')} className="hover:text-slate-900 transition-colors">
                  Manufacturing Machinery
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/sustainability')} className="hover:text-slate-900 transition-colors">
                  Live Circular Impact Index
                </button>
              </li>
            </ul>
          </div>

          {/* Platform Governance */}
          <div>
            <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-3">
              Platform & Trust
            </p>
            <ul className="space-y-2">
              <li>
                <button onClick={() => navigate('/how-it-works')} className="hover:text-slate-900 transition-colors">
                  Verification Protocols
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/about')} className="hover:text-slate-900 transition-colors">
                  Circular Economy Principles
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/register')} className="hover:text-slate-900 transition-colors">
                  Corporate Registration
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/login')} className="hover:text-slate-900 transition-colors">
                  Enterprise Portal Login
                </button>
              </li>
            </ul>
          </div>

          {/* Environmental Scope */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 text-slate-900 font-bold mb-2">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <span>ESG & Scope 3 Scope</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
              Every surplus exchange executed on ResourceX diverts industrial waste from landfills and generates auditable Scope 3 reduction logs.
            </p>
            <button 
              onClick={() => navigate('/sustainability')}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
            >
              <span>Explore Sustainability Ledger</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[11px]">
          <p>© {new Date().getFullYear()} ResourceX Global B2B Circular Solutions Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>GST & Corporate Registry Verified</span>
            <span>•</span>
            <span>Enterprise B2B Escrow Architecture</span>
            <span>•</span>
            <span>Zero-Waste Industrial Network</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
