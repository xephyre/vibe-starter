import React, { useState } from 'react';
import { X, ExternalLink, Copy, Check, AlertTriangle, Package, Calendar, FileText, Ban } from 'lucide-react';
import { Subscription } from '../types/subscription';
import { formatCurrency } from '../utils/currencies';
import { calculateNoticeDeadlineDate, formatReadableDate, getTodayDateString } from '../utils/dates';

interface CancelGuideModalProps {
  subscription: Subscription | null;
  onClose: () => void;
  onMarkCancelled: (subId: string) => void;
}

export const CancelGuideModal: React.FC<CancelGuideModalProps> = ({
  subscription,
  onClose,
  onMarkCancelled,
}) => {
  const [copiedTemplate, setCopiedTemplate] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  if (!subscription) return null;

  const todayStr = getTodayDateString();
  const noticeDeadlineDate = calculateNoticeDeadlineDate(
    subscription.renewalDate,
    subscription.noticePeriodDays
  );

  // Cancellation email/letter template
  const cancellationLetterTemplate = `Subject: Formal Cancellation Notice - ${subscription.name}

Dear ${subscription.name} Customer Support / Billing Team,

Please accept this message as my formal notice of cancellation for my subscription to ${subscription.name}.

Subscription Details:
- Service / Account: ${subscription.name}
- Current Billing Cycle: ${subscription.billingCycle} (${formatCurrency(subscription.cost, subscription.currency)})
- Scheduled Renewal Date: ${formatReadableDate(subscription.renewalDate)}
- Notice Submitted Date: ${formatReadableDate(todayStr)}

In accordance with your terms regarding the required ${subscription.noticePeriodDays || 0}-day notice period, please ensure that no further charges are billed to my payment method after the conclusion of the current paid billing period.

${
  subscription.requiresEquipmentReturn
    ? `Regarding equipment: I am prepared to return the ${subscription.equipmentDetails || 'required equipment'} as instructed.`
    : ''
}

Please provide written confirmation of this cancellation and confirm the exact date my access will terminate.

Thank you,
[Your Name]
[Your Email / Phone Number]`;

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(cancellationLetterTemplate);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-guide-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              <FileText className="w-3.5 h-3.5" />
              <span>Subscription P.A. Cancellation Guide</span>
            </div>
            <h2 id="cancel-guide-title" className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {subscription.name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>{formatCurrency(subscription.cost, subscription.currency)} / {subscription.billingCycle}</span>
              <span>·</span>
              <span className="capitalize">{subscription.type} product</span>
              <span>·</span>
              <span className="capitalize">{subscription.workspace} workspace</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Notice Period Timeline Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Cancellation Notice Rule</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {subscription.noticePeriodDays > 0
                  ? `${subscription.noticePeriodDays} days notice required`
                  : 'Instant cancellation allowed'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                  Notice Deadline
                </span>
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                  {formatReadableDate(noticeDeadlineDate)}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                  Next Renewal Date
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {formatReadableDate(subscription.renewalDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Cancellation Direct Portal Link */}
          {subscription.cancellationUrl && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Official Cancellation Portal
              </label>
              <div className="flex items-center gap-2">
                <a
                  href={subscription.cancellationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors"
                >
                  <span className="truncate">{subscription.cancellationUrl}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-2" />
                </a>
                <button
                  onClick={() => handleCopyUrl(subscription.cancellationUrl!)}
                  className="p-2.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Copy link"
                >
                  {copiedUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Cancellation Notes & Step-by-Step Instructions */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Saved Cancellation Notes & Policy
            </label>
            <div className="p-3.5 text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700/80 leading-relaxed whitespace-pre-wrap">
              {subscription.cancellationNotes || 'No specific cancellation notes saved for this subscription.'}
            </div>
          </div>

          {/* Equipment Return Requirements (Physical / Offline Subscriptions) */}
          {subscription.requiresEquipmentReturn && (
            <div className="p-3.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-orange-900 dark:text-orange-200">
                <Package className="w-4 h-4 text-orange-600" />
                <span>Physical Return Required</span>
              </div>
              <p className="text-xs text-orange-800 dark:text-orange-300">
                {subscription.equipmentDetails || 'You must return membership cards, keys, or loaned hardware to avoid penalty fees.'}
              </p>
            </div>
          )}

          {/* Ready-to-Send Cancellation Template */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pre-Written Cancellation Letter / Email
              </label>
              <button
                onClick={handleCopyTemplate}
                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 cursor-pointer"
              >
                {copiedTemplate ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Letter Template</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-[11px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-48 border border-slate-800">
              {cancellationLetterTemplate}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
          <button
            onClick={() => {
              onMarkCancelled(subscription.id);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 hover:text-rose-800 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Mark as Cancelled</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
