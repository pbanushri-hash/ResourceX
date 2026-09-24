import React, { useState } from 'react';
import { api } from '../../services/api';
import { AIMatchResult, Resource } from '../../types';
import { useCart } from '../../context/CartContext';
import { 
  Sparkles, 
  Search, 
  Building2, 
  MapPin, 
  Layers, 
  ShoppingCart, 
  Check, 
  ArrowRight,
  TrendingDown,
  Info
} from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';

export const BuyerRecommendations: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { addItem } = useCart();
  const [keywords, setKeywords] = useState('');
  const [category, setCategory] = useState('');
  const [targetQuantity, setTargetQuantity] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [location, setLocation] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AIMatchResult | null>(null);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywords && !category) return;

    try {
      setLoading(true);
      const res = await api.aiMatchRequirements({
        keywords,
        category: category || undefined,
        targetQuantity: targetQuantity ? Number(targetQuantity) : undefined,
        maxBudget: maxBudget ? Number(maxBudget) : undefined,
        location: location || undefined
      });
      setResults(res);
    } catch (err: any) {
      alert(err.message || 'AI matching failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (resourceId: string, minQty: number = 1) => {
    try {
      await addItem(resourceId, minQty);
      setAddedIds(prev => ({ ...prev, [resourceId]: true }));
      setTimeout(() => {
        setAddedIds(prev => ({ ...prev, [resourceId]: false }));
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Could not add to cart');
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gemini Neural Matchmaker</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            AI Demand & Surplus Inventory Matcher
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Describe your manufacturing input requirements to find compatible surplus inventory lots in the database.
          </p>
        </div>
      </div>

      {/* Input Requirements Form */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <form onSubmit={handleMatch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Required Resource Keywords / Specifications *
              </label>
              <input
                type="text"
                required
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                placeholder="e.g. Mild steel sheets, HDPE drums 200L, CNC milling lathe..."
                className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Material Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="">Any Category</option>
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
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Desired Quantity
              </label>
              <input
                type="number"
                min="1"
                value={targetQuantity}
                onChange={e => setTargetQuantity(e.target.value)}
                placeholder="e.g. 50"
                className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Max Unit Budget (₹)
              </label>
              <input
                type="number"
                min="1"
                value={maxBudget}
                onChange={e => setMaxBudget(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Location Preference
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Maharashtra, Gujarat, Mumbai..."
                className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-1 flex items-end">
              <button
                type="submit"
                disabled={loading || !keywords}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{loading ? 'Analyzing...' : 'Find Matches'}</span>
              </button>
            </div>

          </div>
        </form>
      </div>

      {/* Results or Empty State */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          Scanning surplus database and comparing specifications...
        </div>
      ) : !results ? (
        <EmptyState
          title="No recommendations available yet. Add your requirements to receive recommendations."
          description="Specify your raw material, equipment, or packaging requirements in the form above to activate automated Gemini matching against verified listings."
          icon={Sparkles}
        />
      ) : results.matches.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
          <Info className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Direct Database Matches Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {results.summary || results.aiSummary || 'None of the active surplus listings in the database closely match the specified query.'}
          </p>
          <button
            onClick={() => navigate('/marketplace')}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold"
          >
            Browse All Available Surplus
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs leading-relaxed">
            <span className="font-bold block mb-0.5">Gemini Circular Match Analysis:</span>
            {results.summary || results.aiSummary}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.matches.map(m => {
              const isAdded = !!addedIds[m.resourceId];
              return (
                <div
                  key={m.resourceId}
                  onClick={() => navigate(`/resource/${m.resourceId}`)}
                  className="group cursor-pointer rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {m.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {m.matchScore}% Match
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                        {m.resourceName}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Verified Surplus Listing
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1">
                      <span className="font-semibold text-slate-800 block">Match Rationale:</span>
                      <p className="leading-snug">{m.reasoning}</p>
                    </div>

                    <div className="flex items-baseline justify-between pt-2">
                      <div>
                        <span className="text-lg font-extrabold text-slate-900">
                          ₹{m.sellingPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <span className="text-xs text-slate-600 font-medium">
                        Qty: {m.availableQuantity} units
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/resource/${m.resourceId}`);
                      }}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      View Details
                    </button>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleAddToCart(m.resourceId, 1);
                      }}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isAdded ? 'bg-emerald-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {isAdded ? <Check className="w-3 h-3" /> : <ShoppingCart className="w-3 h-3" />}
                      <span>{isAdded ? 'Added' : 'Add to Cart'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
