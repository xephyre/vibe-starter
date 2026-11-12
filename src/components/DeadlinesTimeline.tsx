import React from 'react';
import { Clock, Calendar, AlertTriangle, CheckCircle2, Laptop, Package, RefreshCw, FileText } from 'lucide-react';
import { Subscription } from '../types/subscription';
import { evaluateUrgency, formatReadableDate, getTodayDateString } from '../utils/dates';
import { formatCurrency } from '../utils/currencies';

interface DeadlinesTimelineProps {
  subscriptions: Subscription[];
  displayCurrency: string;
  onMarkRenewed: (sub: Subscription) => void;
  onOpenCancelGuide: (sub: Subscription) => void;
}

export const DeadlinesTimeline: React.FC<DeadlinesTimelineProps> = ({
  subscriptions,
  displayCurrency,
  onMarkRenewed,
  onOpenCancelGuide,
}) => {
  const today = getTodayDateString();

  // Active subscriptions sorted by notice deadline
  const sortedSubs = [...subscriptions]
    .filter((s) => s.status === 'active')
    .sort((a, b) => {
      const urgencyA = evaluateUrgency(a.renewalDate, a.noticePeriodDays, today);
      const urgencyB = evaluateUrgency(b.renewalDate, b.noticePeriodDays, today);
      return urgencyA.daysUntilNotice - urgencyB.daysUntilNotice;
    });

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Upcoming Deadlines & Notice Calendar
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Chronological breakdown of contractual cancellation cutoff dates and scheduled billing renewals
        </p>
      </div>

      <div className="space-y-3">
        {sortedSubs.map((sub, idx) => {
          const urgency = evaluateUrgency(sub.renewalDate, sub.noticePeriodDays, today);
          const isOverdue = urgency.level === 'notice_overdue';
          const isUrgent = urgency.isActionRequired;

          return (
            <div
              key={sub.id}
              className={`p-4 rounded-xl border bg-white dark:bg-slate-900 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs ${
                isUrgent
                  ? 'border-amber-300 dark:border-amber-800/80'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    isUrgent
                      ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {isUrgent ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {sub.name}
                    </h3>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                      {formatCurrency(sub.cost, sub.currency)} / {sub.billingCycle}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500 capitalize">{sub.workspace}</span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                      <span>Notice Deadline:</span>
                      <span className="tabular-nums">{formatReadableDate(urgency.noticeDeadlineDate)}</span>
                      <span className="text-[11px] opacity-80">
                        ({urgency.daysUntilNotice >= 0 ? `in ${urgency.daysUntilNotice}d` : `${Math.abs(urgency.daysUntilNotice)}d ago`})
                      </span>
                    </div>

                    <span className="text-slate-300 dark:text-slate-700">|</span>

                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                      <span>Renews on:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                        {formatReadableDate(sub.renewalDate)}
                      </span>
                      <span>({sub.noticePeriodDays}d notice rule)</span>
                    </div>
                  </div>

                  {sub.cancellationNotes && (
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {sub.cancellationNotes}
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => onMarkRenewed(sub)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors cursor-pointer"
                  title="Mark as Renewed"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Renewed</span>
                </button>

                <button
                  onClick={() => onOpenCancelGuide(sub)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-lg transition-colors cursor-pointer"
                  title="Open Cancel Guide"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Cancel Guide</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
