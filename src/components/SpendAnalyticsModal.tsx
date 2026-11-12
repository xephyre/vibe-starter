import React from 'react';
import {
  PieChart,
  BarChart3,
  Download,
  RotateCcw,
  Laptop,
  Package,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Subscription, SubscriptionCategory, WorkspaceType } from '../types/subscription';
import {
  formatCurrency,
  getMonthlyEquivalent,
  getAnnualEquivalent,
  convertCurrency,
} from '../utils/currencies';

interface SpendAnalyticsModalProps {
  subscriptions: Subscription[];
  displayCurrency: string;
  onResetSampleData: () => void;
  onClose?: () => void;
  isViewOnlyTab?: boolean;
}

export const SpendAnalyticsModal: React.FC<SpendAnalyticsModalProps> = ({
  subscriptions,
  displayCurrency,
  onResetSampleData,
  onClose,
  isViewOnlyTab = false,
}) => {
  const activeSubs = subscriptions.filter((s) => s.status === 'active');

  // Total monthly & annual
  const totalMonthly = activeSubs.reduce((sum, s) => {
    return sum + convertCurrency(getMonthlyEquivalent(s.cost, s.billingCycle), s.currency, displayCurrency);
  }, 0);
  const totalAnnual = activeSubs.reduce((sum, s) => {
    return sum + convertCurrency(getAnnualEquivalent(s.cost, s.billingCycle), s.currency, displayCurrency);
  }, 0);

  // Spend by Category
  const categorySpendMap: Record<string, number> = {};
  activeSubs.forEach((s) => {
    const monthlyCost = convertCurrency(getMonthlyEquivalent(s.cost, s.billingCycle), s.currency, displayCurrency);
    categorySpendMap[s.category] = (categorySpendMap[s.category] || 0) + monthlyCost;
  });

  const categoriesSorted = Object.entries(categorySpendMap)
    .map(([cat, amount]) => ({
      category: cat,
      amount,
      percentage: totalMonthly > 0 ? Math.round((amount / totalMonthly) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Spend by Workspace
  const workspaceSpendMap: Record<string, number> = {
    personal: 0,
    family: 0,
    organization: 0,
  };
  activeSubs.forEach((s) => {
    const monthlyCost = convertCurrency(getMonthlyEquivalent(s.cost, s.billingCycle), s.currency, displayCurrency);
    workspaceSpendMap[s.workspace] = (workspaceSpendMap[s.workspace] || 0) + monthlyCost;
  });

  // Digital vs Physical
  const digitalMonthly = activeSubs
    .filter((s) => s.type === 'digital')
    .reduce((sum, s) => sum + convertCurrency(getMonthlyEquivalent(s.cost, s.billingCycle), s.currency, displayCurrency), 0);

  const physicalMonthly = totalMonthly - digitalMonthly;
  const digitalPercent = totalMonthly > 0 ? Math.round((digitalMonthly / totalMonthly) * 100) : 0;
  const physicalPercent = 100 - digitalPercent;

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Name',
      'Type',
      'Workspace',
      'Category',
      'Cost',
      'Currency',
      'Billing Cycle',
      'Monthly Equivalent',
      'Next Renewal Date',
      'Notice Period (Days)',
      'Status',
      'Cancellation URL',
      'Cancellation Notes',
    ];

    const rows = subscriptions.map((s) => [
      `"${s.id}"`,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.type}"`,
      `"${s.workspace}"`,
      `"${s.category}"`,
      s.cost,
      s.currency,
      s.billingCycle,
      getMonthlyEquivalent(s.cost, s.billingCycle).toFixed(2),
      s.renewalDate,
      s.noticePeriodDays,
      s.status,
      `"${(s.cancellationUrl || '').replace(/"/g, '""')}"`,
      `"${(s.cancellationNotes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MyBestSPA_Subscriptions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const content = (
    <div className="space-y-6">
      {/* Top summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
          <span className="text-xs uppercase font-semibold text-slate-400">Total Monthly Spend</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {formatCurrency(totalMonthly, displayCurrency)}
          </div>
          <span className="text-xs text-slate-500">Across {activeSubs.length} active services</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
          <span className="text-xs uppercase font-semibold text-slate-400">Projected Annual Outflow</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {formatCurrency(totalAnnual, displayCurrency)}
          </div>
          <span className="text-xs text-slate-500">12-month commitment forecast</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
          <span className="text-xs uppercase font-semibold text-slate-400">Format Ratio</span>
          <div className="text-sm font-bold text-slate-900 dark:text-white mt-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
              <Laptop className="w-3.5 h-3.5" />
              {digitalPercent}% Online
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <Package className="w-3.5 h-3.5" />
              {physicalPercent}% Offline
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden flex">
            <div className="bg-sky-500 h-full" style={{ width: `${digitalPercent}%` }} />
            <div className="bg-emerald-500 h-full" style={{ width: `${physicalPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Category Breakdown Bars */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Monthly Spend by Category
          </h3>
          <span className="text-xs text-slate-400">{categoriesSorted.length} categories</span>
        </div>

        <div className="space-y-3">
          {categoriesSorted.map((item) => (
            <div key={item.category} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {item.category}
                </span>
                <span className="font-mono text-slate-900 dark:text-white tabular-nums">
                  {formatCurrency(item.amount, displayCurrency)} / mo{' '}
                  <span className="text-slate-400">({item.percentage}%)</span>
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="bg-slate-900 dark:bg-sky-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workspace Allocation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(['personal', 'family', 'organization'] as const).map((ws) => {
          const spend = workspaceSpendMap[ws] || 0;
          const pct = totalMonthly > 0 ? Math.round((spend / totalMonthly) * 100) : 0;
          return (
            <div
              key={ws}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 capitalize">
                {ws} Workspace
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                {formatCurrency(spend, displayCurrency)}
                <span className="text-xs font-normal text-slate-400"> / mo</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {pct}% of overall portfolio
              </div>
            </div>
          );
        })}
      </div>

      {/* Action buttons (CSV Export & Reset Sample Data) */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export All Subscriptions (.CSV)</span>
        </button>

        <button
          onClick={onResetSampleData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to 6 Sample Subscriptions</span>
        </button>
      </div>
    </div>
  );

  if (isViewOnlyTab) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Spend Analytics & Portfolio Breakdown</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Recurring cost distribution by category, delivery format, and workspace
            </p>
          </div>
        </div>
        {content}
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden my-6 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Spend Analytics & Breakdown</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-semibold"
            >
              Close
            </button>
          )}
        </div>
        <div className="mt-4">{content}</div>
      </div>
    </div>
  );
};
