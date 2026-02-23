// Re-export shared utilities from @ethereum-canonical-registry/ui

import { enUS as locale } from "date-fns/locale";
import {
  format,
  formatDistanceToNow,
  formatDuration,
  intervalToDuration,
  differenceInDays,
} from "date-fns";
export const toNow = (
  date?: Date | string | number,
  opts = { addSuffix: false },
) => (date ? formatDistanceToNow(date, opts) : undefined);

/**
 * Converts average duration in seconds to days using date-fns.
 * @param averageDurationSeconds - The average duration in seconds.
 * @returns The average duration in days.
 */

export function formatAverageDurationToDays(
  averageDurationSeconds: number,
): number {
  const now = new Date();
  const endDate = new Date(now.getTime() + averageDurationSeconds * 1000); // Convert seconds to milliseconds

  return differenceInDays(endDate, now); // Calculate the difference in days
}

export function formatSecondsToDays(seconds = 0) {
  const now = new Date();
  const targetDate = new Date(seconds);

  const duration = intervalToDuration({ start: now, end: targetDate });

  // If less than 24 hours, use toNow
  const hoursDifference = Math.abs(
    (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60),
  );
  if (hoursDifference < 24) {
    return toNow(targetDate);
  }

  // If more than a month, use format(date, "PPP")
  const monthsDifference = Math.abs(
    (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30),
  );
  if (monthsDifference >= 1) {
    return format(targetDate, "PP");
  }

  // Default behavior: format duration
  const formattedDuration = formatDuration(duration, {
    delimiter: ", ",
    format: ["years", "months", "days", "hours"],
  });

  return formattedDuration;
}

export const timeAgo = (
  d: Date | number,
  opts: { short: boolean } = { short: true },
) => {
  return d
    ? formatDistanceToNow(d, {
        addSuffix: !opts.short,
        locale: {
          ...locale,
          formatDistance: opts.short ? formatDistance : locale.formatDistance,
        },
      })
    : null;
};
const formatDistance = (token: string, count: number) =>
  formatDistanceLocale[token as keyof typeof formatDistanceLocale].replace(
    "{{count}}",
    String(count),
  );

const formatDistanceLocale = {
  lessThanXSeconds: "{{count}}s",
  xSeconds: "{{count}}s",
  halfAMinute: "30s",
  lessThanXMinutes: "{{count}}m",
  xMinutes: "{{count}}m",
  aboutXHours: "{{count}}h",
  xHours: "{{count}}h",
  xDays: "{{count}}d",
  aboutXWeeks: "{{count}}w",
  xWeeks: "{{count}}w",
  aboutXMonths: "{{count}}m",
  xMonths: "{{count}}m",
  aboutXYears: "{{count}}y",
  xYears: "{{count}}y",
  overXYears: "{{count}}y",
  almostXYears: "{{count}}y",
};

export function formatNumber(num = 0, options?: Intl.NumberFormatOptions) {
  return (
    Number(num)?.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8,
      ...options,
    }) ?? "0"
  );
}

export const suffixNumber = (num: number) => {
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1_000, symbol: "k" },
    { value: 1_000_000, symbol: "M" },
  ];
  const regexp = /\.0+$|(\.[0-9]*[1-9])0+$/;
  const item = [...lookup].reverse().find((item) => num >= item.value);
  return item
    ? (num / item.value).toFixed(2).replace(regexp, "$1") + item.symbol
    : "0";
};

export function formatMoney(val = 0, currency?: string, decimals = 2) {
  return Number(val).toLocaleString("en-US", {
    currency,
    style: currency ? "currency" : undefined,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
