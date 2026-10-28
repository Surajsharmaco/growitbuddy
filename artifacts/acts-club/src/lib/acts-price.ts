export const ACTS_MEMBERSHIP_PRICE_PAISE = 149_900;

export function formatActsPrice(amountPaise: number): string {
  return `₹${(amountPaise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
