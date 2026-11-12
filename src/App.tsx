import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Plus,
  ArrowUpDown,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  Info,
  Calendar,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import {
  Subscription,
  WorkspaceType,
  SubscriptionType,
  SubscriptionCategory,
} from './types/subscription';
import { INITIAL_SUBSCRIPTIONS } from './data/initialSubscriptions';
import { Navbar } from './components/Navbar';
import { WorkspaceSelector } from './components/WorkspaceSelector';
import { KpiSummary } from './components/KpiSummary';
import { SmartPaBanner } from './components/SmartPaBanner';
import { SubscriptionCard } from './components/SubscriptionCard';
import { SubscriptionTable } from './components/SubscriptionTable';
import { AddEditModal } from './components/AddEditModal';
import { CancelGuideModal } from './components/CancelGuideModal';
import { SpendAnalyticsModal } from './components/SpendAnalyticsModal';
import { DeadlinesTimeline } from './components/DeadlinesTimeline';
import { ToastContainer, ToastMessage } from './components/Toast';
import { advanceBillingDate, evaluateUrgency, formatReadableDate, getTodayDateString } from './utils/dates';
import { formatCurrency } from './utils/currencies';

const STORAGE_KEY = 'mybestspa_subscriptions_v2';
const CURRENCY_KEY = 'mybestspa_currency';
const THEME_KEY = 'mybestspa_theme';

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  // Currency state
  const [displayCurrency, setDisplayCurrency] = useState<string>(() => {
    return localStorage.getItem(CURRENCY_KEY) || 'USD';
  });

  const handleCurrencyChange = (curr: string) => {
    setDisplayCurrency(curr);
    localStorage.setItem(CURRENCY_KEY, curr);
    addToast({
      id: Date.now().toString(),
      type: 'info',
      title: `Display currency set to ${curr}`,
    });
  };

  // Subscriptions state loaded from localStorage or initialized
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse subscriptions from local storage', e);
    }
    return INITIAL_SUBSCRIPTIONS;
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
    } catch (e) {
      console.error('Failed to save subscriptions to local storage', e);
    }
  }, [subscriptions]);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'subscriptions' | 'calendar' | 'analytics'>('dashboard');

  // Workspaces Filter
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceType>('all');

  // Format filter (all, digital, physical)
  const [formatFilter, setFormatFilter] = useState<'all' | 'digital' | 'physical'>('all');

  // Category filter
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Search query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Status filter (all, active, action_needed, paused)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'action_needed' | 'paused'>('all');

  // View mode (cards vs table)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Sorting
  const [sortBy, setSortBy] = useState<'renewal' | 'notice' | 'cost_desc' | 'cost_asc' | 'name'>('renewal');

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState<boolean>(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  const [cancelGuideSub, setCancelGuideSub] = useState<Subscription | null>(null);

  // Toasts notification system
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: ToastMessage) => {
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Reset to sample data
  const handleResetSampleData = () => {
    setSubscriptions(INITIAL_SUBSCRIPTIONS);
    localStorage.removeItem(STORAGE_KEY);
    addToast({
      id: Date.now().toString(),
      type: 'success',
      title: 'Reset to Sample Data',
      message: 'Restored 6 realistic sample subscriptions (online and offline)',
    });
  };

  // Mark subscription as Renewed (advances next billing cycle)
  const handleMarkRenewed = (sub: Subscription) => {
    const nextDate = advanceBillingDate(sub.renewalDate, sub.billingCycle);
    setSubscriptions((prev) =>
      prev.map((item) =>
        item.id === sub.id
          ? {
              ...item,
              renewalDate: nextDate,
              lastRenewedAt: new Date().toISOString(),
              snoozedUntil: undefined,
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );

    addToast({
      id: Date.now().toString(),
      type: 'success',
      title: `${sub.name} Renewed!`,
      message: `Next billing date advanced to ${formatReadableDate(nextDate)} (+1 ${sub.billingCycle})`,
    });
  };

  // Snooze alert
  const handleSnoozeAlert = (sub: Subscription, days: number = 3) => {
    const today = new Date();
    const snoozeDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    const snoozeStr = snoozeDate.toISOString().slice(0, 10);

    setSubscriptions((prev) =>
      prev.map((item) =>
        item.id === sub.id ? { ...item, snoozedUntil: snoozeStr } : item
      )
    );

    addToast({
      id: Date.now().toString(),
      type: 'info',
      title: `Reminder Snoozed for ${days} days`,
      message: `${sub.name} alert will re-appear closer to renewal`,
    });
  };

  // Mark as cancelled
  const handleMarkCancelled = (subId: string) => {
    const sub = subscriptions.find((s) => s.id === subId);
    setSubscriptions((prev) =>
      prev.map((item) =>
        item.id === subId ? { ...item, status: 'cancelled', updatedAt: new Date().toISOString() } : item
      )
    );

    addToast({
      id: Date.now().toString(),
      type: 'warning',
      title: 'Subscription Cancelled',
      message: `${sub?.name || 'Subscription'} marked as cancelled. No further renewals tracked.`,
    });
  };

  // Toggle paused
  const handleTogglePause = (sub: Subscription) => {
    const newStatus = sub.status === 'paused' ? 'active' : 'paused';
    setSubscriptions((prev) =>
      prev.map((item) =>
        item.id === sub.id ? { ...item, status: newStatus, updatedAt: new Date().toISOString() } : item
      )
    );

    addToast({
      id: Date.now().toString(),
      type: 'info',
      title: newStatus === 'paused' ? 'Subscription Paused' : 'Subscription Resumed',
      message: `${sub.name} is now ${newStatus}`,
    });
  };

  // Delete subscription
  const handleDelete = (subId: string) => {
    const sub = subscriptions.find((s) => s.id === subId);
    setSubscriptions((prev) => prev.filter((s) => s.id !== subId));
    addToast({
      id: Date.now().toString(),
      type: 'info',
      title: 'Subscription Deleted',
      message: `Removed ${sub?.name || 'subscription'}`,
    });
  };

  // Save (Create or Update)
  const handleSaveSubscription = (
    data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => {
    const now = new Date().toISOString();
    if (id) {
      // Update
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === id ? { ...data, id, createdAt: s.createdAt, updatedAt: now } : s))
      );
      addToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Subscription Updated',
        message: `Saved changes to ${data.name}`,
      });
    } else {
      // Create
      const newSub: Subscription = {
        ...data,
        id: `sub-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };
      setSubscriptions((prev) => [newSub, ...prev]);
      addToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Subscription Added',
        message: `Now tracking ${data.name} in ${data.workspace} workspace`,
      });
    }
  };

  // Filtering & Sorting subscriptions
  const todayStr = getTodayDateString();

  const filteredSubscriptions = useMemo(() => {
    return subscriptions
      .filter((sub) => {
        // Workspace
        if (currentWorkspace !== 'all' && sub.workspace !== currentWorkspace) return false;

        // Format
        if (formatFilter !== 'all' && sub.type !== formatFilter) return false;

        // Category
        if (categoryFilter !== 'all' && sub.category !== categoryFilter) return false;

        // Status
        if (statusFilter === 'active' && sub.status !== 'active') return false;
        if (statusFilter === 'paused' && sub.status !== 'paused') return false;
        if (statusFilter === 'action_needed') {
          const urgency = evaluateUrgency(sub.renewalDate, sub.noticePeriodDays, todayStr);
          if (!urgency.isActionRequired || sub.status !== 'active') return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = sub.name.toLowerCase().includes(q);
          const matchesNotes = sub.cancellationNotes?.toLowerCase().includes(q);
          const matchesCategory = sub.category.toLowerCase().includes(q);
          if (!matchesName && !matchesNotes && !matchesCategory) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'renewal') {
          return a.renewalDate.localeCompare(b.renewalDate);
        }
        if (sortBy === 'notice') {
          const urgencyA = evaluateUrgency(a.renewalDate, a.noticePeriodDays, todayStr);
          const urgencyB = evaluateUrgency(b.renewalDate, b.noticePeriodDays, todayStr);
          return urgencyA.daysUntilNotice - urgencyB.daysUntilNotice;
        }
        if (sortBy === 'cost_desc') {
          return b.cost - a.cost;
        }
        if (sortBy === 'cost_asc') {
          return a.cost - b.cost;
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [
    subscriptions,
    currentWorkspace,
    formatFilter,
    categoryFilter,
    statusFilter,
    searchQuery,
    sortBy,
    todayStr,
  ]);

  // Unique categories list for filter dropdown
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    subscriptions.forEach((s) => set.add(s.category));
    return Array.from(set);
  }, [subscriptions]);

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-sky-500/20">
      {/* 3-Zone Strict Top Navigation Bar */}
      <Navbar
        onAddNew={() => {
          setEditingSub(null);
          setIsAddEditModalOpen(true);
        }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedCurrency={displayCurrency}
        onCurrencyChange={handleCurrencyChange}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        activeCount={subscriptions.filter((s) => s.status === 'active').length}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Workspace Mode Ribbon */}
        <WorkspaceSelector
          currentWorkspace={currentWorkspace}
          onSelectWorkspace={setCurrentWorkspace}
          subscriptions={subscriptions}
        />

        {/* Dynamic Tab Router */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* KPI Stat Row */}
            <KpiSummary
              subscriptions={
                currentWorkspace === 'all'
                  ? subscriptions
                  : subscriptions.filter((s) => s.workspace === currentWorkspace)
              }
              displayCurrency={displayCurrency}
              onOpenRenewalsFilter={() => {
                setStatusFilter('active');
                setActiveTab('calendar');
              }}
              onOpenAlertsFilter={() => {
                setStatusFilter('action_needed');
                setActiveTab('subscriptions');
              }}
            />

            {/* Smart PA Reminders Action Banner */}
            <SmartPaBanner
              subscriptions={
                currentWorkspace === 'all'
                  ? subscriptions
                  : subscriptions.filter((s) => s.workspace === currentWorkspace)
              }
              onMarkRenewed={handleMarkRenewed}
              onOpenCancelGuide={setCancelGuideSub}
              onSnoozeAlert={handleSnoozeAlert}
              displayCurrency={displayCurrency}
            />

            {/* Subscriptions Section Header & Explorer Toolbar */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Tracked Subscriptions ({filteredSubscriptions.length})
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Comprehensive digital and physical commitments organized by notice deadline
                  </p>
                </div>

                {/* View Mode Toggle & Reset sample helper */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                        viewMode === 'cards'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                      }`}
                      aria-label="Card view"
                      title="Card view"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                        viewMode === 'table'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                      }`}
                      aria-label="Table view"
                      title="Compact table view"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by name, category, or notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      clear
                    </button>
                  )}
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Format Filter */}
                  <select
                    value={formatFilter}
                    onChange={(e) => setFormatFilter(e.target.value as any)}
                    className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                    aria-label="Filter by format"
                  >
                    <option value="all">All Formats</option>
                    <option value="digital">Digital Online Only</option>
                    <option value="physical">Physical / Offline Only</option>
                  </select>

                  {/* Category Filter */}
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                    aria-label="Filter by category"
                  >
                    <option value="all">All Categories</option>
                    {availableCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                    aria-label="Filter by status"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="action_needed">Action Needed (Notice Due)</option>
                    <option value="paused">Paused Only</option>
                  </select>

                  {/* Sort By */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                    aria-label="Sort subscriptions"
                  >
                    <option value="renewal">Next Renewal Date</option>
                    <option value="notice">Notice Deadline Urgency</option>
                    <option value="cost_desc">Highest Cost</option>
                    <option value="cost_asc">Lowest Cost</option>
                    <option value="name">Alphabetical</option>
                  </select>
                </div>
              </div>

              {/* Subscriptions Grid / Table List */}
              {filteredSubscriptions.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    No subscriptions match your current filter
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Try adjusting your search terms, changing workspace, or resetting filters.
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setFormatFilter('all');
                        setCategoryFilter('all');
                        setStatusFilter('all');
                        setCurrentWorkspace('all');
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Clear All Filters
                    </button>
                    <button
                      onClick={handleResetSampleData}
                      className="px-3.5 py-1.5 text-xs font-semibold text-sky-600 hover:underline cursor-pointer"
                    >
                      Restore 6 Samples
                    </button>
                  </div>
                </div>
              ) : viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSubscriptions.map((sub) => (
                    <SubscriptionCard
                      key={sub.id}
                      subscription={sub}
                      onEdit={(subToEdit) => {
                        setEditingSub(subToEdit);
                        setIsAddEditModalOpen(true);
                      }}
                      onDelete={handleDelete}
                      onMarkRenewed={handleMarkRenewed}
                      onOpenCancelGuide={setCancelGuideSub}
                      onTogglePause={handleTogglePause}
                      displayCurrency={displayCurrency}
                    />
                  ))}
                </div>
              ) : (
                <SubscriptionTable
                  subscriptions={filteredSubscriptions}
                  onEdit={(subToEdit) => {
                    setEditingSub(subToEdit);
                    setIsAddEditModalOpen(true);
                  }}
                  onDelete={handleDelete}
                  onMarkRenewed={handleMarkRenewed}
                  onOpenCancelGuide={setCancelGuideSub}
                  onTogglePause={handleTogglePause}
                  displayCurrency={displayCurrency}
                />
              )}
            </div>
          </div>
        )}

        {/* Subscriptions Dedicated Tab */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  All Subscriptions ({filteredSubscriptions.length})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage digital services and offline recurring commitments with instant cancellation details
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingSub(null);
                    setIsAddEditModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Subscription</span>
                </button>
              </div>
            </div>

            {/* View Mode & Filter controls */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter subscriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={formatFilter}
                  onChange={(e) => setFormatFilter(e.target.value as any)}
                  className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="all">All Formats</option>
                  <option value="digital">Digital Only</option>
                  <option value="physical">Physical / Offline Only</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="action_needed">Action Needed</option>
                  <option value="paused">Paused Only</option>
                </select>

                <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      viewMode === 'cards'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      viewMode === 'table'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSubscriptions.map((sub) => (
                  <SubscriptionCard
                    key={sub.id}
                    subscription={sub}
                    onEdit={(subToEdit) => {
                      setEditingSub(subToEdit);
                      setIsAddEditModalOpen(true);
                    }}
                    onDelete={handleDelete}
                    onMarkRenewed={handleMarkRenewed}
                    onOpenCancelGuide={setCancelGuideSub}
                    onTogglePause={handleTogglePause}
                    displayCurrency={displayCurrency}
                  />
                ))}
              </div>
            ) : (
              <SubscriptionTable
                subscriptions={filteredSubscriptions}
                onEdit={(subToEdit) => {
                  setEditingSub(subToEdit);
                  setIsAddEditModalOpen(true);
                }}
                onDelete={handleDelete}
                onMarkRenewed={handleMarkRenewed}
                onOpenCancelGuide={setCancelGuideSub}
                onTogglePause={handleTogglePause}
                displayCurrency={displayCurrency}
              />
            )}
          </div>
        )}

        {/* Calendar / Notice Deadlines Tab */}
        {activeTab === 'calendar' && (
          <DeadlinesTimeline
            subscriptions={
              currentWorkspace === 'all'
                ? subscriptions
                : subscriptions.filter((s) => s.workspace === currentWorkspace)
            }
            displayCurrency={displayCurrency}
            onMarkRenewed={handleMarkRenewed}
            onOpenCancelGuide={setCancelGuideSub}
          />
        )}

        {/* Spend Analytics Tab */}
        {activeTab === 'analytics' && (
          <SpendAnalyticsModal
            subscriptions={
              currentWorkspace === 'all'
                ? subscriptions
                : subscriptions.filter((s) => s.workspace === currentWorkspace)
            }
            displayCurrency={displayCurrency}
            onResetSampleData={handleResetSampleData}
            isViewOnlyTab={true}
          />
        )}
      </main>

      {/* Clean minimal footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-6 text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">MyBestSPA</span>
            <span>·</span>
            <span>Subscription Personal Assistant for Online & Offline Subscriptions</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleResetSampleData}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset 6 Samples</span>
            </button>
            <span>·</span>
            <span>WCAG 2.2AA Compliant</span>
          </div>
        </div>
      </footer>

      {/* Add / Edit Subscription Modal */}
      <AddEditModal
        isOpen={isAddEditModalOpen}
        onClose={() => {
          setIsAddEditModalOpen(false);
          setEditingSub(null);
        }}
        onSave={handleSaveSubscription}
        editingSubscription={editingSub}
        defaultCurrency={displayCurrency}
      />

      {/* Cancel Guide Modal */}
      <CancelGuideModal
        subscription={cancelGuideSub}
        onClose={() => setCancelGuideSub(null)}
        onMarkCancelled={handleMarkCancelled}
      />

      {/* Feedback Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
