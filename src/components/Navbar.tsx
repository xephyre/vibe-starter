import React from 'react';
import { Plus, Sun, Moon, DollarSign } from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '../utils/currencies';

interface NavbarProps {
  onAddNew: () => void;
  activeTab: 'dashboard' | 'subscriptions' | 'calendar' | 'analytics';
  setActiveTab: (tab: 'dashboard' | 'subscriptions' | 'calendar' | 'analytics') => void;
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  activeCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onAddNew,
  activeTab,
  setActiveTab,
  selectedCurrency,
  onCurrencyChange,
  isDarkMode,
  toggleDarkMode,
  activeCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="text-left group cursor-pointer focus:outline-none"
              aria-label="MyBestSPA Home"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors whitespace-nowrap">
                  MyBestSPA
                </span>
                <span className="hidden sm:inline-block text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                  Subscription P.A.
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: 4 clean single-line text navigation links */}
          <nav
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300"
            aria-label="Main Navigation"
          >
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 dark:hover:text-white py-1 relative ${
                activeTab === 'dashboard'
                  ? 'text-slate-900 dark:text-white font-semibold'
                  : ''
              }`}
            >
              Dashboard
              {activeTab === 'dashboard' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-600 dark:bg-sky-400 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 dark:hover:text-white py-1 relative flex items-center gap-1.5 ${
                activeTab === 'subscriptions'
                  ? 'text-slate-900 dark:text-white font-semibold'
                  : ''
              }`}
            >
              Subscriptions
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                ({activeCount})
              </span>
              {activeTab === 'subscriptions' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-600 dark:bg-sky-400 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 dark:hover:text-white py-1 relative ${
                activeTab === 'calendar'
                  ? 'text-slate-900 dark:text-white font-semibold'
                  : ''
              }`}
            >
              Deadlines & Notice
              {activeTab === 'calendar' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-600 dark:bg-sky-400 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 dark:hover:text-white py-1 relative ${
                activeTab === 'analytics'
                  ? 'text-slate-900 dark:text-white font-semibold'
                  : ''
              }`}
            >
              Spend Analytics
              {activeTab === 'analytics' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-600 dark:bg-sky-400 rounded-full" />
              )}
            </button>
          </nav>

          {/* Zone 3: 1 primary action + utility controls */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Currency Selector */}
            <div className="relative">
              <label htmlFor="currency-select" className="sr-only">
                Display Currency
              </label>
              <select
                id="currency-select"
                value={selectedCurrency}
                onChange={(e) => onCurrencyChange(e.target.value)}
                className="text-xs font-semibold px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors focus:ring-2 focus:ring-sky-500 focus:outline-none"
                aria-label="Select currency"
              >
                {SUPPORTED_CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code} ({curr.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Dark / Light Mode Switch */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDarkMode ? 'Light mode' : 'Dark mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Primary Action Button */}
            <button
              onClick={onAddNew}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0 active:scale-95 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subscription</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
