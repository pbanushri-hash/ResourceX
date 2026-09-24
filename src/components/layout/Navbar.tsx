import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { 
  Recycle, 
  ShoppingCart, 
  Bell, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck, 
  Sparkles, 
  Building2, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { Notification } from '../../types';
import { api } from '../../services/api';
import { VerificationBadge } from '../common/StatusBadge';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const { user, isAuthenticated, role, logout } = useAuth();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      api.getNotifications().then(data => {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }).catch(() => {});
    }
  }, [isAuthenticated, currentPath]);

  const handleMarkRead = async (id: string, link?: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      if (link) {
        setNotificationsOpen(false);
        navigate(link);
      }
    } catch (e) {}
  };

  const currentRole = (user?.role === 'admin' || role === 'admin')
    ? 'admin'
    : (user?.role === 'seller' || role === 'seller')
    ? 'seller'
    : 'buyer';

  const getDashboardPath = () => {
    if (currentRole === 'admin') return '/admin/dashboard';
    if (currentRole === 'seller') return '/seller/dashboard';
    return '/buyer/dashboard';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <button 
              id="brand-logo-btn"
              onClick={() => navigate('/')} 
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-400 group-hover:bg-slate-800 transition-colors shadow-xs">
                <Recycle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-extrabold tracking-tight text-slate-900 font-sans">
                    Resource<span className="text-emerald-600">X</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    B2B
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium tracking-tight -mt-0.5">
                  Circular Enterprise Hub
                </p>
              </div>
            </button>

            {/* Public Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                id="nav-link-marketplace"
                onClick={() => navigate('/marketplace')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPath === '/marketplace' || currentPath.startsWith('/resource/') 
                    ? 'text-emerald-700 bg-emerald-50/60 font-semibold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                Marketplace
              </button>
              <button
                id="nav-link-sustainability"
                onClick={() => navigate('/sustainability')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPath === '/sustainability' 
                    ? 'text-emerald-700 bg-emerald-50/60 font-semibold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                Circular Impact
              </button>
              <button
                id="nav-link-how-it-works"
                onClick={() => navigate('/how-it-works')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPath === '/how-it-works' 
                    ? 'text-emerald-700 bg-emerald-50/60 font-semibold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                How It Works
              </button>
              <button
                id="nav-link-about"
                onClick={() => navigate('/about')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPath === '/about' 
                    ? 'text-emerald-700 bg-emerald-50/60 font-semibold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                About
              </button>
            </nav>
          </div>

          {/* Right Action Icons & Auth Controls */}
          <div className="flex items-center gap-3">
            
            {/* Shopping Cart Icon (for buyers or public) */}
            {currentRole !== 'admin' && (
              <button
                id="nav-cart-btn"
                onClick={() => navigate(isAuthenticated ? '/buyer/cart' : '/login')}
                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Procurement Cart"
                aria-label="Procurement Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-xs">
                    {totalItems}
                  </span>
                )}
              </button>
            )}

            {/* Notifications Menu (if logged in) */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  id="nav-notifications-btn"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white"></span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800">Notifications</span>
                      <span className="text-xs text-slate-500">{notifications.length} total</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => handleMarkRead(n.id, n.link)}
                            className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${!n.read ? 'bg-emerald-50/40' : ''}`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                              <span className="text-[10px] text-slate-400">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1 leading-snug">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Authenticated User Quick View / Profile */}
            {isAuthenticated && user ? (
              <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-slate-200">
                <button
                  id="nav-dashboard-shortcut"
                  onClick={() => navigate(getDashboardPath())}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs"
                >
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{currentRole === 'admin' ? 'Admin Hub' : currentRole === 'seller' ? 'Seller Hub' : 'Buyer Hub'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    id="nav-profile-btn"
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-left transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left hidden lg:block">
                      <p className="text-xs font-semibold text-slate-800 leading-none truncate max-w-[120px]">
                        {user.companyName || user.name}
                      </p>
                      <p className="text-[10px] text-slate-500 capitalize mt-0.5 leading-none">
                        {currentRole}
                      </p>
                    </div>
                  </button>

                  <button
                    id="nav-logout-btn"
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    title="Sign Out"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="nav-login-btn"
                  onClick={() => navigate('/login')}
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </button>
                <button
                  id="nav-register-btn"
                  onClick={() => navigate('/register')}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-xs"
                >
                  <span>Register Company</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              id="nav-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          <button
            onClick={() => { navigate('/marketplace'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Marketplace
          </button>
          <button
            onClick={() => { navigate('/sustainability'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Circular Impact Tracker
          </button>
          <button
            onClick={() => { navigate('/how-it-works'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            How It Works
          </button>
          <button
            onClick={() => { navigate('/about'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            About ResourceX
          </button>

          {isAuthenticated && user && (
            <div className="pt-3 border-t border-slate-100 space-y-1">
              <button
                onClick={() => { navigate(getDashboardPath()); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-semibold bg-slate-900 text-white"
              >
                Go to {currentRole.toUpperCase()} Dashboard
              </button>
              <button
                onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Company Profile & Verification
              </button>
              <button
                onClick={() => { logout(); navigate('/'); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
