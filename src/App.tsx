import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { AboutPage } from './pages/public/AboutPage';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { SustainabilityPage } from './pages/public/SustainabilityPage';
import { MarketplacePage } from './pages/public/MarketplacePage';
import { ResourceDetailsPage } from './pages/public/ResourceDetailsPage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Buyer Pages
import { BuyerDashboard } from './pages/buyer/BuyerDashboard';
import { BuyerOrdersPage } from './pages/buyer/BuyerOrdersPage';
import { BuyerCartPage } from './pages/buyer/BuyerCartPage';
import { BuyerRecommendations } from './pages/buyer/BuyerRecommendations';

// Seller Pages
import { SellerDashboard } from './pages/seller/SellerDashboard';
import { SellerResourcesPage } from './pages/seller/SellerResourcesPage';
import { AddResourcePage } from './pages/seller/AddResourcePage';
import { AIPricingPage } from './pages/seller/AIPricingPage';
import { SellerOrdersPage } from './pages/seller/SellerOrdersPage';
import { SellerAnalyticsPage } from './pages/seller/SellerAnalyticsPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminVerificationsPage } from './pages/admin/AdminVerificationsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminResourcesPage } from './pages/admin/AdminResourcesPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';

// Shared Protected Pages
import { ProfilePage } from './pages/shared/ProfilePage';
import { MessagesPage } from './pages/shared/MessagesPage';
import { NotificationsPage } from './pages/shared/NotificationsPage';

function AppContent() {
  const { user, isAuthenticated, role } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route Router
  const renderRoute = () => {
    // 1. Dynamic Resource Details Route: /resource/:id or /marketplace/:id
    if (currentPath.startsWith('/resource/')) {
      const id = currentPath.replace('/resource/', '').split('/')[0];
      return <ResourceDetailsPage resourceId={id} navigate={navigate} />;
    }
    if (currentPath.startsWith('/marketplace/') && currentPath !== '/marketplace/') {
      const id = currentPath.replace('/marketplace/', '').split('/')[0];
      return <ResourceDetailsPage resourceId={id} navigate={navigate} />;
    }

    // 2. Public Static Routes
    switch (currentPath) {
      case '/':
      case '':
        return <HomePage navigate={navigate} />;
      case '/marketplace':
        return <MarketplacePage navigate={navigate} />;
      case '/about':
        return <AboutPage navigate={navigate} />;
      case '/how-it-works':
        return <HowItWorksPage navigate={navigate} />;
      case '/sustainability':
        return <SustainabilityPage navigate={navigate} />;
      case '/login':
        return <LoginPage navigate={navigate} />;
      case '/register':
        return <RegisterPage navigate={navigate} />;
    }

    // 3. Protected Auth Check
    if (!isAuthenticated) {
      return <LoginPage navigate={navigate} />;
    }

    // 4. Shared Protected Routes
    switch (currentPath) {
      case '/profile':
        return <ProfilePage navigate={navigate} />;
      case '/messages':
        return <MessagesPage navigate={navigate} />;
      case '/notifications':
        return <NotificationsPage navigate={navigate} />;
    }

    // 5. Buyer Routes (Buyer or Admin only)
    if (currentPath.startsWith('/buyer')) {
      if (user?.role === 'seller') {
        return <SellerDashboard navigate={navigate} />;
      }
      switch (currentPath) {
        case '/buyer/dashboard':
          return <BuyerDashboard navigate={navigate} />;
        case '/buyer/orders':
          return <BuyerOrdersPage navigate={navigate} />;
        case '/buyer/cart':
          return <BuyerCartPage navigate={navigate} />;
        case '/buyer/recommendations':
          return <BuyerRecommendations navigate={navigate} />;
        default:
          return <BuyerDashboard navigate={navigate} />;
      }
    }

    // 6. Seller Routes (Seller or Admin only)
    if (currentPath.startsWith('/seller')) {
      if (user?.role === 'buyer') {
        return <BuyerDashboard navigate={navigate} />;
      }
      switch (currentPath) {
        case '/seller/dashboard':
          return <SellerDashboard navigate={navigate} />;
        case '/seller/resources':
          return <SellerResourcesPage navigate={navigate} />;
        case '/seller/add-resource':
          return <AddResourcePage navigate={navigate} />;
        case '/seller/ai-pricing':
          return <AIPricingPage navigate={navigate} />;
        case '/seller/orders':
          return <SellerOrdersPage navigate={navigate} />;
        case '/seller/analytics':
          return <SellerAnalyticsPage navigate={navigate} />;
        default:
          return <SellerDashboard navigate={navigate} />;
      }
    }

    // 7. Admin Routes
    if (currentPath.startsWith('/admin')) {
      const isAdmin = user?.role === 'admin' || role === 'admin';
      if (!isAdmin) {
        return <HomePage navigate={navigate} />;
      }
      switch (currentPath) {
        case '/admin/dashboard':
          return <AdminDashboard navigate={navigate} />;
        case '/admin/verification':
        case '/admin/verifications':
          return <AdminVerificationsPage navigate={navigate} />;
        case '/admin/users':
          return <AdminUsersPage navigate={navigate} />;
        case '/admin/resources':
          return <AdminResourcesPage navigate={navigate} />;
        case '/admin/orders':
          return <AdminOrdersPage navigate={navigate} />;
        case '/admin/analytics':
          return <AdminAnalyticsPage navigate={navigate} />;
        default:
          return <AdminDashboard navigate={navigate} />;
      }
    }

    // Fallback: Default to HomePage
    return <HomePage navigate={navigate} />;
  };

  const isDashboardRoute = isAuthenticated && (
    currentPath.startsWith('/buyer') ||
    currentPath.startsWith('/seller') ||
    currentPath.startsWith('/admin') ||
    currentPath === '/profile' ||
    currentPath === '/messages' ||
    currentPath === '/notifications'
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar currentPath={currentPath} navigate={navigate} />

      {isDashboardRoute ? (
        <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
          <Sidebar currentPath={currentPath} navigate={navigate} />
          <main className="flex-1 min-w-0">
            {renderRoute()}
          </main>
        </div>
      ) : (
        <main className="flex-1">
          {renderRoute()}
        </main>
      )}

      <Footer navigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
