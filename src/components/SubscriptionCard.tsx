import React from 'react';
import {
  Laptop,
  Package,
  Calendar,
  Clock,
  ExternalLink,
  Edit2,
  Trash2,
  RefreshCw,
  FileText,
  PauseCircle,
  PlayCircle,
  CreditCard,
  Building2,
  Users,
  User,
} from 'lucide-react';
import { Subscription } from '../types/subscription';
import { formatCurrency, getMonthlyEquivalent } from '../utils/currencies';
import { evaluateUrgency, formatReadableDate, getTodayDateString } from '../utils/dates';

interface SubscriptionCardProps {
  subscription: Subscription;
  onEdit: (sub: Subscription) => void;
  onDelete: (subId: string) => void;
  onMarkRenewed: (sub: Subscription) => void;
  onOpenCancelGuide: (sub: Subscription) => void;
  onTogglePause: (sub: Subscription) => void;
  displayCurrency: string;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  onEdit,
  onDelete,
  onMarkRenewed,
  onOpenCancelGuide,
  onTogglePause,
  displayCurrency,
}) => {
  const today = getTodayDateString();
  const urgency = evaluateUrgency(subscription.renewalDate, subscription.noticePeriodDays, today);
  const monthlyEquiv = getMonthlyEquivalent(subscription.cost, subscription.billingCycle);

  const isPaused = subscription.status === 'paused';
  const isCancelled = subscription.status === 'cancelled';

  // Workspace icon
  const getWorkspaceIcon = () => {
    switch (subscription.workspace) {
      case 'personal':
        return <User className="w-3.5 h-3.5 text-slate-400" />;
      case 'family':
        return <Users className="w-3.5 h-3.5 text-slate-400" />;
      case 'organization':
        return <Building2 className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <article
      aria-label={`${subscription.name} Subscription`}
      className={`p-5 bg-white dark:bg-slate-900 rounded-xl border transition-all duration-150 flex flex-col justify-between shadow-2xs hover:shadow-sm ${
        isPaused
          ? 'opacity-70 border-dashed border-slate-300 dark:border-slate-700'
          : urgency.isActionRequired
          ? 'border-amber-300 dark:border-amber-800/80'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div>
        {/* Top unboxed metadata line */}
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
          <div className="flex items-center gap-1.5 capitalize">
            {subscription.type === 'digital' ? (
              <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-medium">
                <Laptop className="w-3.5 h-3.5" />
                Digital
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <Package className="w-3.5 h-3.5" />
                Physical / Offline
              </span>
            )}
            <span aria-hidden="true">·</span>
            <span>{subscription.category}</span>
          </div>

          <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
            {getWorkspaceIcon()}
            <span className="capitalize text-[11px] font-medium">{subscription.workspace}</span>
          </div>
        </div>

        {/* Title and Cost Header */}
        <div className="flex items-start justify-between gap-3 mt-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug tracking-tight">
            {subscription.name}
          </h3>

          <div className="text-right shrink-0">
            <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(subscription.cost, subscription.currency)}
            </div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 capitalize">
              per {subscription.billingCycle}
            </div>
          </div>
        </div>

        {/* Normalized equivalent if not monthly */}
        {subscription.billingCycle !== 'monthly' && (
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            Normalized: ≈ {formatCurrency(monthlyEquiv, subscription.currency)} / mo
          </div>
        )}

        {/* Dates & Notice Period Section */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
          {/* Next Renewal */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Next Renewal
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
              {formatReadableDate(subscription.renewalDate)}{' '}
              <span className="font-normal text-slate-500 dark:text-slate-400">
                ({urgency.daysUntilRenewal >= 0 ? `in ${urgency.daysUntilRenewal}d` : `${Math.abs(urgency.daysUntilRenewal)}d ago`})
              </span>
            </span>
          </div>

          {/* Cancellation Notice Cutoff */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Notice Rule
            </span>
            <span className="text-right">
              {subscription.noticePeriodDays > 0 ? (
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {subscription.noticePeriodDays}d notice required
                </span>
              ) : (
                <span className="text-slate-500 dark:text-slate-400">Instant (0d)</span>
              )}
            </span>
          </div>

          {/* Urgency state text indicator */}
          <div className="pt-1">
            <div
              className={`p-2 rounded-lg border text-[11px] flex items-center justify-between ${urgency.badgeClass}`}
            >
              <span className="font-semibold">{urgency.label}</span>
              <span className="font-mono text-[10px] opacity-80">
                Cutoff: {formatReadableDate(urgency.noticeDeadlineDate)}
              </span>
            </div>
          </div>

          {/* Equipment detail note if applicable */}
          {subscription.requiresEquipmentReturn && (
            <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
              <span className="font-semibold">Return required: </span>
              {subscription.equipmentDetails || 'Key fob / hardware must be returned upon termination.'}
            </div>
          )}

          {/* Payment Method / Notes excerpt */}
          {subscription.paymentMethod && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
              <CreditCard className="w-3 h-3" />
              <span>{subscription.paymentMethod}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMarkRenewed(subscription)}
            className="p-1.5 text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
            title="Mark as Renewed (Advance next billing date)"
            aria-label="Advance billing cycle date"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => onOpenCancelGuide(subscription)}
            className="p-1.5 text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
            title="Open Cancellation Guide"
            aria-label="Open Cancel Guide"
          >
            <FileText className="w-4 h-4" />
          </button>

          {subscription.cancellationUrl && (
            <a
              href={subscription.cancellationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Open Vendor Cancellation Portal"
              aria-label="Vendor Portal"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onTogglePause(subscription)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title={isPaused ? 'Resume subscription' : 'Pause subscription'}
            aria-label={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <PlayCircle className="w-4 h-4 text-emerald-600" /> : <PauseCircle className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onEdit(subscription)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Edit subscription"
            aria-label="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(subscription.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
            title="Delete subscription"
            aria-label="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
};
