export type DatePreset = 'all' | 'today' | 'tomorrow' | 'yesterday' | 'last7' | 'custom';
export const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'all', label: 'All dates' },
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 days' },
  { value: 'custom', label: 'Custom range' },
];
export function indiaToday(now = new Date()) {
  return new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);
}
export function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function shift(day: string, offset: number) {
  const date = new Date(day + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}
export function presetDates(preset: DatePreset, today: string) {
  if (preset === 'all' || preset === 'custom') return { fromDate: '', toDate: '' };
  const day = shift(today, preset === 'tomorrow' ? 1 : preset === 'yesterday' ? -1 : 0);
  return { fromDate: preset === 'last7' ? shift(today, -6) : day, toDate: day };
}