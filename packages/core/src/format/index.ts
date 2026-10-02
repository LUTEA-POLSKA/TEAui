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
 *  - **Relative time is short.** "3 min ago" rather than "three minutes ago",
 *    because these appear in dense table cells.
 */

export type ByteSystem = "binary" | "decimal";

const BINARY_UNITS = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB"] as const;
const DECIMAL_UNITS = ["B", "kB", "MB", "GB", "TB", "PB", "EB"] as const;

export interface FormatBytesOptions {
  /** `binary` → KiB/MiB/GiB (default). `decimal` → kB/MB/GB. */
  system?: ByteSystem | undefined;
  /** Maximum fraction digits. Defaults to 1, and 0 below 10 units. */
  digits?: number | undefined;
  /**
   * BCP 47 tag for the digit and separator conventions. Defaults to
   * {@link DEFAULT_LOCALE}.
   *
   * Added because this formatter had no way to localise at all: it called
   * `formatNumber` without forwarding one, so a byte value was rendered with German
   * separators in an English interface — and storage is the single value a customer
   * reads most often.
   */
  locale?: string | undefined;
  /** Rendered when the input is not a usable number. */
  fallback?: string | undefined;
}

export function formatBytes(value: number, options: FormatBytesOptions = {}): string {
  const { system = "binary", locale = DEFAULT_LOCALE, fallback = "–" } = options;
  if (!Number.isFinite(value)) return fallback;

  const negative = value < 0;
  const magnitude = Math.abs(value);
  const base = system === "binary" ? 1024 : 1000;
  const units = system === "binary" ? BINARY_UNITS : DECIMAL_UNITS;

  if (magnitude < base) {
    return `${negative ? "-" : ""}${formatNumber(magnitude, { digits: 0, locale })} ${units[0]}`;
  }

  const exponent = Math.min(units.length - 1, Math.floor(Math.log(magnitude) / Math.log(base)));
  const scaled = magnitude / base ** exponent;
  const digits = options.digits ?? (scaled < 10 ? 1 : 0);

  return `${negative ? "-" : ""}${formatNumber(scaled, { digits, locale })} ${units[exponent]}`;
}

export interface FormatNumberOptions {
  digits?: number | undefined;
  locale?: string | undefined;
  /** Append a non-breaking space and the unit, e.g. "42 MB". */
  unit?: string | undefined;
  fallback?: string | undefined;
}

/**
 * The locale every formatter falls back to.
 *
 * It was `de-DE`, and it was wrong in a way no test looking at locale arguments
 * could have caught: a package whose entire copy deck is English — changed from
 * German deliberately, for the reason spelled out in `terminology.ts` — shipped
 * German *number formatting*. `1.234` in an English interface, and 1.5 GiB rendered
 * as `1,5 GiB` because the byte formatter had no `locale` to override the default.
 *
 * The default is the language the documentation is written in, which is the same
 * rule the copy deck already follows. A consumer that needs another sets it.
 */
const DEFAULT_LOCALE = "en";

export function formatNumber(value: number, options: FormatNumberOptions = {}): string {
  const { digits = 0, locale = DEFAULT_LOCALE, unit, fallback = "–" } = options;
  if (!Number.isFinite(value)) return fallback;
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
  // A normal space, not a non-breaking one: an invisible character in a template
  // literal is impossible to review, and the linter flags it for good reason.
  // Where a non-breaking space is genuinely wanted (a value that must not wrap),
  // pass it through `unit` explicitly.
  return unit ? `${formatted} ${unit}` : formatted;
}

export function formatPercent(value: number, options: FormatNumberOptions = {}): string {
  if (!Number.isFinite(value)) return options.fallback ?? "–";
  return `${formatNumber(value, { ...options, digits: options.digits ?? 0 })} %`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * A compact duration: `2 h 14 min`. Two units at most — a duration with
 * four units is a number the reader has to do arithmetic on.
 */
export function formatDuration(milliseconds: number, fallback = "–"): string {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return fallback;
  if (milliseconds < MINUTE) return `${Math.round(milliseconds / 1000)} s`;

  const totalMinutes = Math.floor(milliseconds / MINUTE);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days} d ${hours} h`;
  if (hours > 0) return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
  return `${minutes} min`;
}

const FORMATTING = {
  never: "Never",
  justNow: "Just now",
  minutesAgo: (n: number) => `${n} min ago`,
  hoursAgo: (n: number) => `${n} h ago`,
  daysAgo: (n: number) => `${n} d ago`,
  lastUpdated: "Last updated",
} as const;

export interface FormatRelativeTimeOptions {
  now?: Date | number | undefined;
  /**
   * Render this timestamp instead of a relative one, e.g. for a `<time title>`.
   * Ignored when `value` is in the future.
   */
  absolute?: Date | number | undefined;
  /**
   * BCP 47 tag for the absolute timestamps this falls back to. Defaults to
   * {@link DEFAULT_LOCALE}.
   *
   * Added for the same reason as in {@link FormatBytesOptions}: the relative strings
   * and the absolute fallback were two different languages, so one value could read
   * `5 min ago` on Monday and a German date on Monday evening.
   */
  locale?: string | undefined;
  fallback?: string | undefined;
}

export function formatRelativeTime(
  value: Date | number | null | undefined,
  options: FormatRelativeTimeOptions = {},
): string {
  const { locale = DEFAULT_LOCALE, fallback = "–" } = options;
  if (value === null || value === undefined) return fallback;
  const timestamp = value instanceof Date ? value.getTime() : value;
  if (!Number.isFinite(timestamp)) return fallback;

  const now = options.now === undefined ? Date.now() : options.now instanceof Date ? options.now.getTime() : options.now;
  const delta = now - timestamp;
  if (delta < 0) return formatDateTime(timestamp, { locale, dateStyle: "medium", timeStyle: "short" });

  // `absolute` was documented, typed and never read: the body of this function did
  // not mention it, so a caller passing it got a relative string and no signal that
  // the option did nothing. It is the one option here whose whole purpose is to
  // produce the *other* format, so it is honoured first.
  if (options.absolute !== undefined) {
    const at = options.absolute instanceof Date ? options.absolute.getTime() : options.absolute;
    if (Number.isFinite(at)) {
      return formatDateTime(at, { locale, dateStyle: "medium", timeStyle: "short" });
    }
  }

  if (delta < MINUTE) return FORMATTING.justNow;
  if (delta < HOUR) return FORMATTING.minutesAgo(Math.floor(delta / MINUTE));
  if (delta < DAY) return FORMATTING.hoursAgo(Math.floor(delta / HOUR));
  if (delta < DAY * 30) return FORMATTING.daysAgo(Math.floor(delta / DAY));
  return formatDateTime(timestamp, { locale, dateStyle: "medium" });
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
