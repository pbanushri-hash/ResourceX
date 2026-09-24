import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Resource } from '../../types';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { 
  MapPin, 
  Building2, 
  ShieldCheck, 
  Layers, 
  Package, 
  Leaf, 
  MessageSquare, 
  ShoppingCart, 
  Check, 
  ArrowLeft, 
  Calendar,
  AlertCircle,
  Truck
} from 'lucide-react';
import { ContactSellerModal } from '../../components/modals/ContactSellerModal';

interface ResourceDetailsPageProps {
  resourceId: string;
  navigate: (path: string) => void;
}

export const ResourceDetailsPage: React.FC<ResourceDetailsPageProps> = ({ resourceId, navigate }) => {
  const { addItem } = useCart();
  const { user, isAuthenticated, role } = useAuth();
  
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderQty, setOrderQty] = useState<number>(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.getResourceById(resourceId)
      .then(data => {
        if (data) {
          setResource(data);
          setOrderQty(data.minOrderQuantity || 1);
        } else {
          setError('Listing not found');
        }
      })
      .catch(err => setError(err.message || 'Listing not found'))
      .finally(() => setLoading(false));
  }, [resourceId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-slate-400">
        Loading verified resource listing details...
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">Resource Unavailable</h2>
        <p className="text-xs text-slate-500">{error || 'This surplus resource listing does not exist or has been removed.'}</p>
        <button
          onClick={() => navigate('/marketplace')}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  const isDonation = resource.resourceType === 'donation';
  const discount = resource.originalPrice && resource.originalPrice > resource.sellingPrice
    ? Math.round(((resource.originalPrice - resource.sellingPrice) / resource.originalPrice) * 100)
    : null;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await addItem(resource.id, orderQty);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to add item to cart');
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await addItem(resource.id, orderQty);
      navigate('/buyer/cart');
    } catch (err: any) {
      alert(err.message || 'Failed to initiate purchase');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back button */}
      <button
        onClick={() => navigate('/marketplace')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Marketplace</span>
      </button>

      {/* Main Grid: Gallery & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Visual Assets / Images (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-4/3 w-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center">
            {resource.images && resource.images.length > 0 ? (
              <img
                src={resource.images[activeImageIdx] || resource.images[0]}
                alt={resource.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <Layers className="w-16 h-16 stroke-[1.2]" />
                <span className="text-xs font-semibold uppercase tracking-wider">{resource.category}</span>
              </div>
            )}

            {discount && (
              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-xs font-extrabold bg-amber-500 text-white shadow-xs">
                {discount}% SECONDARY DISCOUNT
              </span>
            )}
          </div>

          {resource.images && resource.images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {resource.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    activeImageIdx === idx ? 'border-emerald-600 shadow-xs' : 'border-slate-200 opacity-70'
                  }`}
                >
                  <img src={img} alt="thumb" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Environmental Scope 3 Divert Card */}
          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <span>Circular Economy & ESG Scope 3 Impact</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-emerald-100">
                <span className="text-[10px] text-slate-500 block">Diverted Waste</span>
                <span className="font-extrabold text-emerald-800 text-sm">
                  {resource.sustainabilityInfo?.estimatedWeightKg || Math.round(resource.quantity * 2)} kg
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-emerald-100">
                <span className="text-[10px] text-slate-500 block">Avoided Carbon (CO₂e)</span>
                <span className="font-extrabold text-emerald-800 text-sm">
                  {resource.sustainabilityInfo?.co2SavingsKg || Math.round(resource.quantity * 3.5)} kg
                </span>
              </div>
            </div>
            {resource.sustainabilityInfo?.recyclabilityNotes && (
              <p className="text-[11px] text-emerald-800/90 leading-tight italic">
                "{resource.sustainabilityInfo.recyclabilityNotes}"
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Specifications & Procurement Actions (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Header & Badges */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                {resource.category}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                {resource.condition}
              </span>
              {isDonation && (
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
                  Donation Resource
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {resource.name}
            </h1>

            {/* Seller Company Card */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Building2 className="w-4 h-4 text-slate-500" />
                <span>{resource.sellerCompanyName}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{resource.location}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Entity</span>
              </div>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Secondary B2B Price</span>
                {isDonation ? (
                  <span className="text-3xl font-extrabold text-emerald-700">Free / Donation</span>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900">
                      ₹{resource.sellingPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-sm font-medium text-slate-500">per {resource.unit}</span>
                    {resource.originalPrice && resource.originalPrice > resource.sellingPrice && (
                      <span className="text-sm text-slate-400 line-through">
                        ₹{resource.originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">Availability</span>
                <span className="text-sm font-bold text-emerald-700 uppercase">
                  {resource.availability} ({resource.quantity.toLocaleString('en-IN')} {resource.unit} left)
                </span>
              </div>
            </div>

            {/* Quantity and Order Controls */}
            {role !== 'admin' && (
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Purchase Quantity ({resource.unit})
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min={resource.minOrderQuantity || 1}
                        max={resource.quantity}
                        value={orderQty}
                        onChange={e => setOrderQty(Math.max(resource.minOrderQuantity || 1, Math.min(resource.quantity, Number(e.target.value))))}
                        className="w-32 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                      />
                      <span className="ml-2 text-xs text-slate-500 font-medium">
                        (Min MOQ: {resource.minOrderQuantity || 1} {resource.unit})
                      </span>
                    </div>
                  </div>

                  {!isDonation && (
                    <div className="ml-auto text-right">
                      <span className="text-xs text-slate-400 block">Subtotal</span>
                      <span className="text-base font-extrabold text-slate-900">
                        ₹{(orderQty * resource.sellingPrice).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    id="btn-add-to-cart-detail"
                    onClick={handleAddToCart}
                    className={`flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-xs ${
                      added ? 'bg-emerald-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {added ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added to Cart</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>

                  <button
                    id="btn-buy-now-detail"
                    onClick={handleBuyNow}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Buy Now</span>
                  </button>

                  <button
                    id="btn-contact-supplier-detail"
                    onClick={() => setContactModalOpen(true)}
                    className="px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Inquire</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Description & Specs Section */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Technical Description & Lot Notes
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {resource.description || 'No additional technical notes provided for this surplus inventory lot.'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Material Category</span>
                <span className="font-semibold text-slate-800">{resource.category}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Physical Condition</span>
                <span className="font-semibold text-slate-800">{resource.condition}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Dispatch Location</span>
                <span className="font-semibold text-slate-800">{resource.location}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Listing Date</span>
                <span className="font-semibold text-slate-800">
                  {new Date(resource.createdAt).toLocaleDateString()}
                </span>
              </div>
              {resource.expiryDate && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Material Shelf Life</span>
                  <span className="font-semibold text-slate-800">{resource.expiryDate}</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Direct inquiry modal */}
      <ContactSellerModal
        resource={resource}
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />

    </div>
  );
};
