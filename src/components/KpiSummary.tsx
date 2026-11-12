import React, { useState } from 'react';
import { Calendar, DollarSign, AlertTriangle, ShieldCheck, Laptop, Package } from 'lucide-react';
import { Subscription } from '../types/subscription';
import {
  getMonthlyEquivalent,
  getAnnualEquivalent,
  convertCurrency,
  formatCurrency,
} from '../utils/currencies';
import { evaluateUrgency, getTodayDateString } from '../utils/dates';

interface KpiSummaryProps {
  subscriptions: Subscription[];
  displayCurrency: string;
  onOpenRenewalsFilter: () => void;
  onOpenAlertsFilter: () => void;
}

export const KpiSummary: React.FC<KpiSummaryProps> = ({
  subscriptions,
  displayCurrency,
  onOpenRenewalsFilter,
  onOpenAlertsFilter,
}) => {
  const [cadenceMode, setCadenceMode] = useState<'monthly' | 'annual'>('monthly');
  const today = getTodayDateString();

  // Active subscriptions calculation
  const activeSubs = subscriptions.filter((s) => s.status === 'active');

  // Total recurring spend normalized to selected display currency
  const totalMonthlySpend = activeSubs.reduce((sum, sub) => {
    const monthlyLocal = getMonthlyEquivalent(sub.cost, sub.billingCycle);
    const monthlyConverted = convertCurrency(monthlyLocal, sub.currency, displayCurrency);
    return sum + monthlyConverted;
  }, 0);

  const totalAnnualSpend = activeSubs.reduce((sum, sub) => {
    const annualLocal = getAnnualEquivalent(sub.cost, sub.billingCycle);
    const annualConverted = convertCurrency(annualLocal, sub.currency, displayCurrency);
    return sum + annualConverted;
  }, 0);

  // Next 30 days renewals count & projected spend
  const renewalsNext30Days = activeSubs.filter((sub) => {
    const urgency = evaluateUrgency(sub.renewalDate, sub.noticePeriodDays, today);
    return urgency.isWithin30Days;
  });

  const next30DaysSpend = renewalsNext30Days.reduce((sum, sub) => {
    const converted = convertCurrency(sub.cost, sub.currency, displayCurrency);
    return sum + converted;
  }, 0);

  // Digital vs Physical breakdown
  const digitalSubs = activeSubs.filter((s) => s.type === 'digital');
  const physicalSubs = activeSubs.filter((s) => s.type === 'physical');

  const digitalMonthlySpend = digitalSubs.reduce((sum, s) => {
    return sum + convertCurrency(getMonthlyEquivalent(s.cost, s.billingCycle), s.currency, displayCurrency);
  }, 0);

  const physicalMonthlySpend = physicalSubs.reduce((sum, s) => {
    return sum + convertCurrency(getMonthlyEquivalent(s.cost, s.billingCycle), s.currency, displayCurrency);
  }, 0);

  const digitalRatio = totalMonthlySpend > 0 ? Math.round((digitalMonthlySpend / totalMonthlySpend) * 100) : 0;
  const physicalRatio = 100 - digitalRatio;

  // Subscriptions requiring PA attention (notice deadlines near or overdue)
  const alertSubs = activeSubs.filter((sub) => {
    const urgency = evaluateUrgency(sub.renewalDate, sub.noticePeriodDays, today);
    return urgency.isActionRequired;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Recurring Spend (Monthly / Annual toggle) */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Recurring Spend
          </span>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-md p-0.5 text-[11px] font-medium">
            <button
              onClick={() => setCadenceMode('monthly')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                cadenceMode === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Mo
            </button>
            <button
              onClick={() => setCadenceMode('annual')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                cadenceMode === 'annual'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Yr
            </button>
          </div>
        </div>

        <div className="mt-1">
          <div className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(
              cadenceMode === 'monthly' ? totalMonthlySpend : totalAnnualSpend,
              displayCurrency
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span>
              {cadenceMode === 'monthly'
                ? `≈ ${formatCurrency(totalAnnualSpend, displayCurrency)} / year`
                : `≈ ${formatCurrency(totalMonthlySpend, displayCurrency)} / month`}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Upcoming Renewals (Next 30 Days) */}
      <div
        onClick={onOpenRenewalsFilter}
        className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors shadow-2xs group cursor-pointer hover:border-slate-300 dark:hover:border-slate-700"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onOpenRenewalsFilter()}
        aria-label="Filter renewals next 30 days"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Next 30 Days Renewals
          </span>
          <Calendar className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transition-colors" />
        </div>

        <div className="mt-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {renewalsNext30Days.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              subscriptions
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Scheduled cash outflow:{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
              {formatCurrency(next30DaysSpend, displayCurrency)}
            </span>
          </p>
        </div>
      </div>

      {/* 3. Online vs Offline Breakdown */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Format Distribution
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
            {activeSubs.length} total
          </span>
        </div>

        <div className="mt-1 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
              <Laptop className="w-3.5 h-3.5 text-sky-500" />
              Digital ({digitalSubs.length})
            </span>
            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
              {digitalRatio}%
            </span>
          </div>

          {/* Ratio bar */}
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
            <div
              className="bg-sky-500 transition-all duration-300"
              style={{ width: `${digitalRatio}%` }}
              title={`Digital: ${digitalRatio}%`}
            />
            <div
              className="bg-emerald-500 transition-all duration-300"
              style={{ width: `${physicalRatio}%` }}
              title={`Physical: ${physicalRatio}%`}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
              <Package className="w-3.5 h-3.5 text-emerald-500" />
              Physical / Offline ({physicalSubs.length})
            </span>
            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
              {physicalRatio}%
            </span>
          </div>
        </div>
      </div>

      {/* 4. Smart PA Notice Alerts */}
      <div
        onClick={onOpenAlertsFilter}
        className={`p-4 rounded-xl border transition-all shadow-2xs group cursor-pointer ${
          alertSubs.length > 0
            ? 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/60 hover:border-amber-300'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onOpenAlertsFilter()}
        aria-label="Filter notice alerts"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Notice Deadlines
          </span>
          {alertSubs.length > 0 ? (
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          )}
        </div>

        <div className="mt-1">
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl lg:text-3xl font-bold tracking-tight tabular-nums ${
                alertSubs.length > 0
                  ? 'text-amber-800 dark:text-amber-300'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {alertSubs.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {alertSubs.length === 1 ? 'requires notice review' : 'require notice review'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            {alertSubs.length > 0
              ? 'Avoid unintended auto-renewal lock-in'
              : 'All commitments within safe window'}
          </p>
        </div>
      </div>
    </div>
  );
};
