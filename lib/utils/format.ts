export function formatNaira(amount: number | string | any) {
  const value = typeof amount === "string" ? parseFloat(amount) : Number(amount);
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

export function formatNumber(value: number | string | any) {
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  return new Intl.NumberFormat("en-NG").format(num || 0);
}
