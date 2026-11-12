import { Subscription } from '../types/subscription';
import { getTodayDateString, parseDate, formatDate } from '../utils/dates';

function getDateOffset(daysFromToday: number): string {
  const today = parseDate(getTodayDateString());
  const target = new Date(today.getTime() + daysFromToday * 24 * 60 * 60 * 1000);
  return formatDate(target);
}

export const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub-netflix',
    name: 'Netflix Premium (4K HDR)',
    type: 'digital',
    workspace: 'personal',
    category: 'Entertainment & Media',
    cost: 22.99,
    currency: 'USD',
    billingCycle: 'monthly',
    renewalDate: getDateOffset(6), // Renews in 6 days
    noticePeriodDays: 0, // Instant cancellation
    cancellationUrl: 'https://netflix.com/youraccount',
    cancellationNotes: 'Cancel anytime in Account > Membership. Streaming remains active until the final day of current billing cycle.',
    paymentMethod: 'Mastercard •••• 8821',
    status: 'active',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-11-01T10:00:00Z',
  },
  {
    id: 'sub-anytime-fitness',
    name: 'Anytime Fitness 24/7 Club Membership',
    type: 'physical',
    workspace: 'personal',
    category: 'Gym & Fitness',
    cost: 69.00,
    currency: 'USD',
    billingCycle: 'monthly',
    renewalDate: getDateOffset(18), // Renews in 18 days
    noticePeriodDays: 30, // Requires 30 days notice -> Cutoff was 12 days ago! Immediate PA Action required
    cancellationUrl: 'https://www.anytimefitness.com/contact-gym/',
    cancellationNotes: 'Club rules require 30 days written notice submitted to branch manager. Must return purple key fob to front desk before the 25th to avoid $40 unreturned equipment penalty.',
    paymentMethod: 'Checking Direct Debit',
    requiresEquipmentReturn: true,
    equipmentDetails: 'Purple 24/7 RFID key fob (Serial #AF-99214)',
    status: 'active',
    createdAt: '2025-06-10T14:30:00Z',
    updatedAt: '2026-11-05T09:15:00Z',
  },
  {
    id: 'sub-blue-bottle',
    name: 'Blue Bottle Single Origin Whole Beans',
    type: 'physical',
    workspace: 'family',
    category: 'Food & Goods',
    cost: 38.00,
    currency: 'USD',
    billingCycle: 'monthly',
    renewalDate: getDateOffset(9), // Renews in 9 days
    noticePeriodDays: 4, // Notice deadline in 5 days
    cancellationUrl: 'https://bluebottlecoffee.com/subscriptions',
    cancellationNotes: 'Shipments roast on Tuesdays. Modifying grind, pausing or cancelling must be saved at least 4 business days before dispatch.',
    paymentMethod: 'Visa •••• 4242',
    status: 'active',
    createdAt: '2026-03-20T11:00:00Z',
    updatedAt: '2026-10-28T16:20:00Z',
  },
  {
    id: 'sub-apple-one',
    name: 'Apple One Premier (Family Sharing)',
    type: 'digital',
    workspace: 'family',
    category: 'Cloud & Productivity',
    cost: 37.95,
    currency: 'USD',
    billingCycle: 'monthly',
    renewalDate: getDateOffset(24), // Renews in 24 days
    noticePeriodDays: 1,
    cancellationUrl: 'https://support.apple.com/billing',
    cancellationNotes: 'Includes 2TB iCloud Storage, Apple Music, TV+, Arcade, and Fitness+. Shared across 4 family members.',
    paymentMethod: 'Apple Card via Apple Pay',
    status: 'active',
    createdAt: '2025-09-01T12:00:00Z',
    updatedAt: '2026-10-18T14:00:00Z',
  },
  {
    id: 'sub-slack-workspace',
    name: 'Slack Pro & Google Workspace Business',
    type: 'digital',
    workspace: 'organization',
    category: 'Cloud & Productivity',
    cost: 175.00,
    currency: 'USD',
    billingCycle: 'monthly',
    renewalDate: getDateOffset(5), // Renews in 5 days
    noticePeriodDays: 3, // Notice deadline in 2 days!
    cancellationUrl: 'https://slack.com/admin/billing',
    cancellationNotes: '14 active team seats. Remember to de-provision departing contractors before month-end invoice to avoid seat prorations.',
    paymentMethod: 'Corporate Amex •••• 1009',
    status: 'active',
    createdAt: '2025-11-15T09:00:00Z',
    updatedAt: '2026-11-02T11:30:00Z',
  },
  {
    id: 'sub-prudential-health',
    name: 'Prudential Life & Comprehensive Health Shield',
    type: 'physical',
    workspace: 'personal',
    category: 'Insurance & Finance',
    cost: 540.00,
    currency: 'USD',
    billingCycle: 'quarterly', // Normalized: $180/mo
    renewalDate: getDateOffset(29), // Renews in 29 days
    noticePeriodDays: 14, // Notice deadline in 15 days
    cancellationUrl: 'https://prudential.com/myaccount/policies',
    cancellationNotes: 'Policy #TH-90214. If surrendering or requesting premium holiday, consult assigned advisor Mr. James Tan first to prevent forfeiture of cash bonuses.',
    paymentMethod: 'Bank Giro Auto-Debit',
    status: 'active',
    createdAt: '2024-04-01T08:00:00Z',
    updatedAt: '2026-10-10T08:00:00Z',
  },
];
