import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  PackagePlus, 
  Layers, 
  ShoppingBag, 
  Sparkles, 
  Calculator, 
  BarChart3, 
  MessageSquare, 
  UserCheck, 
  Users, 
  ShieldCheck, 
  FileCheck, 
  Store, 
  ShoppingCart,
  Building2,
  Leaf
} from 'lucide-react';
import { VerificationBadge } from '../common/StatusBadge';

interface SidebarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

interface SidebarLink {
  label: string;
  path: string;
  icon: any;
  badge?: string;
  highlight?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, navigate }) => {
  const { user, role, verificationStatus } = useAuth();

  if (!user) return null;

  const buyerLinks: SidebarLink[] = [
    { label: 'Dashboard', path: '/buyer/dashboard', icon: LayoutDashboard },
    { label: 'Browse Marketplace', path: '/marketplace', icon: Store },
    { label: 'AI Recommendations', path: '/buyer/recommendations', icon: Sparkles, badge: 'AI' },
    { label: 'Cart & Procurement', path: '/buyer/cart', icon: ShoppingCart },
    { label: 'My Orders', path: '/buyer/orders', icon: ShoppingBag },
    { label: 'Messages', path: '/messages', icon: MessageSquare },
    { label: 'Company Profile', path: '/profile', icon: Building2 },
  ];

  const sellerLinks: SidebarLink[] = [
    { label: 'Dashboard', path: '/seller/dashboard', icon: LayoutDashboard },
    { label: 'My Surplus Resources', path: '/seller/resources', icon: Layers },
    { label: 'List Surplus Resource', path: '/seller/add-resource', icon: PackagePlus, highlight: true },
    { label: 'Customer Orders', path: '/seller/orders', icon: ShoppingBag },
    { label: 'AI Smart Pricing', path: '/seller/ai-pricing', icon: Calculator, badge: 'AI' },
    { label: 'AI Demand Matching', path: '/buyer/recommendations', icon: Sparkles, badge: 'AI' },
    { label: 'Resource Analytics', path: '/seller/analytics', icon: BarChart3 },
    { label: 'Messages', path: '/messages', icon: MessageSquare },
    { label: 'Company Profile', path: '/profile', icon: Building2 },
  ];

  const adminLinks: SidebarLink[] = [
    { label: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Business Verification', path: '/admin/verifications', icon: FileCheck, badge: 'Gov' },
    { label: 'User Directory', path: '/admin/users', icon: Users },
    { label: 'Manage Resources', path: '/admin/resources', icon: Layers },
    { label: 'All Platform Orders', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Platform Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: 'Circular Economy ESG', path: '/sustainability', icon: Leaf },
  ];

  const currentRole = (user?.role === 'admin' || role === 'admin')
    ? 'admin'
    : (user?.role === 'seller' || role === 'seller')
    ? 'seller'
    : 'buyer';

  const links: SidebarLink[] = currentRole === 'admin' ? adminLinks : currentRole === 'seller' ? sellerLinks : buyerLinks;

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex">
      <div>
        {/* Company Card in Sidebar */}
        <div className="p-3.5 mb-5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-2 mb-1.5">
            <Building2 className="w-4 h-4 text-slate-700" />
            <span className="text-xs font-bold text-slate-800 truncate">
              {user.companyName || user.name}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Role: {currentRole}
            </span>
            {currentRole !== 'admin' && verificationStatus && (
              <VerificationBadge status={verificationStatus} />
            )}
          </div>
        </div>

        {/* Section Navigation Header */}
        <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          {currentRole === 'admin' ? 'Administration' : currentRole === 'seller' ? 'Seller Workspace' : 'Buyer Workspace'}
        </p>

        {/* Links */}
        <nav className="space-y-1">
          {links.map(link => {
            const Icon = link.icon;
            const isActive = currentPath === link.path;
            return (
              <button
                key={link.path}
                id={`sidebar-link-${link.path.replace(/[^a-zA-Z0-9]/g, '-')}`}
                onClick={() => navigate(link.path)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                } ${link.highlight && !isActive ? 'text-emerald-700 font-bold bg-emerald-50/50' : ''}`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                    isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sustainability Quick Tip / ESG badge */}
      <div className="pt-4 border-t border-slate-200">
        <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100 text-emerald-950">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-1">
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zero Waste Policy</span>
          </div>
          <p className="text-[11px] text-emerald-700/90 leading-tight">
            All surplus listings comply with verified circular B2B material traceability.
          </p>
        </div>
      </div>
    </aside>
  );
};
