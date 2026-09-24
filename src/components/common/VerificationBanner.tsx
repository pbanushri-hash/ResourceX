import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Clock, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';

interface VerificationBannerProps {
  onOpenVerificationModal?: () => void;
}

export const VerificationBanner: React.FC<VerificationBannerProps> = ({ onOpenVerificationModal }) => {
  const { user, isVerified, role } = useAuth();

  if (!user || isVerified || role === 'admin') {
    return null;
  }

  const isPending = user.verificationStatus === 'pending';
  const isRejected = user.verificationStatus === 'rejected';

  return (
    <div 
      id="verification-compliance-banner"
      className={`mb-6 p-4 rounded-xl border ${
        isPending 
          ? 'bg-amber-50/80 border-amber-200 text-amber-900' 
          : 'bg-rose-50/80 border-rose-200 text-rose-900'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          {isPending ? (
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700 mt-0.5">
              <Clock className="w-5 h-5" />
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
          )}
          <div>
            <h4 className="text-sm font-semibold">
              {isPending ? 'Business Verification Pending Review' : 'Business Verification Rejected'}
            </h4>
            <p className="text-xs mt-0.5 text-slate-600 max-w-2xl leading-relaxed">
              {isPending 
                ? 'Your company credentials (GST and registration certificate) are currently under administrative review. Once verified by a platform administrator, you will have full access to publish listings and execute purchase orders.'
                : 'Your recent business verification submission was rejected by platform compliance.'}
            </p>
            {isRejected && user.verificationRejectionReason && (
              <div className="mt-2.5 p-2.5 rounded-lg bg-rose-100/90 border border-rose-200 text-rose-950 text-xs">
                <span className="font-bold text-rose-900 block mb-0.5">Administrator Rejection Reason:</span>
                <p className="italic">{user.verificationRejectionReason}</p>
              </div>
            )}
          </div>
        </div>

        {onOpenVerificationModal && (
          <button
            onClick={onOpenVerificationModal}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shadow-2xs ${
              isPending 
                ? 'bg-amber-800 hover:bg-amber-900 text-white' 
                : 'bg-rose-700 hover:bg-rose-800 text-white'
            }`}
          >
            {isPending ? 'View Submitted Documents' : 'Update Verification Documents'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
