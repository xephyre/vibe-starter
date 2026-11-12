import React from 'react';
import {
  Laptop,
  Package,
  Calendar,
  ExternalLink,
  Edit2,
  Trash2,
  RefreshCw,
  FileText,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';
import { Subscription } from '../types/subscription';
import { formatCurrency, getMonthlyEquivalent } from '../utils/currencies';
import { evaluateUrgency, formatReadableDate, getTodayDateString } from '../utils/dates';

interface SubscriptionTableProps {
  subscriptions: Subscription[];
  onEdit: (sub: Subscription) => void;
  onDelete: (subId: string) => void;
  onMarkRenewed: (sub: Subscription) => void;
  onOpenCancelGuide: (sub: Subscription) => void;
  onTogglePause: (sub: Subscription) => void;
  displayCurrency: string;
}

export const SubscriptionTable: React.FC<SubscriptionTableProps> = ({
  subscriptions,
  onEdit,
  onDelete,
  onMarkRenewed,
  onOpenCancelGuide,
  onTogglePause,
  displayCurrency,
}) => {
  const today = getTodayDateString();

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
            <th scope="col" className="py-3 px-4">Subscription</th>
            <th scope="col" className="py-3 px-4">Workspace</th>
            <th scope="col" className="py-3 px-4 text-right">Cost / Cadence</th>
            <th scope="col" className="py-3 px-4">Renewal Date</th>
            <th scope="col" className="py-3 px-4">Notice Deadline</th>
            <th scope="col" className="py-3 px-4">Status & Health</th>
            <th scope="col" className="py-3 px-4 text-right">PA Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-800 dark:text-slate-200">
          {subscriptions.map((sub) => {
            const urgency = evaluateUrgency(sub.renewalDate, sub.noticePeriodDays, today);
            const monthlyCost = getMonthlyEquivalent(sub.cost, sub.billingCycle);
            const isPaused = sub.status === 'paused';

            return (
              <tr
                key={sub.id}
                className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors ${
                  isPaused ? 'opacity-60 bg-slate-50/30 dark:bg-slate-900/30' : ''
                }`}
              >
                {/* Subscription Name & Type */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                      {sub.type === 'digital' ? (
                        <Laptop className="w-3.5 h-3.5 text-sky-500" />
                      ) : (
                        <Package className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {sub.name}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        {sub.category}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Workspace */}
                <td className="py-3.5 px-4 capitalize text-slate-600 dark:text-slate-400 font-medium">
                  {sub.workspace}
                </td>

                {/* Cost */}
                <td className="py-3.5 px-4 text-right tabular-nums">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(sub.cost, sub.currency)}
                  </div>
                  <div className="text-[11px] text-slate-400 capitalize">
                    per {sub.billingCycle}
                  </div>
                </td>

                {/* Renewal Date */}
                <td className="py-3.5 px-4 tabular-nums">
                  <div className="font-medium text-slate-800 dark:text-slate-200">
                    {formatReadableDate(sub.renewalDate)}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {urgency.daysUntilRenewal >= 0 ? `in ${urgency.daysUntilRenewal} days` : 'Overdue'}
                  </div>
                </td>

                {/* Notice Deadline */}
                <td className="py-3.5 px-4 tabular-nums">
                  <div className="font-medium text-slate-800 dark:text-slate-200">
                    {formatReadableDate(urgency.noticeDeadlineDate)}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {sub.noticePeriodDays > 0 ? `${sub.noticePeriodDays}d notice required` : 'Instant notice'}
                  </div>
                </td>

                {/* Status & Health */}
                <td className="py-3.5 px-4">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${urgency.badgeClass}`}
                  >
                    {isPaused ? 'Paused' : urgency.label}
                  </span>
                </td>

                {/* Quick PA Actions */}
                <td className="py-3.5 px-4 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button
                      onClick={() => onMarkRenewed(sub)}
                      className="p-1.5 text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-md transition-colors"
                      title="Advance next billing date"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onOpenCancelGuide(sub)}
                      className="p-1.5 text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
                      title="Open Cancel Guide"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onTogglePause(sub)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                      title={isPaused ? 'Resume' : 'Pause'}
                    >
                      {isPaused ? <PlayCircle className="w-3.5 h-3.5 text-emerald-600" /> : <PauseCircle className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => onEdit(sub)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDelete(sub.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
