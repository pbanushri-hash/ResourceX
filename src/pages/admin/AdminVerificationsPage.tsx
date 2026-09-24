import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { VerificationRequest } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  FileCheck, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  ExternalLink, 
  AlertCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  Eye,
  Info,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { VerificationBadge } from '../../components/common/StatusBadge';

export const AdminVerificationsPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { user, role, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<VerificationRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'verified' | 'rejected' | 'all'>('pending');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      setErrorNotice(null);
      const data = await api.getVerifications();
      setRequests(data);

      // If a request was selected, refresh it from current data
      if (selectedReq) {
        const updated = data.find(r => r.id === selectedReq.id);
        if (updated) setSelectedReq(updated);
      } else if (data.length > 0) {
        // Automatically select first pending or first item
        const firstPending = data.find(r => r.status === 'pending') || data[0];
        setSelectedReq(firstPending);
        setAdminNotes(firstPending.reviewNotes || firstPending.adminNotes || '');
      }
    } catch (err: any) {
      console.error(err);
      setErrorNotice(err.message || 'Failed to load verification requests from Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (role === 'admin' || user.role === 'admin')) {
      fetchVerifications();
    }
  }, [user, role]);

  // Handle Approve / Reject
  const handleReview = async (id: string, status: 'verified' | 'rejected') => {
    setErrorNotice(null);
    setSuccessNotice(null);

    // Validation: Rejection MUST have a reason
    if (status === 'rejected' && !adminNotes.trim()) {
      setErrorNotice('A rejection reason is strictly required so the applicant understands which legal document or GST discrepancy must be rectified.');
      return;
    }

    try {
      setActionLoading(true);
      await api.reviewVerification(id, status, adminNotes.trim());
      
      const actionMsg = status === 'verified'
        ? `Entity "${selectedReq?.companyName}" has been officially Approved & Verified. Trading and publishing privileges are now active.`
        : `Entity "${selectedReq?.companyName}" has been Rejected. Rejection reason recorded and notified to the business.`;

      setSuccessNotice(actionMsg);
      await fetchVerifications();
    } catch (err: any) {
      setErrorNotice(err.message || 'Verification update operation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Auth Protection Guard
  if (authLoading) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
        Verifying administrator governance permissions...
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
          The Corporate Verification Module is restricted exclusively to authorized platform administrators. Your account does not possess regulatory governance authorization.
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

  // Filter requests
  const filteredRequests = requests.filter(r => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      r.companyName?.toLowerCase().includes(query) ||
      r.registrationNumber?.toLowerCase().includes(query) ||
      r.gstNumber?.toLowerCase().includes(query) ||
      r.businessType?.toLowerCase().includes(query) ||
      r.userRole?.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const verifiedCount = requests.filter(r => r.status === 'verified').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Corporate Business Verification Ledger
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              Admin Governance
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit incorporation certificates, GSTIN numbers, and adjudicate live corporate trading privileges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            Dashboard
          </button>
          <button
            onClick={fetchVerifications}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorNotice && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="leading-snug">{errorNotice}</p>
        </div>
      )}

      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-snug">{successNotice}</p>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === 'pending'
                ? 'bg-amber-100/80 text-amber-900 font-bold border border-amber-300'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending Review</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200/80 text-amber-900 font-extrabold">
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('verified')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === 'verified'
                ? 'bg-emerald-100/80 text-emerald-900 font-bold border border-emerald-300'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Approved / Verified</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-200/80 text-emerald-900 font-extrabold">
              {verifiedCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === 'rejected'
                ? 'bg-rose-100/80 text-rose-900 font-bold border border-rose-300'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Rejected</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-200/80 text-rose-900 font-extrabold">
              {rejectedCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Dossiers ({requests.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search company, CIN, GSTIN..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
          Loading corporate compliance records from Firestore...
        </div>
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          title={statusFilter === 'pending' ? 'No Pending Verifications' : 'No Verification Records Found'}
          description={
            statusFilter === 'pending'
              ? 'All registered enterprises in the queue have been reviewed and approved or rejected.'
              : 'No corporate business dossiers match the selected filter criteria.'
          }
          icon={FileCheck}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Requests List Column (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs divide-y divide-slate-100">
              {filteredRequests.map(req => {
                const isSelected = selectedReq?.id === req.id;
                const isBuyer = req.userRole === 'buyer';
                const isSeller = req.userRole === 'seller';

                return (
                  <div
                    key={req.id}
                    onClick={() => {
                      setSelectedReq(req);
                      setAdminNotes(req.reviewNotes || req.adminNotes || '');
                      setErrorNotice(null);
                      setSuccessNotice(null);
                    }}
                    className={`p-4 rounded-xl cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-50/80 border border-emerald-300 ring-1 ring-emerald-400'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs truncate max-w-[200px]">
                          {req.companyName}
                        </span>

                        {/* User Role Tag */}
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide ${
                          isBuyer 
                            ? 'bg-sky-50 text-sky-700 border border-sky-200' 
                            : isSeller
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {req.userRole || 'Enterprise User'}
                        </span>

                        <VerificationBadge status={req.status} />
                      </div>

                      <div className="text-[11px] text-slate-600 flex items-center gap-2 flex-wrap">
                        <span>Structure: <strong className="text-slate-800">{req.businessType || 'Private Limited'}</strong></span>
                        <span>•</span>
                        <span>CIN: <strong className="font-mono text-slate-700">{req.registrationNumber}</strong></span>
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                        <span>GSTIN: <strong className="font-mono text-slate-700">{req.gstNumber}</strong></span>
                        {req.city && (
                          <>
                            <span>•</span>
                            <span>{req.city}, {req.state}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right sm:text-right shrink-0 space-y-1">
                      <span className="text-[10px] text-slate-400 block">
                        Submitted {new Date(req.submittedAt).toLocaleDateString()}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <span>Inspect</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dossier Review & Adjudication Column (5 cols) */}
          <div className="lg:col-span-5">
            {selectedReq ? (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5 sticky top-24">
                
                {/* Panel Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900">Entity Audit Dossier</h3>
                  </div>
                  <VerificationBadge status={selectedReq.status} />
                </div>

                {/* Structured Dossier Data */}
                <div className="space-y-3.5 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                      Legal Registered Business Name
                    </span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedReq.companyName}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">User Account Role</span>
                      <p className="font-bold text-slate-800 capitalize mt-0.5">
                        {selectedReq.userRole || 'Enterprise User'}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Business Structure</span>
                      <p className="font-bold text-slate-800 mt-0.5">{selectedReq.businessType || 'Private Limited'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Registration / CIN</span>
                      <p className="font-mono text-slate-800 font-bold mt-0.5 truncate">{selectedReq.registrationNumber}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">GSTIN Number</span>
                      <p className="font-mono text-slate-800 font-bold mt-0.5 truncate">{selectedReq.gstNumber}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                      Registered Plant / Facility Address
                    </span>
                    <p className="text-slate-700 mt-0.5 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      {selectedReq.address}, {selectedReq.city || ''}, {selectedReq.state || ''} {selectedReq.country || ''}
                    </p>
                  </div>

                  {/* Submitted Document Information */}
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-1">
                      Submitted Incorporation Document
                    </span>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-lg bg-emerald-100/80 text-emerald-800 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 block truncate text-xs">
                            {selectedReq.documentName || 'Incorporation_Certificate.pdf'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Uploaded {new Date(selectedReq.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {selectedReq.documentUrl ? (
                        <button
                          type="button"
                          onClick={() => setPreviewModalOpen(true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-[11px] shrink-0 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Inspect Doc</span>
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
                          Standard Upload
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Current Status Info */}
                  {selectedReq.status === 'rejected' && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-rose-800">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Previously Rejected</span>
                      </div>
                      <p className="text-xs">
                        <strong>Reason:</strong> {selectedReq.reviewNotes || selectedReq.adminNotes || 'Documentation discrepancy'}
                      </p>
                    </div>
                  )}

                  {selectedReq.status === 'verified' && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active Verified Business Entity</span>
                      </div>
                      <p className="text-[11px] text-emerald-800">
                        Approved on {selectedReq.reviewedAt ? new Date(selectedReq.reviewedAt).toLocaleDateString() : 'Active'} by {selectedReq.reviewedBy || 'Platform Administrator'}.
                      </p>
                    </div>
                  )}
                </div>

                {/* Audit Actions & Rejection Rationale */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-800">
                        Administrator Review Notes / Rejection Reason
                      </label>
                      <span className="text-[10px] text-slate-400">
                        *Required when rejecting
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={adminNotes}
                      onChange={e => setAdminNotes(e.target.value)}
                      placeholder="Enter legal compliance remarks or reason for rejection (e.g. 'CIN is inactive on MCA portal; please provide current GST-3B certificate')..."
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleReview(selectedReq.id, 'rejected')}
                      className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>{actionLoading ? 'Processing...' : 'Reject Verification'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleReview(selectedReq.id, 'verified')}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{actionLoading ? 'Processing...' : 'Approve & Verify'}</span>
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-white border border-dashed border-slate-200 text-slate-400 space-y-2">
                <FileCheck className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">Select a company from the queue</p>
                <p className="text-[11px] text-slate-400">
                  Click any dossier to inspect regulatory credentials and issue verification decisions.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Document Inspection Modal */}
      {previewModalOpen && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Document Inspection Viewer</h3>
                  <p className="text-[11px] text-slate-500">{selectedReq.companyName} • {selectedReq.documentName}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="py-4 flex-1 overflow-y-auto">
              {selectedReq.documentUrl && selectedReq.documentUrl.startsWith('data:') ? (
                <div className="p-2 border border-slate-200 rounded-xl bg-slate-50">
                  <iframe
                    src={selectedReq.documentUrl}
                    title="Document Inspection Preview"
                    className="w-full h-96 rounded-lg bg-white"
                  />
                </div>
              ) : (
                <div className="p-8 text-center space-y-3 bg-slate-50 rounded-xl border border-slate-200">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">{selectedReq.documentName || 'Incorporation_Certificate.pdf'}</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Legal registration certificate submitted under CIN: <strong className="font-mono text-slate-700">{selectedReq.registrationNumber}</strong> and GSTIN: <strong className="font-mono text-slate-700">{selectedReq.gstNumber}</strong>.
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium text-left">
                    ✓ Document cryptographic record validated on Firestore submission ledger.
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
              >
                Done Inspecting
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
