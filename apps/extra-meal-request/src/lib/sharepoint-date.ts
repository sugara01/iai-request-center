const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * Keeps a SharePoint Date Only value as a calendar string. The native Power Apps
 * SharePoint client accepts this format without converting it through browser UTC.
 */
export function toSharePointDateOnly(value: string | undefined): string | undefined {
  return fromSharePointDateOnly(value);
}

/** Returns the calendar portion without parsing through the browser timezone. */
export function fromSharePointDateOnly(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  if (!normalized) return undefined;

  const match = normalized.match(CALENDAR_DATE_PATTERN);
  if (!match) return normalized;

  const [, year, month, day] = match;
  return `${year}-${month}-${day}`;
}

export function getSharePointTimestamp(value: string | undefined): number | undefined {
  const normalized = value?.trim();
  if (!normalized) return undefined;

  const nativeTimestamp = Date.parse(normalized);
  if (Number.isFinite(nativeTimestamp)) return nativeTimestamp;

  const localizedMatch = normalized.match(
    /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:[ T](\d{1,2}):?(\d{2})?(?::?(\d{2}))?)?$/,
  );
  if (!localizedMatch) return undefined;

  const [, day, month, year, hour = '0', minute = '0', second = '0'] = localizedMatch;
  const timestamp = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  ).getTime();

  return Number.isFinite(timestamp) ? timestamp : undefined;
}

export function compareNewestSharePointDate(
  firstDate: string | undefined,
  secondDate: string | undefined,
  firstFallback: number | string,
  secondFallback: number | string,
): number {
  const firstTimestamp = getSharePointTimestamp(firstDate);
  const secondTimestamp = getSharePointTimestamp(secondDate);

  if (firstTimestamp !== undefined && secondTimestamp !== undefined && firstTimestamp !== secondTimestamp) {
    return secondTimestamp - firstTimestamp;
  }
  if (firstTimestamp !== undefined) return -1;
  if (secondTimestamp !== undefined) return 1;

  return String(secondFallback).localeCompare(String(firstFallback), 'id', {
    numeric: true,
    sensitivity: 'base',
  });
}
