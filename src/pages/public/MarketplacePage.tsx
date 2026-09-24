import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Resource } from '../../types';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, 
  Filter, 
  Store, 
  MapPin, 
  Layers, 
  ShieldCheck, 
  Tag, 
  ShoppingCart, 
  ArrowUpDown, 
  Check, 
  X,
  ExternalLink,
  PackagePlus
} from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';

interface MarketplacePageProps {
  navigate: (path: string) => void;
  initialCategory?: string;
}

export const MarketplacePage: React.FC<MarketplacePageProps> = ({ navigate, initialCategory }) => {
  const { addItem } = useCart();
  const { isAuthenticated, role } = useAuth();
  
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory || '');
  const [condition, setCondition] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [location, setLocation] = useState('');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [availability, setAvailability] = useState('All');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'newest'>('newest');
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const categories = [
    'All Categories',
    'Raw Materials',
    'Packaging Materials',
    'Machinery',
    'Equipment',
    'Office Assets',
    'Electronics',
    'Reusable Inventory'
  ];

  const conditions = [
    'All Conditions',
    'Surplus / Unused',
    'Like New',
    'Refurbished',
    'Fair / Usable',
    'For Parts / Scrap'
  ];

  const fetchResources = async () => {
    try {
      setLoading(true);
      const data = await api.getResources({
        search: search.trim() || undefined,
        category: category && category !== 'All Categories' ? category : undefined,
        condition: condition && condition !== 'All Conditions' ? condition : undefined,
        resourceType: resourceType || undefined,
        location: location.trim() || undefined,
        minPrice: minPrice !== '' ? Number(minPrice) : undefined,
        maxPrice: maxPrice !== '' ? Number(maxPrice) : undefined,
        availability: availability !== 'All' ? availability : undefined,
        sortBy
      });
      setResources(data);
    } catch (err) {
      console.error('Failed to load marketplace resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [category, condition, resourceType, location, minPrice, maxPrice, availability, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResources();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setCondition('');
    setResourceType('');
    setLocation('');
    setMinPrice('');
    setMaxPrice('');
    setAvailability('All');
    setSortBy('newest');
  };

  const handleAddToCart = async (e: React.MouseEvent, resource: Resource) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await addItem(resource.id, resource.minOrderQuantity || 1);
      setAddedIds(prev => ({ ...prev, [resource.id]: true }));
      setTimeout(() => {
        setAddedIds(prev => ({ ...prev, [resource.id]: false }));
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Could not add to cart');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Surplus Resource Marketplace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse verified commercial surplus materials, equipment, and manufacturing assets.
          </p>
        </div>

        {isAuthenticated && (role === 'seller' || role === 'admin') && (
          <button
            onClick={() => navigate('/seller/add-resource')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
          >
            <PackagePlus className="w-4 h-4" />
            <span>List Surplus Resource</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="marketplace-search-input"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search surplus by keyword, material grade, or equipment model..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              Search
            </button>

            {(search || category || condition || resourceType || location || minPrice !== '' || maxPrice !== '' || availability !== 'All') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs flex items-center gap-1"
                title="Reset all filters"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </form>

        {/* Categories Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {categories.map(cat => {
            const isSelected = (cat === 'All Categories' && !category) || category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat === 'All Categories' ? '' : cat)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  isSelected 
                    ? 'bg-emerald-700 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Secondary Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Condition:</span>
              <select
                value={condition}
                onChange={e => setCondition(e.target.value)}
                className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              >
                {conditions.map(c => (
                  <option key={c} value={c === 'All Conditions' ? '' : c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Type:</span>
              <select
                value={resourceType}
                onChange={e => setResourceType(e.target.value)}
                className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              >
                <option value="">All Listings</option>
                <option value="for_sale">Commercial Sale</option>
                <option value="donation">Donation / Free Surplus</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Availability:</span>
              <select
                value={availability}
                onChange={e => setAvailability(e.target.value)}
                className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              >
                <option value="All">All Status</option>
                <option value="available">In Stock</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Depleted / Sold</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Location:</span>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Filter by city/state..."
                className="w-36 rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-medium">Price (₹):</span>
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Min"
                className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              />
              <span className="text-slate-400">-</span>
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Max"
                className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white font-medium"
            >
              <option value="newest">Newest Listed</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Listings */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          Loading surplus catalog...
        </div>
      ) : resources.length === 0 ? (
        <EmptyState
          id="marketplace-empty-state"
          title="No surplus resources are currently available."
          description="There are currently no active listings matching your query. As registered businesses list surplus lots, they will appear here immediately."
          icon={Store}
          actionLabel={isAuthenticated ? "List Your Surplus Inventory" : "Register to List Surplus"}
          onAction={() => navigate(isAuthenticated ? '/seller/add-resource' : '/register')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map(resource => {
            const isAdded = !!addedIds[resource.id];
            const isDonation = resource.resourceType === 'donation';
            const discount = resource.originalPrice && resource.originalPrice > resource.sellingPrice
              ? Math.round(((resource.originalPrice - resource.sellingPrice) / resource.originalPrice) * 100)
              : null;

            return (
              <div
                key={resource.id}
                id={`resource-card-${resource.id}`}
                onClick={() => navigate(`/resource/${resource.id}`)}
                className="group cursor-pointer rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Image / Banner */}
                  <div className="relative h-44 w-full bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-100">
                    {resource.images && resource.images.length > 0 ? (
                      <img
                        src={resource.images[0]}
                        alt={resource.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-slate-400 flex flex-col items-center gap-1">
                        <Layers className="w-10 h-10 stroke-[1.2]" />
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          {resource.category}
                        </span>
                      </div>
                    )}

                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-900/80 backdrop-blur-xs text-white">
                        {resource.category}
                      </span>
                      {isDonation && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white">
                          Free Surplus
                        </span>
                      )}
                    </div>

                    {discount && (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                        {discount}% OFF
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-1">
                        {resource.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{resource.sellerCompanyName} • {resource.location}</span>
                      </div>
                    </div>

                    {/* Condition & Lot specifications */}
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        Condition: {resource.condition}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        Qty: {resource.quantity.toLocaleString('en-IN')} {resource.unit}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium">
                        MOQ: {resource.minOrderQuantity || 1} {resource.unit}
                      </span>
                    </div>

                    {resource.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {resource.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer: Price & Cart */}
                <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    {isDonation ? (
                      <div>
                        <span className="text-base font-extrabold text-emerald-700">Donation</span>
                        <p className="text-[10px] text-slate-400">Zero Commercial Cost</p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-extrabold text-slate-900">
                            ₹{resource.sellingPrice.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[11px] text-slate-500">/ {resource.unit}</span>
                        </div>
                        {resource.originalPrice && resource.originalPrice > resource.sellingPrice && (
                          <span className="text-[11px] text-slate-400 line-through">
                            ₹{resource.originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {role !== 'admin' && (
                    <button
                      id={`card-add-cart-${resource.id}`}
                      onClick={e => handleAddToCart(e, resource)}
                      className={`inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
