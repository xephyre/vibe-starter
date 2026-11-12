export type SubscriptionType = 'digital' | 'physical';

export type WorkspaceType = 'all' | 'personal' | 'family' | 'organization';

export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'semi-annually' | 'annually';

export type SubscriptionCategory =
  | 'Entertainment & Media'
  | 'Cloud & Productivity'
  | 'Gym & Fitness'
  | 'Food & Goods'
  | 'Insurance & Finance'
  | 'Home & Utilities'
  | 'Developer & AI'
  | 'Other';

export interface Subscription {
  id: string;
  name: string;
  type: SubscriptionType;
  workspace: 'personal' | 'family' | 'organization';
  category: SubscriptionCategory;
  cost: number;
  currency: string;
  billingCycle: BillingCycle;
  renewalDate: string; // ISO YYYY-MM-DD
  noticePeriodDays: number; // Days in advance cancellation notice is required
  cancellationUrl?: string;
  cancellationNotes?: string;
  paymentMethod?: string;
  status: 'active' | 'paused' | 'cancelled';
  requiresEquipmentReturn?: boolean;
  equipmentDetails?: string;
  lastRenewedAt?: string;
  snoozedUntil?: string; // ISO YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  exchangeRateToUSD: number; // For normalized aggregate spend calculation
}
