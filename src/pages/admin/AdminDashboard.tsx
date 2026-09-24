import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Building2, 
  FileCheck, 
  Layers, 
  TrendingUp, 
  ShieldCheck, 
  ShieldAlert,
  Users, 
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { VerificationBadge } from '../../components/common/StatusBadge';

export const AdminDashboard: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { user, role, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [st, verifs] = await Promise.all([
        api.getAdminAnalytics(),
        api.getVerifications()
      ]);
      setStats(st);
      setVerifications(verifs.filter((v: any) => v.status === 'pending'));
    } catch (err) {
      console.warn('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (role === 'admin' || user.role === 'admin')) {
      loadData();
    }
  }, [user, role]);

  // Auth Guard
  if (authLoading) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
        Verifying administrator governance authorization...
      </div>
    );
  }

  if (!user || (role !== 'admin' && user.role !== 'admin')) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center bg-white rounded-2xl border border-rose-200 shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Administrator Access Restricted</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          The Platform Governance Command Center is restricted exclusively to authorized administrators. Your account ({user?.email || 'Guest'}) does not have administrative privileges.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Platform Governance Command Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Admin Session Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Oversee corporate verification requests, marketplace integrity, purchase order transactions, and ESG compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="admin-verifs-btn"
            onClick={() => navigate('/admin/verifications')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verification Queue ({verifications.length})</span>
          </button>
          <button
            id="admin-refresh-btn"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Registered Businesses</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{stats?.totalBusinesses || 0}</p>
          <p className="text-[11px] text-slate-400">{stats?.totalUsers || 0} authenticated accounts</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Pending Verifications</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600">{stats?.pendingVerifications || 0}</p>
          <p className="text-[11px] text-slate-400">Awaiting admin compliance review</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Surplus Listings</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{stats?.totalResources || 0}</p>
          <p className="text-[11px] text-slate-400">{stats?.activeResources || 0} active in marketplace</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Gross Trade Volume</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700">
            ₹{(stats?.totalTradeVolume || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400">{stats?.totalOrders || 0} commercial orders executed</p>
        </div>
      </div>

      {/* Pending Business Verifications Section */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Pending Business Verification Dossiers
            </h3>
            <p className="text-xs text-slate-500">
              Real corporate entities awaiting regulatory clearance to participate in trade execution
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/verifications')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Open Verification Queue</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {verifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No pending verification requests.</p>
            <p className="text-slate-400 mt-0.5">
              All registered enterprise businesses have been reviewed and adjudicated.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
            {verifications.slice(0, 5).map(v => (
              <div 
                key={v.id} 
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-xs">{v.companyName}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                      v.userRole === 'buyer' 
                        ? 'bg-sky-50 text-sky-700 border border-sky-200' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {v.userRole || 'Enterprise'}
                    </span>
                    <VerificationBadge status={v.status} />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Structure: <strong className="text-slate-700">{v.businessType || 'Private Limited'}</strong> • CIN: <strong className="font-mono text-slate-700">{v.registrationNumber}</strong> • GST: <strong className="font-mono text-slate-700">{v.gstNumber}</strong>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Doc: <span className="font-medium text-slate-600">{v.documentName || 'Certificate.pdf'}</span> • Submitted {new Date(v.submittedAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => navigate('/admin/verifications')}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-2xs"
                  >
                    <span>Audit Dossier</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Governance Standards & Security Protocol */}
      <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200 text-xs space-y-3">
        <h4 className="font-bold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>ResourceX Regulatory Governance Standards</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-600">
          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block text-[11px]">Entity Verification Policy</span>
            <p className="text-[11px] leading-relaxed">
              Every participant must present a valid MCA Corporate Identity Number (CIN) and GST Identification Number (GSTIN) before engaging in circular material transfers.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block text-[11px]">Listing & Order Access</span>
            <p className="text-[11px] leading-relaxed">
              Sellers can only publish surplus lots once marked as "Verified" by an administrator. Buyers can only checkout and issue purchase orders once verified.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block text-[11px]">Audit Trails & Rejections</span>
            <p className="text-[11px] leading-relaxed">
              Rejections strictly require an explicit reason recorded in Firestore, providing complete transparency to the affected business entity.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
