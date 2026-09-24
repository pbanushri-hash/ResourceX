import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { X, UploadCloud, FileText, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { VerificationBadge } from '../common/StatusBadge';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, refreshUser } = useAuth();
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [registrationNumber, setRegistrationNumber] = useState(user?.registrationNumber || '');
  const [gstNumber, setGstNumber] = useState(user?.gstNumber || '');
  const [address, setAddress] = useState(user?.address || '');
  const [docName, setDocName] = useState('');
  const [docDataUrl, setDocDataUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setDocDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName) {
      setError('Please attach an incorporation certificate or regulatory document.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await api.submitVerification({
        companyName,
        registrationNumber,
        gstNumber,
        address,
        documentName: docName,
        documentUrl: docDataUrl || '',
      });
      await refreshUser();
      setSuccessMsg('Verification documentation submitted successfully for compliance review.');
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit verification request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Corporate Verification Dossier</h3>
              <p className="text-xs text-slate-500">Government compliance and business authentication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status display */}
        <div className="my-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block">Current Status:</span>
            <span className="text-sm font-bold text-slate-800 capitalize">{user.verificationStatus}</span>
          </div>
          <VerificationBadge status={user.verificationStatus} />
        </div>

        {user.verificationStatus === 'rejected' && user.verificationRejectionReason && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 text-xs space-y-1">
            <span className="font-bold text-rose-900 block">Previous Rejection Feedback:</span>
            <p className="italic text-rose-800">{user.verificationRejectionReason}</p>
            <p className="text-[11px] text-slate-500 pt-1">
              Please rectify the discrepancy noted above and upload updated incorporation documents.
            </p>
          </div>
        )}

        {successMsg ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <p className="text-sm font-bold text-slate-800">Submission Recorded</p>
            <p className="text-xs text-slate-500">{successMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registered Legal Business Name *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company Registration / CIN Number *
                </label>
                <input
                  type="text"
                  required
                  value={registrationNumber}
                  onChange={e => setRegistrationNumber(e.target.value)}
                  placeholder="e.g. U24100MH2020PTC345678"
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GST Identification Number (GSTIN) *
                </label>
                <input
                  type="text"
                  required
                  value={gstNumber}
                  onChange={e => setGstNumber(e.target.value)}
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registered Operational / Warehouse Address *
              </label>
              <textarea
                rows={2}
                required
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Document Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Business Document (Certificate of Incorporation, GST Certificate, or Trade License) *
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-slate-400 transition-colors">
                <div className="space-y-1 text-center">
                  <UploadCloud className="mx-auto h-9 w-9 text-slate-400" />
                  <div className="flex text-xs text-slate-600 justify-center">
                    <label className="relative cursor-pointer rounded-md font-semibold text-emerald-600 hover:text-emerald-500 focus-within:outline-none">
                      <span>Upload official PDF/Image document</span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileUpload}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-400">PDF, PNG, JPG up to 10MB</p>
                </div>
              </div>
              {docName && (
                <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-200">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold truncate">{docName}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={loading || !registrationNumber || !gstNumber}
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors shadow-xs"
              >
                {loading ? 'Submitting...' : 'Submit Verification Dossier'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
