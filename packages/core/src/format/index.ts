/**
 * TEA UI — formatting.
 *
 * Pure functions, no React, no locale surprises beyond an explicit `locale`
 * argument. Two of these are *decisions* rather than conveniences, and the audit
 * is the reason:
 *
 *  - **Bytes are binary by default.** One source project wrote GB/MB/KB and the
 *    other GiB/MiB/KiB for the same disk, backup and container data. The
 *    dominant TEA surface is storage, and storage is measured in binary units, so
 *    binary is the default and decimal is opt-in for things that genuinely mean
 *    decimal — a transfer rate, a licence cap.
 *  - **Relative time is German and short.** "Vor 3 Std." rather than
 *    "vor 3 Stunden", because these appear in dense table cells.
 */

export type ByteSystem = "binary" | "decimal";

const BINARY_UNITS = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB"] as const;
const DECIMAL_UNITS = ["B", "kB", "MB", "GB", "TB", "PB", "EB"] as const;

export interface FormatBytesOptions {
  /** `binary` → KiB/MiB/GiB (default). `decimal` → kB/MB/GB. */
  system?: ByteSystem | undefined;
  /** Maximum fraction digits. Defaults to 1, and 0 below 10 units. */
  digits?: number | undefined;
  /** Rendered when the input is not a usable number. */
  fallback?: string | undefined;
}

export function formatBytes(value: number, options: FormatBytesOptions = {}): string {
  const { system = "binary", fallback = "–" } = options;
  if (!Number.isFinite(value)) return fallback;

  const negative = value < 0;
  const magnitude = Math.abs(value);
  const base = system === "binary" ? 1024 : 1000;
  const units = system === "binary" ? BINARY_UNITS : DECIMAL_UNITS;

  if (magnitude < base) {
    return `${negative ? "-" : ""}${formatNumber(magnitude, { digits: 0 })} ${units[0]}`;
  }

  const exponent = Math.min(units.length - 1, Math.floor(Math.log(magnitude) / Math.log(base)));
  const scaled = magnitude / base ** exponent;
  const digits = options.digits ?? (scaled < 10 ? 1 : 0);

  return `${negative ? "-" : ""}${formatNumber(scaled, { digits })} ${units[exponent]}`;
}

export interface FormatNumberOptions {
  digits?: number | undefined;
  locale?: string | undefined;
  /** Append a non-breaking space and the unit, e.g. "42 MB". */
  unit?: string | undefined;
  fallback?: string | undefined;
}

const DEFAULT_LOCALE = "de-DE";

export function formatNumber(value: number, options: FormatNumberOptions = {}): string {
  const { digits = 0, locale = DEFAULT_LOCALE, unit, fallback = "–" } = options;
  if (!Number.isFinite(value)) return fallback;
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

export function formatPercent(value: number, options: FormatNumberOptions = {}): string {
  if (!Number.isFinite(value)) return options.fallback ?? "–";
  return `${formatNumber(value, { ...options, digits: options.digits ?? 0 })} %`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * A compact duration: `2 Std. 14 Min.`. Two units at most — a duration with
 * four units is a number the reader has to do arithmetic on.
 */
export function formatDuration(milliseconds: number, fallback = "–"): string {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return fallback;
  if (milliseconds < MINUTE) return `${Math.round(milliseconds / 1000)} Sek.`;

  const totalMinutes = Math.floor(milliseconds / MINUTE);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days} Tg. ${hours} Std.`;
  if (hours > 0) return minutes > 0 ? `${hours} Std. ${minutes} Min.` : `${hours} Std.`;
  return `${minutes} Min.`;
}

const FORMATTING = {
  never: "Nie",
  justNow: "Gerade eben",
  minutesAgo: (n: number) => `Vor ${n} Min.`,
  hoursAgo: (n: number) => `Vor ${n} Std.`,
  daysAgo: (n: number) => `Vor ${n} Tg.`,
  lastUpdated: "Zuletzt aktualisiert",
} as const;

export interface FormatRelativeTimeOptions {
  now?: Date | number | undefined;
  /** Return the absolute timestamp instead, e.g. for a `<time title>`. */
  absolute?: Date | number | undefined;
  fallback?: string | undefined;
}

export function formatRelativeTime(
  value: Date | number | null | undefined,
  options: FormatRelativeTimeOptions = {},
): string {
  const { fallback = "–" } = options;
  if (value === null || value === undefined) return fallback;
  const timestamp = value instanceof Date ? value.getTime() : value;
  if (!Number.isFinite(timestamp)) return fallback;

  const now = options.now === undefined ? Date.now() : options.now instanceof Date ? options.now.getTime() : options.now;
  const delta = now - timestamp;
  if (delta < 0) return formatDateTime(timestamp, { dateStyle: "medium", timeStyle: "short" });

  if (delta < MINUTE) return FORMATTING.justNow;
  if (delta < HOUR) return FORMATTING.minutesAgo(Math.floor(delta / MINUTE));
  if (delta < DAY) return FORMATTING.hoursAgo(Math.floor(delta / HOUR));
  if (delta < DAY * 30) return FORMATTING.daysAgo(Math.floor(delta / DAY));
  return formatDateTime(timestamp, { dateStyle: "medium" });
}

export interface FormatDateTimeOptions {
  locale?: string | undefined;
  dateStyle?: "full" | "long" | "medium" | "short" | undefined;
  timeStyle?: "full" | "long" | "medium" | "short" | undefined;
  fallback?: string | undefined;
}

export function formatDateTime(
  value: Date | number | null | undefined,
  options: FormatDateTimeOptions = {},
): string {
  const { locale = DEFAULT_LOCALE, dateStyle = "medium", timeStyle = "short", fallback = "–" } = options;
  if (value === null || value === undefined) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale, { dateStyle, timeStyle }).format(date);
}

export { FORMATTING as TIME_FORMAT_TOKENS };
