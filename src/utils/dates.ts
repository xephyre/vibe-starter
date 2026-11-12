import { BillingCycle } from '../types/subscription';

/**
 * Parses YYYY-MM-DD into a localized Date object at midnight UTC to prevent off-by-one timezone errors
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
}

/**
 * Formats a Date object to YYYY-MM-DD string
 */
export function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns today's date formatted as YYYY-MM-DD
 */
export function getTodayDateString(referenceDate?: Date): string {
  const d = referenceDate || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates days between two date strings (target - today)
 */
export function getDaysDifference(targetDateStr: string, todayDateStr: string): number {
  const target = parseDate(targetDateStr);
  const today = parseDate(todayDateStr);
  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculates the exact notice deadline date string (renewalDate - noticePeriodDays)
 */
export function calculateNoticeDeadlineDate(renewalDateStr: string, noticePeriodDays: number): string {
  if (noticePeriodDays <= 0) {
    return renewalDateStr;
  }
  const renewal = parseDate(renewalDateStr);
  const deadline = new Date(renewal.getTime() - noticePeriodDays * 24 * 60 * 60 * 1000);
  return formatDate(deadline);
}

export type UrgencyLevel = 'notice_overdue' | 'notice_due_today' | 'notice_imminent' | 'notice_upcoming' | 'renewal_soon' | 'safe';

export interface UrgencyInfo {
  level: UrgencyLevel;
  daysUntilRenewal: number;
  daysUntilNotice: number;
  noticeDeadlineDate: string;
  isWithin30Days: boolean;
  label: string;
  badgeClass: string;
  isActionRequired: boolean;
}

/**
 * Evaluates urgency for a subscription based on renewal date and notice period
 */
export function evaluateUrgency(
  renewalDateStr: string,
  noticePeriodDays: number,
  todayStr: string = getTodayDateString()
): UrgencyInfo {
  const daysUntilRenewal = getDaysDifference(renewalDateStr, todayStr);
  const noticeDeadlineDate = calculateNoticeDeadlineDate(renewalDateStr, noticePeriodDays);
  const daysUntilNotice = getDaysDifference(noticeDeadlineDate, todayStr);
  const isWithin30Days = daysUntilRenewal >= 0 && daysUntilRenewal <= 30;

  // If already expired
  if (daysUntilRenewal < 0) {
    return {
      level: 'notice_overdue',
      daysUntilRenewal,
      daysUntilNotice,
      noticeDeadlineDate,
      isWithin30Days: false,
      label: `Expired ${Math.abs(daysUntilRenewal)}d ago`,
      badgeClass: 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900',
      isActionRequired: true,
    };
  }

  // Notice period overdue (past notice cutoff date, but before actual renewal)
  if (noticePeriodDays > 0 && daysUntilNotice < 0) {
    return {
      level: 'notice_overdue',
      daysUntilRenewal,
      daysUntilNotice,
      noticeDeadlineDate,
      isWithin30Days,
      label: `Notice cutoff passed (${Math.abs(daysUntilNotice)}d ago)`,
      badgeClass: 'text-amber-800 bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
      isActionRequired: true,
    };
  }

  // Notice deadline today
  if (daysUntilNotice === 0) {
    return {
      level: 'notice_due_today',
      daysUntilRenewal,
      daysUntilNotice,
      noticeDeadlineDate,
      isWithin30Days,
      label: 'Notice deadline is TODAY',
      badgeClass: 'text-red-700 bg-red-50 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800',
      isActionRequired: true,
    };
  }

  // Notice deadline imminent (1 to 3 days)
  if (daysUntilNotice > 0 && daysUntilNotice <= 3) {
    return {
      level: 'notice_imminent',
      daysUntilRenewal,
      daysUntilNotice,
      noticeDeadlineDate,
      isWithin30Days,
      label: `Notice deadline in ${daysUntilNotice} day${daysUntilNotice === 1 ? '' : 's'}`,
      badgeClass: 'text-orange-800 bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
      isActionRequired: true,
    };
  }

  // Notice deadline upcoming (4 to 7 days)
  if (daysUntilNotice > 0 && daysUntilNotice <= 7) {
    return {
      level: 'notice_upcoming',
      daysUntilRenewal,
      daysUntilNotice,
      noticeDeadlineDate,
      isWithin30Days,
      label: `Notice deadline in ${daysUntilNotice} days`,
      badgeClass: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      isActionRequired: true,
    };
  }

  // Renewal soon (within 7 days) even if notice period is 0
  if (daysUntilRenewal <= 7) {
    return {
      level: 'renewal_soon',
      daysUntilRenewal,
      daysUntilNotice,
      noticeDeadlineDate,
      isWithin30Days,
      label: `Renews in ${daysUntilRenewal === 0 ? 'today' : `${daysUntilRenewal}d`}`,
      badgeClass: 'text-sky-700 bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
      isActionRequired: false,
    };
  }

  return {
    level: 'safe',
    daysUntilRenewal,
    daysUntilNotice,
    noticeDeadlineDate,
    isWithin30Days,
    label: `Renews in ${daysUntilRenewal} days`,
    badgeClass: 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    isActionRequired: false,
  };
}

/**
 * Advances a date by exactly 1 billing cycle without timezone bugs
 */
export function advanceBillingDate(dateStr: string, cycle: BillingCycle): string {
  const current = parseDate(dateStr);
  const year = current.getUTCFullYear();
  const month = current.getUTCMonth();
  const day = current.getUTCDate();

  let nextDate: Date;

  switch (cycle) {
    case 'weekly':
      nextDate = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;

    case 'monthly': {
      // Advance by 1 month, handling month end
      const targetMonth = month + 1;
      nextDate = new Date(Date.UTC(year, targetMonth, day));
      // If month overflowed (e.g. Jan 31 -> March 3), clamp to last day of target month
      if (nextDate.getUTCMonth() !== targetMonth % 12) {
        nextDate = new Date(Date.UTC(year, targetMonth + 1, 0));
      }
      break;
    }

    case 'quarterly': {
      const targetMonth = month + 3;
      nextDate = new Date(Date.UTC(year, targetMonth, day));
      if (nextDate.getUTCMonth() !== targetMonth % 12) {
        nextDate = new Date(Date.UTC(year, targetMonth + 1, 0));
      }
      break;
    }

    case 'semi-annually': {
      const targetMonth = month + 6;
      nextDate = new Date(Date.UTC(year, targetMonth, day));
      if (nextDate.getUTCMonth() !== targetMonth % 12) {
        nextDate = new Date(Date.UTC(year, targetMonth + 1, 0));
      }
      break;
    }

    case 'annually': {
      const targetYear = year + 1;
      nextDate = new Date(Date.UTC(targetYear, month, day));
      // Leap year check: Feb 29 on non-leap year clamps to Feb 28
      if (month === 1 && day === 29 && nextDate.getUTCMonth() !== 1) {
        nextDate = new Date(Date.UTC(targetYear, 1, 28));
      }
      break;
    }

    default:
      nextDate = new Date(Date.UTC(year, month + 1, day));
  }

  return formatDate(nextDate);
}

/**
 * Formats a date string into readable prose (e.g., "Nov 17, 2026")
 */
export function formatReadableDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = parseDate(dateStr);
  return d.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
