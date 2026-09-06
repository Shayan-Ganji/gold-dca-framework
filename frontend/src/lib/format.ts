const NUM = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function toman(value: number): string {
  const sign = value < 0 ? "-" : "";
  return sign + NUM.format(Math.abs(Math.round(value)));
}

export function signedToman(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return sign + NUM.format(Math.abs(Math.round(value)));
}

export function grams(value: number, digits = 3): string {
  return value.toFixed(digits);
}

export function pct(value: number, digits = 2): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

export function parseNumberInput(raw: string): number {
  const normalized = raw
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function withCommas(value: number | string): string {
  if (typeof value === "string" && value.trim() === "") return "";
  const n = typeof value === "number" ? value : parseNumberInput(value);
  return NUM.format(n);
}

const TIME = new Intl.DateTimeFormat("fa-IR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const DATETIME = new Intl.DateTimeFormat("fa-IR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function clockFa(date: Date): string {
  return TIME.format(date);
}

export function dateTimeFa(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return DATETIME.format(d);
}

export function toLocalInputValue(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
