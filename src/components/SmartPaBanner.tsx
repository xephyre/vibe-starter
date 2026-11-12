import React, { useState } from 'react';
import { AlertCircle, Bell, CheckCircle2, ChevronRight, ExternalLink, HelpCircle, RefreshCw, X } from 'lucide-react';
import { Subscription } from '../types/subscription';
import { evaluateUrgency, formatReadableDate, getTodayDateString } from '../utils/dates';
import { formatCurrency } from '../utils/currencies';

interface SmartPaBannerProps {
  subscriptions: Subscription[];
  onMarkRenewed: (sub: Subscription) => void;
  onOpenCancelGuide: (sub: Subscription) => void;
  onSnoozeAlert: (sub: Subscription, days: number) => void;
  displayCurrency: string;
}

export const SmartPaBanner: React.FC<SmartPaBannerProps> = ({
  subscriptions,
  onMarkRenewed,
  onOpenCancelGuide,
  onSnoozeAlert,
  displayCurrency,
}) => {
  const today = getTodayDateString();
  const [dismissedBanner, setDismissedBanner] = useState<boolean>(false);

  // Subscriptions that require immediate PA attention:
  // 1. Notice deadline overdue or imminent (<= 5 days)
  // 2. Renewal due in <= 5 days
  // 3. Not snoozed past today
  const alertSubs = subscriptions.filter((sub) => {
    if (sub.status !== 'active') return false;
    if (sub.snoozedUntil && sub.snoozedUntil >= today) return false;

    const urgency = evaluateUrgency(sub.renewalDate, sub.noticePeriodDays, today);
    return (
      urgency.level === 'notice_overdue' ||
      urgency.level === 'notice_due_today' ||
      urgency.level === 'notice_imminent' ||
      (urgency.daysUntilRenewal >= 0 && urgency.daysUntilRenewal <= 6)
    );
  });

  if (dismissedBanner || alertSubs.length === 0) {
    return (
      <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            <strong className="font-semibold text-slate-900 dark:text-slate-200">
              Subscription P.A. Status:
            </strong>{' '}
            All recurring commitments are within safe notice windows. Next renewal is on schedule.
          </span>
        </div>
        {dismissedBanner && (
          <button
            onClick={() => setDismissedBanner(false)}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 cursor-pointer"
          >
            Show alerts
          </button>
        )}
      </div>
    );
  }

  return (
    <aside
      aria-label="Smart Subscription PA Reminders"
      className="p-4 bg-amber-50/90 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/70 transition-all shadow-xs"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-amber-950 dark:text-amber-200">
              Smart P.A. Action Center: {alertSubs.length} Notice & Renewal Alert{alertSubs.length > 1 ? 's' : ''}
            </h2>
            <p className="text-xs text-amber-900/80 dark:text-amber-300/80">
              To prevent unwanted renewals or contractual lock-ins, take action before the notice deadline.
            </p>
          </div>
        </div>

        <button
          onClick={() => setDismissedBanner(true)}
          className="text-amber-800/60 hover:text-amber-950 dark:text-amber-400 dark:hover:text-amber-200 p-1 rounded-md transition-colors"
          aria-label="Dismiss banner temporarily"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3.5 space-y-2.5">
        {alertSubs.map((sub) => {
          const urgency = evaluateUrgency(sub.renewalDate, sub.noticePeriodDays, today);
          const isOverdue = urgency.level === 'notice_overdue';
          const isToday = urgency.level === 'notice_due_today';

          return (
            <div
              key={sub.id}
              className="p-3 bg-white dark:bg-slate-900/90 rounded-lg border border-amber-200/80 dark:border-amber-900/40 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                    {sub.name}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">·</span>
                  <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                    {formatCurrency(sub.cost, sub.currency)} / {sub.billingCycle}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">·</span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 capitalize">
                    {sub.type} ({sub.workspace})
                  </span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-[11px] border ${urgency.badgeClass}`}
                  >
                    {isOverdue
                      ? `⚠️ Notice cutoff passed (${Math.abs(urgency.daysUntilNotice)}d ago)`
                      : isToday
                      ? `🚨 Notice deadline is TODAY`
                      : `⏳ Notice needed in ${urgency.daysUntilNotice} days (${formatReadableDate(
                          urgency.noticeDeadlineDate
                        )})`}
                  </span>

                  <span className="text-slate-500 dark:text-slate-400">
                    Renews: <strong className="font-medium text-slate-800 dark:text-slate-200">{formatReadableDate(sub.renewalDate)}</strong>
                  </span>

                  {sub.noticePeriodDays > 0 && (
                    <span className="text-slate-500 dark:text-slate-400">
                      ({sub.noticePeriodDays} days notice required)
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Renewed & Cancel Guide */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                <button
                  onClick={() => onMarkRenewed(sub)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-all active:scale-95 cursor-pointer"
                  title="Advance next billing date by 1 cycle"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Renewed</span>
                </button>

                <button
                  onClick={() => onOpenCancelGuide(sub)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-lg transition-all active:scale-95 cursor-pointer"
                  title="View cancellation instructions and portal link"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Cancel Guide</span>
                </button>

                <button
                  onClick={() => onSnoozeAlert(sub, 3)}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Snooze alert for 3 days"
                >
                  Snooze
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
