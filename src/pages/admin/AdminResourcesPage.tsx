import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Resource } from '../../types';
import { Layers, Trash2, Eye, Search, Filter } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';

export const AdminResourcesPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchResources = async () => {
    try {
      setLoading(true);
      const data = await api.getResources();
      setResources(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Admin Action: Are you sure you want to remove listing "${name}" from the platform?`)) return;
    try {
      await api.deleteResource(id);
      setResources(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete listing');
    }
  };

  const filtered = resources.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.sellerCompanyName.toLowerCase().includes(search.toLowerCase()) ||
    r.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Platform Surplus Catalog Moderation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit listed industrial resources, verify spec compliance, and remove non-conforming items.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search resources, sellers..."
            className="pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading platform listings...</div>
      ) : resources.length === 0 ? (
        <EmptyState
          title="No resources listed yet."
          description="There are currently no surplus resources listed across any supplier on the platform."
          icon={Layers}
        />
      ) : (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-2">Listing Title</th>
                  <th className="pb-3 px-2">Supplier Enterprise</th>
                  <th className="pb-3 px-2">Category</th>
                  <th className="pb-3 px-2">Stock Volume</th>
                  <th className="pb-3 px-2">Price</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(res => (
                  <tr key={res.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-2">
                      <div className="font-bold text-slate-900">{res.name}</div>
                      <div className="text-[11px] text-slate-400">{res.location}</div>
                    </td>

                    <td className="py-3 px-2 font-semibold text-slate-700">
                      {res.sellerCompanyName}
                    </td>

                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {res.category}
                      </span>
                    </td>

                    <td className="py-3 px-2">
                      {res.quantity.toLocaleString('en-IN')} {res.unit}
                    </td>

                    <td className="py-3 px-2 font-extrabold text-slate-900">
                      ₹{res.sellingPrice.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-2">
                      <span className={`text-[11px] font-bold ${
                        res.availability === 'available' ? 'text-emerald-600' : 'text-slate-400'
                      }`}>
                        {res.availability.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/resource/${res.id}`)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                          title="Inspect Listing"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(res.id, res.name)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50"
                          title="Moderate & Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
