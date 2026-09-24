import React, { useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Sparkles, 
  Calculator, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  UploadCloud, 
  ShieldAlert,
  Leaf,
  Plus,
  Trash2,
  Copy,
  Check,
  Lock,
  Search,
  ExternalLink
} from 'lucide-react';
import { VerificationBanner } from '../../components/common/VerificationBanner';

export const AddResourcePage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { user, isVerified } = useAuth();
  const isSellerVerified = isVerified || user?.role === 'admin' || user?.verificationStatus === 'verified';

  // 14 Required Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unit, setUnit] = useState('');
  const [condition, setCondition] = useState('');
  const [originalPrice, setOriginalPrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [minOrderQuantity, setMinOrderQuantity] = useState<number | ''>('');
  const [location, setLocation] = useState(user?.city && user?.state ? `${user.city}, ${user.state}` : '');
  const [availability, setAvailability] = useState<'available' | 'reserved' | 'sold'>('available');
  const [resourceType, setResourceType] = useState<'for_sale' | 'donation'>('for_sale');
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [recyclabilityNotes, setRecyclabilityNotes] = useState('Audited industrial surplus lot diverted from disposal.');
  const [expiryDate, setExpiryDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);

  // AI States
  const [aiLoadingCategory, setAiLoadingCategory] = useState(false);
  const [aiLoadingDesc, setAiLoadingDesc] = useState(false);
  const [aiLoadingPrice, setAiLoadingPrice] = useState(false);
  const [aiLoadingDuplicate, setAiLoadingDuplicate] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [duplicateCheckedClean, setDuplicateCheckedClean] = useState(false);
  const [pricingSuggestion, setPricingSuggestion] = useState<any>(null);
  const [aiPriceConfirmedBySeller, setAiPriceConfirmedBySeller] = useState(false);
  const [categoryReasoning, setCategoryReasoning] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 1. AI Category Suggestion
  const handleAiSuggestCategory = async () => {
    if (!name.trim()) {
      setError('Please enter a resource title first before requesting AI category classification.');
      return;
    }
    try {
      setAiLoadingCategory(true);
      setError(null);
      const res = await api.aiSuggestCategory(name.trim());
      if (res.category) setCategory(res.category);
      if (res.suggestedUnit && !unit) setUnit(res.suggestedUnit);
      if (res.reasoning) setCategoryReasoning(res.reasoning);
    } catch (err: any) {
      setError(err.message || 'Category suggestion failed');
    } finally {
      setAiLoadingCategory(false);
    }
  };

  // 2. AI Description Generator
  const handleAiGenerateDescription = async () => {
    if (!name.trim()) {
      setError('Please enter a resource title first before generating B2B specifications.');
      return;
    }
    try {
      setAiLoadingDesc(true);
      setError(null);
      const res = await api.aiGenerateDescription({
        name: name.trim(),
        category: category || 'Raw Materials',
        condition: condition || 'Surplus / Unused',
        quantity: quantity !== '' ? Number(quantity) : undefined,
        unit: unit || 'units',
        originalPrice: originalPrice !== '' ? Number(originalPrice) : undefined,
        location: location || undefined
      });
      if (res.description) {
        let fullDesc = res.description;
        if (res.specifications && res.specifications.length > 0) {
          fullDesc += '\n\nKey Technical Specifications:\n• ' + res.specifications.join('\n• ');
        }
        if (res.sustainabilityHighlight) {
          fullDesc += '\n\nCircular Impact Highlight:\n' + res.sustainabilityHighlight;
          setRecyclabilityNotes(res.sustainabilityHighlight);
        }
        setDescription(fullDesc);
      }
    } catch (err: any) {
      setError(err.message || 'Description generation failed');
    } finally {
      setAiLoadingDesc(false);
    }
  };

  // 3. AI Smart Pricing
  // IMPORTANT: Suggestions do NOT automatically become the final price!
  const handleAiSmartPricing = async () => {
    if (originalPrice === '' || Number(originalPrice) <= 0) {
      setError('Please enter the original procurement cost (> 0) first to calculate AI Smart Pricing.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter a resource title first before calculating AI Smart Pricing.');
      return;
    }
    try {
      setAiLoadingPrice(true);
      setError(null);
      const res = await api.aiSmartPricing({
        name: name.trim(),
        category: category || 'Raw Materials',
        condition: condition || 'Surplus / Unused',
        quantity: quantity !== '' ? Number(quantity) : 1,
        originalPrice: Number(originalPrice),
        location: location || undefined
      });
      setPricingSuggestion(res);
      setAiPriceConfirmedBySeller(false);
      // NOTE: We deliberately do NOT overwrite sellingPrice here.
      // The seller reviews the valuation recommendation and explicitly clicks "Apply Recommended Price" or enters their own price.
    } catch (err: any) {
      setError(err.message || 'Smart pricing calculation failed');
    } finally {
      setAiLoadingPrice(false);
    }
  };

  // Seller explicitly confirms and applies the AI suggestion
  const handleConfirmAiPrice = () => {
    if (!pricingSuggestion) return;
    const suggested = pricingSuggestion.suggestedPrice || pricingSuggestion.recommendedPrice;
    if (suggested && suggested > 0) {
      setSellingPrice(suggested);
      setAiPriceConfirmedBySeller(true);
    }
  };

  // 4. AI Duplicate Check
  const handleCheckDuplicate = async () => {
    if (!name.trim()) return;
    try {
      setAiLoadingDuplicate(true);
      const res = await api.aiDuplicateCheck({ name: name.trim(), category: category || undefined });
      if (res.isDuplicate) {
        setDuplicateWarning(res.warningMessage || 'A listing with a very similar title already exists in your inventory.');
        setDuplicateCheckedClean(false);
      } else {
        setDuplicateWarning(null);
        setDuplicateCheckedClean(true);
      }
    } catch (err) {
      // Non-blocking duplicate check error
    } finally {
      setAiLoadingDuplicate(false);
    }
  };

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      setImages(prev => [...prev, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const handleRemoveImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Explicit validation of required fields
    if (!name.trim()) {
      setError('Resource title / Lot Name is required.');
      return;
    }
    if (!category) {
      setError('Please select a material category.');
      return;
    }
    if (!condition) {
      setError('Please select the physical condition of the resource.');
      return;
    }
    if (quantity === '' || Number(quantity) <= 0) {
      setError('Available quantity must be greater than 0.');
      return;
    }
    if (!unit) {
      setError('Please select a measurement unit.');
      return;
    }
    if (resourceType !== 'donation') {
      if (sellingPrice === '' || Number(sellingPrice) < 0) {
        setError('Please enter a valid selling price (≥ 0).');
        return;
      }
    }
    if (!description.trim()) {
      setError('Technical specifications / description is required.');
      return;
    }
    if (!location.trim()) {
      setError('Dispatch location / warehouse location is required.');
      return;
    }
    if (minOrderQuantity !== '' && Number(minOrderQuantity) > Number(quantity)) {
      setError('Minimum Order Quantity (MOQ) cannot exceed total available quantity.');
      return;
    }

    // Verified Seller Check
    if (!isSellerVerified) {
      setError('Business Verification Required: Only verified businesses can publish surplus listings to the live marketplace. Please complete regulatory verification on your Profile first.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const calculatedWeight = weightKg !== '' ? Number(weightKg) : Math.round(Number(quantity) * 2.5);
      const calculatedCo2 = Math.round(calculatedWeight * 1.85);

      await api.createResource({
        name: name.trim(),
        category,
        description: description.trim(),
        quantity: Number(quantity),
        unit,
        condition,
        originalPrice: originalPrice !== '' ? Number(originalPrice) : 0,
        sellingPrice: resourceType === 'donation' ? 0 : Number(sellingPrice),
        minOrderQuantity: minOrderQuantity !== '' ? Number(minOrderQuantity) : 1,
        location: location.trim(),
        availability,
        resourceType,
        expiryDate: expiryDate || undefined,
        images,
        sustainabilityInfo: {
          estimatedWeightKg: calculatedWeight,
          co2SavingsKg: calculatedCo2,
          recyclabilityNotes: recyclabilityNotes.trim() || 'Audited industrial surplus lot diverted from disposal.'
        }
      });

      setSuccessMessage('Listing published successfully to the live marketplace!');
      setTimeout(() => {
        navigate('/seller/resources');
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Failed to publish resource listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back button */}
      <button
        id="back-to-resources-btn"
        onClick={() => navigate('/seller/resources')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Surplus Resources</span>
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          List Surplus Resource
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Connect your industrial surplus lot to the live B2B circular marketplace with Gemini AI assistance.
        </p>
      </div>

      {/* Verification Compliance Banner */}
      <VerificationBanner />

      {/* Unverified Seller Notification */}
      {!isSellerVerified && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block text-sm">Business Verification Required to Publish</span>
            <p className="text-amber-800 leading-relaxed">
              Your company verification status is currently <span className="font-bold underline">{user?.verificationStatus || 'unverified'}</span>. 
              You can draft your listing and test Gemini AI features below, but publishing to the live marketplace requires an approved verification audit.
            </p>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:underline pt-1"
            >
              <span>Submit or view verification credentials on Profile</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
        
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {duplicateWarning && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-amber-950">AI Duplicate Warning:</span>
              <p className="mt-0.5 text-amber-800">{duplicateWarning}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Title, Category & Condition */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="resource-name-input" className="block text-xs font-bold text-slate-700">
                  Resource Name / Lot Title *
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCheckDuplicate}
                    disabled={aiLoadingDuplicate || !name.trim()}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-40"
                  >
                    <Search className="w-3 h-3" />
                    <span>{aiLoadingDuplicate ? 'Checking...' : 'Check Duplicates'}</span>
                  </button>
                  <button
                    type="button"
                    id="ai-classify-btn"
                    onClick={handleAiSuggestCategory}
                    disabled={aiLoadingCategory || !name.trim()}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 disabled:opacity-40"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{aiLoadingCategory ? 'Classifying...' : 'AI Auto-Classify'}</span>
                  </button>
                </div>
              </div>
              <input
                id="resource-name-input"
                type="text"
                required
                value={name}
                onBlur={handleCheckDuplicate}
                onChange={e => {
                  setName(e.target.value);
                  setDuplicateWarning(null);
                  setDuplicateCheckedClean(false);
                }}
                placeholder="e.g. Stainless Steel 304 Sheets (2mm x 1250mm x 2500mm)"
                className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              {duplicateCheckedClean && (
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-1">
                  <Check className="w-3 h-3" />
                  <span>Unique resource lot: No duplicate titles found in your inventory</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="resource-category-select" className="block text-xs font-bold text-slate-700">
                    Category *
                  </label>
                  {categoryReasoning && (
                    <span className="text-[10px] text-emerald-700 truncate max-w-[200px]" title={categoryReasoning}>
                      AI: {categoryReasoning}
                    </span>
                  )}
                </div>
                <select
                  id="resource-category-select"
                  required
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="" disabled>Select Category *</option>
                  <option value="Raw Materials">Raw Materials (Metals, Polymers, Chemicals)</option>
                  <option value="Packaging Materials">Packaging Materials (Boxes, Drums, Pallets)</option>
                  <option value="Machinery">Machinery (CNC, Lathes, Industrial Plants)</option>
                  <option value="Equipment">Equipment (Pumps, Compressors, Tools)</option>
                  <option value="Office Assets">Office Assets (IT Racks, Desks, Monitors)</option>
                  <option value="Electronics">Electronics (Components, Boards, Cables)</option>
                  <option value="Furniture">Furniture (Commercial Desks, Chairs, Racks)</option>
                  <option value="Construction Materials">Construction Materials (Beams, Pipes)</option>
                  <option value="Reusable Inventory">Reusable Inventory (Finished Overstock)</option>
                  <option value="Other">Other Surplus Asset</option>
                </select>
              </div>

              <div>
                <label htmlFor="resource-condition-select" className="block text-xs font-bold text-slate-700 mb-1">
                  Condition *
                </label>
                <select
                  id="resource-condition-select"
                  required
                  value={condition}
                  onChange={e => setCondition(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="" disabled>Select Condition *</option>
                  <option value="Brand New / Unopened">Brand New / Unopened Factory Packaging</option>
                  <option value="Surplus / Unused">Surplus / Unused Overstock</option>
                  <option value="Refurbished / Like New">Refurbished / Like New & Tested</option>
                  <option value="Like New">Like New / Open Box Inspection</option>
                  <option value="Used / Good">Used / Good Working Order</option>
                  <option value="Fair / Usable">Fair / Usable with Cosmetic Wear</option>
                  <option value="Salvage / Recyclable">Salvage / Recyclable Scrap Stream</option>
                  <option value="For Parts / Scrap">For Parts / Material Recovery</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Quantities, Measurement Unit & Minimum Order Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label htmlFor="resource-quantity-input" className="block text-xs font-bold text-slate-700 mb-1">
                Quantity *
              </label>
              <input
                id="resource-quantity-input"
                type="number"
                min="1"
                required
                value={quantity}
                placeholder="e.g. 50"
                onChange={e => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="resource-unit-select" className="block text-xs font-bold text-slate-700 mb-1">
                Unit of Measurement *
              </label>
              <select
                id="resource-unit-select"
                required
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="" disabled>Select Unit *</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="tonnes">Metric Tonnes</option>
                <option value="units">Units / Pieces</option>
                <option value="meters">Meters (m)</option>
                <option value="litres">Litres (L)</option>
                <option value="pallets">Pallets</option>
                <option value="boxes">Boxes</option>
                <option value="sets">Sets</option>
              </select>
            </div>

            <div>
              <label htmlFor="resource-moq-input" className="block text-xs font-bold text-slate-700 mb-1">
                Minimum Order Quantity (MOQ)
              </label>
              <input
                id="resource-moq-input"
                type="number"
                min="1"
                value={minOrderQuantity}
                placeholder="e.g. 1"
                onChange={e => setMinOrderQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 3: Pricing, Resource Type & AI Smart Pricing Review */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Resource Type & Pricing
              </h3>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="resourceTypeRadio"
                    checked={resourceType === 'for_sale'}
                    onChange={() => setResourceType('for_sale')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Commercial Surplus Sale</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-emerald-700 cursor-pointer">
                  <input
                    type="radio"
                    name="resourceTypeRadio"
                    checked={resourceType === 'donation'}
                    onChange={() => setResourceType('donation')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Free Circular Donation</span>
                </label>
              </div>
            </div>

            {resourceType !== 'donation' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="resource-original-price-input" className="block text-xs font-bold text-slate-700">
                        Original Procurement Price (₹ / {unit || 'unit'})
                      </label>
                      <button
                        type="button"
                        id="ai-pricing-btn"
                        onClick={handleAiSmartPricing}
                        disabled={aiLoadingPrice || originalPrice === '' || Number(originalPrice) <= 0}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 disabled:opacity-40"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>{aiLoadingPrice ? 'Calculating...' : 'AI Smart Pricing'}</span>
                      </button>
                    </div>
                    <input
                      id="resource-original-price-input"
                      type="number"
                      min="0"
                      value={originalPrice}
                      placeholder="e.g. 1200"
                      onChange={e => {
                        setOriginalPrice(e.target.value === '' ? '' : Number(e.target.value));
                        setPricingSuggestion(null);
                        setAiPriceConfirmedBySeller(false);
                      }}
                      className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Procurement cost or retail MSRP per unit</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="resource-selling-price-input" className="block text-xs font-bold text-slate-700">
                        Selling Price (₹ / {unit || 'unit'}) *
                      </label>
                      {aiPriceConfirmedBySeller && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <Check className="w-3 h-3" />
                          <span>AI Suggestion Confirmed</span>
                        </span>
                      )}
                    </div>
                    <input
                      id="resource-selling-price-input"
                      type="number"
                      min="0"
                      required
                      value={sellingPrice}
                      placeholder="e.g. 750"
                      onChange={e => {
                        setSellingPrice(e.target.value === '' ? '' : Number(e.target.value));
                        setAiPriceConfirmedBySeller(false);
                      }}
                      className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-900"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Your confirmed secondary market price</span>
                  </div>
                </div>

                {/* AI Valuation Recommendation Card (Seller must review & confirm) */}
                {pricingSuggestion && (
                  <div className="p-4 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-950 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/70 pb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-slate-900">Gemini Valuation Recommendation (Review & Confirm):</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-extrabold text-emerald-800">
                          Suggested: ₹{pricingSuggestion.suggestedPrice || pricingSuggestion.recommendedPrice} / {unit || 'unit'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-900 text-[10px] font-bold">
                          {pricingSuggestion.circularSavingsPercentage || pricingSuggestion.estimatedDiscountPercent}% Discount
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-emerald-900">
                      <div>
                        <span className="font-semibold text-slate-700">Recommended Price Range: </span>
                        <span>₹{pricingSuggestion.minPrice || Math.round(pricingSuggestion.suggestedPrice * 0.85)} – ₹{pricingSuggestion.maxPrice || Math.round(pricingSuggestion.suggestedPrice * 1.15)}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Market Clearance Confidence: </span>
                        <span>{Math.round((pricingSuggestion.confidenceScore || 0.88) * 100)}%</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-emerald-800 leading-relaxed bg-white/70 p-2.5 rounded-lg border border-emerald-100">
                      <span className="font-bold">Economic Rationale: </span>
                      {pricingSuggestion.marketRationale || pricingSuggestion.reasoning}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-600 italic">
                        * AI suggestions do not automatically become final. Confirm to apply.
                      </span>
                      <button
                        type="button"
                        id="apply-ai-price-btn"
                        onClick={handleConfirmAiPrice}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Apply Recommended Price (₹{pricingSuggestion.suggestedPrice || pricingSuggestion.recommendedPrice})</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Section 4: Technical Description & AI Generator */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="resource-description-textarea" className="block text-xs font-bold text-slate-700">
                Technical Description & Specifications *
              </label>
              <button
                type="button"
                id="ai-generate-specs-btn"
                onClick={handleAiGenerateDescription}
                disabled={aiLoadingDesc || !name.trim()}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 disabled:opacity-40"
              >
                <Sparkles className="w-3 h-3" />
                <span>{aiLoadingDesc ? 'Drafting Specifications...' : 'AI Generate B2B Specs'}</span>
              </button>
            </div>
            <textarea
              id="resource-description-textarea"
              rows={5}
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Provide alloy grade, manufacturing dimensions, testing standards, packaging, batch lot number, or handling specifications..."
              className="w-full text-xs rounded-xl border border-slate-300 p-3.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Section 5: Location, Availability & Expiry */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label htmlFor="resource-location-input" className="block text-xs font-bold text-slate-700 mb-1">
                Dispatch Location / Warehouse *
              </label>
              <input
                id="resource-location-input"
                type="text"
                required
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Navi Mumbai Industrial Hub, Maharashtra"
                className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="resource-availability-select" className="block text-xs font-bold text-slate-700 mb-1">
                Listing Availability *
              </label>
              <select
                id="resource-availability-select"
                required
                value={availability}
                onChange={e => setAvailability(e.target.value as any)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="available">Available for Immediate Procurement</option>
                <option value="reserved">Reserved / Under Contract Review</option>
                <option value="sold">Sold / Depleted</option>
              </select>
            </div>

            <div>
              <label htmlFor="resource-expiry-input" className="block text-xs font-bold text-slate-700 mb-1">
                Shelf Life / Expiry Date (Optional)
              </label>
              <input
                id="resource-expiry-input"
                type="date"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 6: Sustainability Information (Circular Metrics) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <span>Circular Sustainability & Waste Diversion Metrics</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="resource-weight-input" className="block text-xs font-medium text-slate-700 mb-1">
                  Estimated Total Weight (kg)
                </label>
                <input
                  id="resource-weight-input"
                  type="number"
                  min="0"
                  value={weightKg}
                  placeholder={quantity ? `${Math.round(Number(quantity) * 2.5)} kg (calculated)` : 'e.g. 250'}
                  onChange={e => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Diverts ~{weightKg !== '' ? Math.round(Number(weightKg) * 1.85) : quantity ? Math.round(Number(quantity) * 2.5 * 1.85) : 0} kg CO2e from landfill
                </span>
              </div>

              <div>
                <label htmlFor="resource-recyclability-notes" className="block text-xs font-medium text-slate-700 mb-1">
                  Sustainability & Recyclability Notes
                </label>
                <input
                  id="resource-recyclability-notes"
                  type="text"
                  value={recyclabilityNotes}
                  onChange={e => setRecyclabilityNotes(e.target.value)}
                  placeholder="e.g. 100% recyclable alloy, closed-loop industrial material"
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 7: Optional Images */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-slate-700">
              Lot Images / Inspection Photos (Optional)
            </label>
            <div className="flex gap-2">
              <input
                id="resource-image-url-input"
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... or lot photo URL"
                className="flex-1 text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                id="add-image-btn"
                onClick={handleAddImage}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
              >
                Add Image
              </button>
            </div>

            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {images.map((img, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 group">
                    <img src={img} alt={`lot-${i}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="absolute inset-0 bg-rose-900/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submission Bar */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              {isSellerVerified ? (
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <Check className="w-4 h-4" />
                  <span>Corporate seller verified. Ready to publish to live marketplace.</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
                  <Lock className="w-4 h-4" />
                  <span>Requires verified seller account to activate live marketplace listing.</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/seller/resources')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                id="submit-resource-btn"
                type="submit"
                disabled={submitting || !isSellerVerified}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <span>Publishing to Firestore...</span>
                ) : !isSellerVerified ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Verification Required</span>
                  </>
                ) : (
                  <span>Publish Surplus Resource</span>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
