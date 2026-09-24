import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Resource } from '../../types';
import { X, Send, MessageSquare, Building2, CheckCircle2 } from 'lucide-react';

interface ContactSellerModalProps {
  resource: Resource;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ContactSellerModal: React.FC<ContactSellerModalProps> = ({
  resource,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setLoading(true);
      setError(null);
      await api.sendMessage({
        receiverId: resource.sellerId,
        resourceId: resource.id,
        resourceName: resource.name,
        content: content.trim(),
      });
      setSent(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSent(false);
        setContent('');
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to send message to seller');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Inquire with Supplier</h3>
              <p className="text-xs text-slate-500">
                To: {resource.sellerCompanyName} ({resource.sellerLocation})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sent ? (
          <div className="py-10 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
            <p className="text-sm font-bold text-slate-800">Inquiry Transmitted Successfully</p>
            <p className="text-xs text-slate-500">The supplier has received your message in their ResourceX portal.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
              <span className="font-semibold text-slate-700">Referencing Listing: </span>
              <span className="text-slate-900 font-bold">{resource.name}</span>
              <div className="flex items-center gap-3 mt-1 text-slate-500 text-[11px]">
                <span>Category: {resource.category}</span>
                <span>•</span>
                <span>Stock: {resource.quantity} {resource.unit}</span>
                <span>•</span>
                <span>Unit Price: ₹{resource.sellingPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Inquiry / Specification Requirements
              </label>
              <textarea
                rows={4}
                required
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Specify your required quantity, delivery timeline, packaging needs, or request physical inspection details..."
                className="w-full text-xs rounded-lg border border-slate-300 p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 transition-colors shadow-xs"
              >
                {loading ? 'Sending...' : 'Send Direct Message'}
                <Send className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
