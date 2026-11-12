import React, { useState, useEffect } from 'react';
import {
  X,
  Laptop,
  Package,
  Calendar,
  Clock,
  DollarSign,
  Link as LinkIcon,
  FileText,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  Subscription,
  SubscriptionType,
  BillingCycle,
  SubscriptionCategory,
  WorkspaceType,
} from '../types/subscription';
import { SUPPORTED_CURRENCIES } from '../utils/currencies';
import {
  calculateNoticeDeadlineDate,
  formatReadableDate,
  getTodayDateString,
  parseDate,
  formatDate,
} from '../utils/dates';

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subscriptionData: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => void;
  editingSubscription?: Subscription | null;
  defaultCurrency: string;
}

const CATEGORIES_BY_TYPE: Record<SubscriptionType, SubscriptionCategory[]> = {
  digital: [
    'Entertainment & Media',
    'Cloud & Productivity',
    'Developer & AI',
    'Other',
  ],
  physical: [
    'Gym & Fitness',
    'Food & Goods',
    'Insurance & Finance',
    'Home & Utilities',
    'Other',
  ],
};

const PRESETS: {
  name: string;
  type: SubscriptionType;
  category: SubscriptionCategory;
  cost: number;
  currency: string;
  cycle: BillingCycle;
  noticeDays: number;
  notes: string;
  url: string;
  workspace: 'personal' | 'family' | 'organization';
  requiresReturn?: boolean;
  equipmentDetails?: string;
}[] = [
  {
    name: 'Spotify Premium Individual',
    type: 'digital',
    category: 'Entertainment & Media',
    cost: 11.99,
    currency: 'USD',
    cycle: 'monthly',
    noticeDays: 0,
    notes: 'Cancel online anytime under Account Overview > Your Plan.',
    url: 'https://spotify.com/account',
    workspace: 'personal',
  },
  {
    name: 'Equinox / Local Fitness Club',
    type: 'physical',
    category: 'Gym & Fitness',
    cost: 120.00,
    currency: 'USD',
    cycle: 'monthly',
    noticeDays: 30,
    notes: 'Requires 30 days written advance notice sent to membership coordinator. Return locker tag.',
    url: 'https://equinox.com/contact',
    workspace: 'personal',
    requiresReturn: true,
    equipmentDetails: 'RFID wristband and locker padlock',
  },
  {
    name: 'Nespresso Coffee Capsule Delivery',
    type: 'physical',
    category: 'Food & Goods',
    cost: 45.00,
    currency: 'USD',
    cycle: 'monthly',
    noticeDays: 5,
    notes: 'Order locks 5 days before scheduled roast and shipment.',
    url: 'https://nespresso.com/account/standingorders',
    workspace: 'family',
  },
  {
    name: 'GitHub Copilot Enterprise',
    type: 'digital',
    category: 'Developer & AI',
    cost: 39.00,
    currency: 'USD',
    cycle: 'monthly',
    noticeDays: 1,
    notes: 'De-assign seats before seat recalculation date.',
    url: 'https://github.com/settings/billing',
    workspace: 'organization',
  },
];

export const AddEditModal: React.FC<AddEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSubscription,
  defaultCurrency,
}) => {
  const todayStr = getTodayDateString();

  // Helper to generate default next renewal (30 days from now)
  const defaultRenewalDate = () => {
    const today = parseDate(todayStr);
    const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    return formatDate(in30Days);
  };

  const [name, setName] = useState<string>('');
  const [type, setType] = useState<SubscriptionType>('digital');
  const [workspace, setWorkspace] = useState<'personal' | 'family' | 'organization'>('personal');
  const [category, setCategory] = useState<SubscriptionCategory>('Entertainment & Media');
  const [cost, setCost] = useState<string>('15.00');
  const [currency, setCurrency] = useState<string>(defaultCurrency);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [renewalDate, setRenewalDate] = useState<string>(defaultRenewalDate());
  const [noticePeriodDays, setNoticePeriodDays] = useState<number>(0);
  const [cancellationUrl, setCancellationUrl] = useState<string>('');
  const [cancellationNotes, setCancellationNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [requiresEquipmentReturn, setRequiresEquipmentReturn] = useState<boolean>(false);
  const [equipmentDetails, setEquipmentDetails] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset or populate fields on open
  useEffect(() => {
    if (editingSubscription) {
      setName(editingSubscription.name);
      setType(editingSubscription.type);
      setWorkspace(editingSubscription.workspace);
      setCategory(editingSubscription.category);
      setCost(editingSubscription.cost.toString());
      setCurrency(editingSubscription.currency);
      setBillingCycle(editingSubscription.billingCycle);
      setRenewalDate(editingSubscription.renewalDate);
      setNoticePeriodDays(editingSubscription.noticePeriodDays);
      setCancellationUrl(editingSubscription.cancellationUrl || '');
      setCancellationNotes(editingSubscription.cancellationNotes || '');
      setPaymentMethod(editingSubscription.paymentMethod || '');
      setRequiresEquipmentReturn(!!editingSubscription.requiresEquipmentReturn);
      setEquipmentDetails(editingSubscription.equipmentDetails || '');
    } else {
      setName('');
      setType('digital');
      setWorkspace('personal');
      setCategory('Entertainment & Media');
      setCost('19.99');
      setCurrency(defaultCurrency);
      setBillingCycle('monthly');
      setRenewalDate(defaultRenewalDate());
      setNoticePeriodDays(0);
      setCancellationUrl('');
      setCancellationNotes('');
      setPaymentMethod('');
      setRequiresEquipmentReturn(false);
      setEquipmentDetails('');
    }
    setErrors({});
  }, [editingSubscription, isOpen, defaultCurrency]);

  // Adjust category if type switches and current category isn't valid
  const handleTypeChange = (newType: SubscriptionType) => {
    setType(newType);
    const validCategories = CATEGORIES_BY_TYPE[newType];
    if (!validCategories.includes(category)) {
      setCategory(validCategories[0]);
    }
    if (newType === 'digital') {
      setRequiresEquipmentReturn(false);
    }
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setName(preset.name);
    setType(preset.type);
    setCategory(preset.category);
    setCost(preset.cost.toString());
    setCurrency(preset.currency);
    setBillingCycle(preset.cycle);
    setNoticePeriodDays(preset.noticeDays);
    setCancellationNotes(preset.notes);
    setCancellationUrl(preset.url);
    setWorkspace(preset.workspace);
    setRequiresEquipmentReturn(!!preset.requiresReturn);
    setEquipmentDetails(preset.equipmentDetails || '');
  };

  // Real-time calculated notice cutoff date
  const calculatedCutoff = calculateNoticeDeadlineDate(renewalDate, noticePeriodDays);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Subscription name is required';
    const numCost = parseFloat(cost);
    if (isNaN(numCost) || numCost < 0) newErrors.cost = 'Please enter a valid positive cost';
    if (!renewalDate) newErrors.renewalDate = 'Renewal date is required';
    if (noticePeriodDays < 0) newErrors.noticePeriodDays = 'Notice period cannot be negative';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(
      {
        name: name.trim(),
        type,
        workspace,
        category,
        cost: numCost,
        currency,
        billingCycle,
        renewalDate,
        noticePeriodDays: Number(noticePeriodDays) || 0,
        cancellationUrl: cancellationUrl.trim() || undefined,
        cancellationNotes: cancellationNotes.trim() || undefined,
        paymentMethod: paymentMethod.trim() || undefined,
        status: editingSubscription ? editingSubscription.status : 'active',
        requiresEquipmentReturn: type === 'physical' ? requiresEquipmentReturn : false,
        equipmentDetails: requiresEquipmentReturn ? equipmentDetails.trim() : undefined,
      },
      editingSubscription?.id
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <h2 id="modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
              {editingSubscription ? 'Edit Subscription' : 'Add New Subscription'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Track renewal dates, notice deadlines, and cancellation policies
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick presets (only for Add) */}
        {!editingSubscription && (
          <div className="px-5 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-sky-500" />
              <span>Quick Presets:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 transition-all cursor-pointer"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* Subscription Type Selector (Digital vs Physical) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Subscription Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange('digital')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                  type === 'digital'
                    ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 text-sky-950 dark:text-sky-100 ring-1 ring-sky-500'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className={`p-2 rounded-lg ${type === 'digital' ? 'bg-sky-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Digital / Online</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Streaming, SaaS, Cloud & Apps</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('physical')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                  type === 'physical'
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className={`p-2 rounded-lg ${type === 'physical' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Physical / Offline</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Gym, Coffee, Goods & Insurance</div>
                </div>
              </button>
            </div>
          </div>

          {/* Name & Workspace */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label htmlFor="sub-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Subscription Name *
              </label>
              <input
                id="sub-name"
                type="text"
                placeholder="e.g. Netflix Premium, Anytime Fitness, Blue Bottle"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  errors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.name && <p className="text-[11px] text-rose-500">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="sub-workspace" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Workspace
              </label>
              <select
                id="sub-workspace"
                value={workspace}
                onChange={(e) => setWorkspace(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="personal">Personal</option>
                <option value="family">Family</option>
                <option value="organization">Organization</option>
              </select>
            </div>
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="sub-category" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Category
              </label>
              <select
                id="sub-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as SubscriptionCategory)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {CATEGORIES_BY_TYPE[type].map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="sub-payment" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Payment Method (Optional)
              </label>
              <input
                id="sub-payment"
                type="text"
                placeholder="e.g. Visa •••• 4242, Giro Direct Debit, Apple Pay"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Cost, Currency, Billing Cycle */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="sub-cost" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Cost *
              </label>
              <input
                id="sub-cost"
                type="number"
                step="0.01"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className={`w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 tabular-nums focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  errors.cost ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.cost && <p className="text-[11px] text-rose-500">{errors.cost}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="sub-currency" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Currency
              </label>
              <select
                id="sub-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="sub-cycle" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Billing Cycle
              </label>
              <select
                id="sub-cycle"
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="semi-annually">Semi-Annually</option>
                <option value="annually">Annually</option>
              </select>
            </div>
          </div>

          {/* Renewal Date & Notice Period (Interactive calculation) */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>Renewal & Notice Deadline Math</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="sub-renewal-date" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Next Renewal / Expiration Date *
                </label>
                <input
                  id="sub-renewal-date"
                  type="date"
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(e.target.value)}
                  className={`w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer ${
                    errors.renewalDate ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {errors.renewalDate && <p className="text-[11px] text-rose-500">{errors.renewalDate}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="sub-notice-days" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Notice Period Required (Days)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="sub-notice-days"
                    type="number"
                    min="0"
                    max="180"
                    value={noticePeriodDays}
                    onChange={(e) => setNoticePeriodDays(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-24 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <div className="flex gap-1">
                    {[0, 7, 14, 30].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setNoticePeriodDays(days)}
                        className={`px-2 py-1 text-xs rounded border transition-colors ${
                          noticePeriodDays === days
                            ? 'bg-sky-500 text-white border-sky-500'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {days}d
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Calculated Deadline Display */}
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Notice must be submitted by:
              </span>
              <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                {formatReadableDate(calculatedCutoff)}{' '}
                {noticePeriodDays > 0 ? `(${noticePeriodDays} days before renewal)` : '(Instant cancel allowed)'}
              </span>
            </div>
          </div>

          {/* Cancellation URL & Notes */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="sub-url" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Cancellation Portal URL
              </label>
              <div className="relative">
                <input
                  id="sub-url"
                  type="url"
                  placeholder="https://example.com/account/cancel"
                  value={cancellationUrl}
                  onChange={(e) => setCancellationUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="sub-notes" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Cancellation Notes & Contract Terms
              </label>
              <textarea
                id="sub-notes"
                rows={3}
                placeholder="e.g. Must email branch manager with member ID, return RFID tag by 25th of month to avoid $40 penalty, cancel before 5pm."
                value={cancellationNotes}
                onChange={(e) => setCancellationNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Physical Return Checkbox if physical product */}
          {type === 'physical' && (
            <div className="p-3.5 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresEquipmentReturn}
                  onChange={(e) => setRequiresEquipmentReturn(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Requires Equipment Return Upon Cancellation (e.g. gym key fob, bean container, loan hardware)
                </span>
              </label>

              {requiresEquipmentReturn && (
                <div className="pt-1">
                  <input
                    type="text"
                    placeholder="Describe equipment details or serial (e.g. Purple 24/7 key fob #AF-99214)"
                    value={equipmentDetails}
                    onChange={(e) => setEquipmentDetails(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-800 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              {editingSubscription ? 'Save Changes' : 'Add Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
