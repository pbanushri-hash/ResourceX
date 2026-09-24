import React from 'react';
import { VerificationStatus, OrderStatus } from '../../types';
import { ShieldCheck, Clock, XCircle, Package, Truck, CheckCircle2, AlertCircle } from 'lucide-react';

export const VerificationBadge: React.FC<{ status: VerificationStatus; className?: string }> = ({ status, className = '' }) => {
  switch (status) {
    case 'verified':
      return (
        <span 
          id={`badge-verified-${Math.random().toString(36).substring(2, 6)}`}
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Verified Business
        </span>
      );
    case 'pending':
      return (
        <span 
          id={`badge-pending-${Math.random().toString(36).substring(2, 6)}`}
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 ${className}`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Verification Pending
        </span>
      );
    case 'rejected':
      return (
        <span 
          id={`badge-rejected-${Math.random().toString(36).substring(2, 6)}`}
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 ${className}`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Verification Rejected
        </span>
      );
  }
};

export const OrderStatusBadge: React.FC<{ status: OrderStatus; className?: string }> = ({ status, className = '' }) => {
  switch (status) {
    case 'pending':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 ${className}`}>
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Pending Confirmation
        </span>
      );
    case 'confirmed':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
          Confirmed
        </span>
      );
    case 'processing':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 ${className}`}>
          <Package className="w-3.5 h-3.5 text-indigo-600" />
          Processing
        </span>
      );
    case 'shipped':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 ${className}`}>
          <Truck className="w-3.5 h-3.5 text-purple-600" />
          In Transit / Shipped
        </span>
      );
    case 'delivered':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Delivered & Reused
        </span>
      );
    case 'cancelled':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 ${className}`}>
          <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
          Cancelled
        </span>
      );
  }
};
