import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Resource } from '../../types';
import { 
  Layers, 
  PackagePlus, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Check,
  X
} from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { VerificationBanner } from '../../components/common/VerificationBanner';

export const SellerResourcesPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const data = await api.getSellerResources();
      setResources(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const confirmDelete = async (id: string) => {
    try {
      setErrorMessage(null);
      await api.deleteResource(id);
      setResources(prev => prev.filter(r => r.id !== id));
      setDeletingId(null);
      setSuccessMessage('Surplus listing removed from active marketplace.');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete listing');
    }
  };

  const handleToggleAvailability = async (resource: Resource) => {
    const nextAvailability = resource.availability === 'available' ? 'reserved' : 'available';
    try {
      setErrorMessage(null);
      const updated = await api.updateResource(resource.id, { availability: nextAvailability });
      setResources(prev => prev.map(r => r.id === resource.id ? updated : r));
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update availability');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Surplus Inventory & Assets
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your company's circular listings, stock availability, and specifications.
          </p>
        </div>

        <button
          id="seller-list-surplus-btn"
          onClick={() => navigate('/seller/add-resource')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
        >
          <PackagePlus className="w-4 h-4" />
          <span>List Surplus Resource</span>
        </button>
      </div>

      <VerificationBanner />

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading inventory catalog from Firestore...</div>
      ) : resources.length === 0 ? (
        <EmptyState
          title="No resources listed yet."
          description="Start by adding your first surplus resource. Use Gemini AI to auto-classify categories, write B2B technical specs, and calculate smart circular pricing."
          icon={Layers}
          actionLabel="List Surplus Resource"
          onAction={() => navigate('/seller/add-resource')}
        />
      ) : (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-2">Resource Listing</th>
                  <th className="pb-3 px-2">Category</th>
                  <th className="pb-3 px-2">Inventory Stock</th>
                  <th className="pb-3 px-2">Price / Unit</th>
                  <th className="pb-3 px-2">Availability</th>
                  <th className="pb-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resources.map(res => (
                  <tr key={res.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-2">
                      <div className="font-bold text-slate-900 line-clamp-1">{res.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>Condition: {res.condition}</span>
                        <span>•</span>
                        <span>Location: {res.location}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-2">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {res.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-2">
                      <span className="font-semibold text-slate-800">
                        {res.quantity.toLocaleString('en-IN')} {res.unit}
                      </span>
                      <span className="text-[10px] text-slate-400 block">MOQ: {res.minOrderQuantity || 1}</span>
                    </td>

                    <td className="py-3.5 px-2">
                      <span className="font-extrabold text-slate-900">
                        {res.resourceType === 'donation' ? 'Free Donation' : `₹${res.sellingPrice.toLocaleString('en-IN')}`}
                      </span>
                      {res.originalPrice && res.originalPrice > res.sellingPrice && (
                        <span className="text-[10px] text-slate-400 block line-through">₹{res.originalPrice}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-2">
                      <button
                        onClick={() => handleToggleAvailability(res)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                          res.availability === 'available'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                        }`}
                        title="Click to toggle availability"
                      >
                        {res.availability.toUpperCase()}
                      </button>
                    </td>

                    <td className="py-3.5 px-2 text-right">
                      {deletingId === res.id ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-[11px] text-rose-600 font-bold">Confirm delete?</span>
                          <button
                            onClick={() => confirmDelete(res.id)}
                            className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/resource/${res.id}`)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                            title="View on Marketplace"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(res.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Delete Listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
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
