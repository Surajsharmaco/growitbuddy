import { ActsPaymentError } from './acts-razorpay';

// Both selected calendar dates are inclusive, in India Standard Time.
export function actsDateRange(from: unknown, to: unknown) {
  if (from === undefined && to === undefined) return null;
  const valid = (value: unknown): value is string => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false;
    const date = new Date(value + 'T00:00:00Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  if (!valid(from) || !valid(to) || from > to) {
    throw new ActsPaymentError(400, 'Choose valid From and To dates; From must not be after To.');
  }
  const start = new Date(from + 'T00:00:00+05:30');
  const end = new Date(new Date(to + 'T00:00:00+05:30').getTime() + 86_400_000);
  return { start, end };
}