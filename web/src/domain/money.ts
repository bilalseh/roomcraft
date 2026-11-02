const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatUsd(amount: number): string {
  return usd.format(amount);
}

/** "$499", or "$499 – $899" when the lowest and highest prices differ. */
export function formatPriceRange(min: number, max: number): string {
  return min === max ? formatUsd(min) : `${formatUsd(min)} – ${formatUsd(max)}`;
}
