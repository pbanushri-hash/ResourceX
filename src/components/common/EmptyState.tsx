import React from 'react';
import { LucideIcon, PackageOpen, Inbox, Store, Sparkles, Building2, BarChart3, Leaf } from 'lucide-react';

interface EmptyStateProps {
  id?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  id,
  title,
  description,
  icon: Icon = PackageOpen,
  actionLabel,
  onAction,
}) => {
  return (
    <div 
      id={id || `empty-state-${Math.random().toString(36).substring(2, 7)}`}
      className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-slate-300 bg-white shadow-xs max-w-xl mx-auto my-8"
    >
      <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
        <Icon className="w-8 h-8 stroke-[1.5]" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors shadow-xs"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
