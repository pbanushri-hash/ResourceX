import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { 
  Building2, 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle,
  Clock,
  KeyRound,
  ArrowRight
} from 'lucide-react';
import { VerificationBadge } from '../../components/common/StatusBadge';
import { VerificationModal } from '../../components/modals/VerificationModal';

export const ProfilePage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { user, refreshUser } = useAuth();
  const [verifModalOpen, setVerifModalOpen] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [adminKeyLoading, setAdminKeyLoading] = useState(false);
  const [adminKeyMsg, setAdminKeyMsg] = useState<{ text: string; error?: boolean } | null>(null);

  if (!user) return null;

  const handleClaimAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setAdminKeyLoading(true);
      setAdminKeyMsg(null);
      const res = await api.claimAdminRole(adminKey.trim());
      await refreshUser();
      setAdminKeyMsg({ text: res.message || 'Administrator privileges activated successfully!' });
      setAdminKey('');
    } catch (err: any) {
      setAdminKeyMsg({ text: err.message || 'Unable to activate administrator privileges.', error: true });
    } finally {
      setAdminKeyLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Corporate Account Dossier
            </h1>
            <VerificationBadge status={user.verificationStatus} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered entity parameters, compliance verification status, and contact signatory
          </p>
        </div>

        <div className="flex items-center gap-2">
          {user.role === 'admin' && (
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs"
            >
              Open Admin Dashboard
            </button>
          )}

          {user.verificationStatus !== 'verified' && (
            <button
              onClick={() => setVerifModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
            >
              {user.verificationStatus === 'rejected' ? 'Re-Submit Verification' : 'Submit Verification Dossier'}
            </button>
          )}
        </div>
      </div>

      {/* Rejection Notice Banner */}
      {user.verificationStatus === 'rejected' && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-xs text-rose-900">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Compliance Verification Rejected by Platform Governance</span>
          </div>
          <div className="p-3 rounded-xl bg-white/90 border border-rose-200 text-xs">
            <span className="font-bold text-rose-900 block mb-0.5">Official Rejection Reason / Reviewer Notes:</span>
            <p className="text-rose-800 italic">{user.verificationRejectionReason || 'Documentation discrepancy or unverified regulatory credentials.'}</p>
          </div>
          <p className="text-[11px] text-slate-600">
            Please update your CIN, GST, or incorporation documents to address the notes above and click <strong>Re-Submit Verification</strong>.
          </p>
        </div>
      )}

      {/* Pending Notice Banner */}
      {user.verificationStatus === 'pending' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Corporate Verification In Progress</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your CIN ({user.registrationNumber}) and GST ({user.gstNumber}) credentials are being audited by platform administrators. Once approved, you will have immediate live trading capabilities.
          </p>
        </div>
      )}

      {/* Verified Notice Banner */}
      {user.verificationStatus === 'verified' && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-xs text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Verified Corporate Enterprise</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your corporate credentials have been vetted and approved. All marketplace listing, procurement order, and ESG tracking features are fully operational.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Organization Summary Card */}
        <div className="md:col-span-1 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-700">
            <Building2 className="w-8 h-8" />
          </div>

          <div>
            <h3 className="font-bold text-slate-900 text-base">{user.companyName}</h3>
            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
              user.role === 'seller' ? 'bg-amber-100 text-amber-800' :
              user.role === 'buyer' ? 'bg-sky-100 text-sky-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {user.role} Account
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 text-left text-xs space-y-2">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Status</span>
              <p className="font-bold capitalize text-slate-800">{user.verificationStatus}</p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Member Since</span>
              <p className="text-slate-600">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Registered details */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Entity Regulatory Record
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Authorized Signatory</span>
              <p className="font-bold text-slate-800">{user.name}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Corporate Email</span>
              <p className="font-semibold text-slate-800">{user.email}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Phone Number</span>
              <p className="font-semibold text-slate-800">{user.phone || 'N/A'}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Entity Structure</span>
              <p className="font-semibold text-slate-800">{user.businessType || 'Private Limited'}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Registration (CIN)</span>
              <p className="font-mono font-semibold text-slate-800">{user.registrationNumber || 'Pending Submission'}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">GSTIN</span>
              <p className="font-mono font-semibold text-slate-800">{user.gstNumber || 'Pending Submission'}</p>
            </div>

            <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Headquarters & Plant Address</span>
              <p className="text-slate-800">{user.address}, {user.city}, {user.state}, {user.country}</p>
            </div>
          </div>

          {/* Admin Testing & Governance Key Access */}
          {user.role !== 'admin' && (
            <div className="pt-4 border-t border-slate-100">
              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <KeyRound className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-indigo-950">Platform Administrator Initialization</h4>
                      <p className="text-[11px] text-indigo-700">
                        Authorized root administrator setup for compliance audit & verification management.
                      </p>
                    </div>
                  </div>
                </div>

                {adminKeyMsg && (
                  <div className={`p-2.5 rounded-lg text-xs font-medium ${
                    adminKeyMsg.error ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  }`}>
                    {adminKeyMsg.text}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleClaimAdmin}
                    disabled={adminKeyLoading}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    {adminKeyLoading ? 'Activating Privileges...' : 'Claim First Admin Account'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      <VerificationModal
        isOpen={verifModalOpen}
        onClose={() => setVerifModalOpen(false)}
      />

    </div>
  );
};
