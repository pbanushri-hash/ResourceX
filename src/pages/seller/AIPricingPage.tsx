import React, { useState } from 'react';
import { api } from '../../services/api';
import { AISmartPriceResult } from '../../types';
import { 
  Calculator, 
  Sparkles, 
  TrendingDown, 
  DollarSign, 
  Layers, 
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Info
} from 'lucide-react';

export const AIPricingPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [originalPrice, setOriginalPrice] = useState<number | ''>('');
  const [location, setLocation] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AISmartPriceResult | null>(null);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (originalPrice === '' || Number(originalPrice) <= 0) return;

    try {
      setLoading(true);
      const res = await api.aiSmartPricing({
        name: name.trim(),
        category: category || undefined,
        condition: condition || undefined,
        quantity: quantity !== '' ? Number(quantity) : 1,
        originalPrice: Number(originalPrice),
        location: location.trim() || undefined
      });
      setResult(res);
    } catch (err: any) {
      alert(err.message || 'Valuation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gemini Secondary Market Engine</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          AI Smart Pricing & Liquidity Valuation
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Benchmark your surplus inventory against industrial secondary demand to optimize clearance velocity and recovery value.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Form Inputs (6 cols) */}
        <div className="md:col-span-6 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Lot Valuation Parameters
          </h3>

          <form onSubmit={handleCalculate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resource Name / Material Grade
              </label>
              <input
                type="text"
                required
                value={name}
                placeholder="e.g. Industrial Steel Sheets or CNC Machine"
                onChange={e => setName(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 px-2.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="Raw Materials">Raw Materials</option>
                  <option value="Packaging Materials">Packaging Materials</option>
                  <option value="Machinery">Machinery</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Office Assets">Office Assets</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Reusable Inventory">Reusable Inventory</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Condition
                </label>
                <select
                  value={condition}
                  onChange={e => setCondition(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 px-2.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="Surplus / Unused">Surplus / Unused</option>
                  <option value="Like New">Like New</option>
                  <option value="Refurbished">Refurbished</option>
                  <option value="Fair / Usable">Fair / Usable</option>
                  <option value="For Parts / Scrap">For Parts / Scrap</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Original Cost (₹ / unit) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={originalPrice}
                  placeholder="e.g. 500"
                  onChange={e => setOriginalPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Available Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  placeholder="e.g. 100"
                  onChange={e => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Industrial Region / Location
              </label>
              <input
                type="text"
                value={location}
                placeholder="e.g. Industrial Area, City"
                onChange={e => setLocation(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-400" />
              <span>{loading ? 'Running Valuation...' : 'Calculate Optimal Valuation'}</span>
            </button>
          </form>
        </div>

        {/* Results Panel (6 cols) */}
        <div className="md:col-span-6 space-y-4">
          {result ? (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Valuation Recommendation
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {result.circularSavingsPercentage || result.estimatedDiscountPercent || 0}% Savings / Discount
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-500 block">Suggested Selling Price</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900">
                    ₹{(result.suggestedPrice || result.recommendedPrice || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-400 line-through">
                    ₹{Number(originalPrice).toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Recommended clearing price for industrial buyers</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <Info className="w-4 h-4 text-emerald-600" />
                  <span>Market Dynamics & Rationale</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">{result.marketRationale || result.reasoning}</p>
              </div>

              {result.factors && result.factors.length > 0 && (
                <div className="space-y-2 text-xs">
                  <span className="font-bold text-slate-800 block">Market Factors Influencing Price:</span>
                  <ul className="space-y-1 text-slate-600 text-[11px]">
                    {result.factors.map((f: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => navigate('/seller/add-resource')}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>Publish Listing with This Valuation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-white border border-dashed border-slate-200 text-slate-400 space-y-3">
              <Calculator className="w-12 h-12 stroke-[1.2] mx-auto text-slate-300" />
              <h3 className="text-sm font-bold text-slate-700">Awaiting Input Parameters</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Fill in original costs, lot condition, and inventory volume to run the Gemini valuation engine.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
