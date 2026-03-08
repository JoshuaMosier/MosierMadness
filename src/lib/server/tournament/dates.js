/**
 * Convert a JS Date to {year, month, day} parts in Eastern time.
 * month and day are zero-padded 2-digit strings. year is a 4-digit string.
 */
export function getEasternDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const [month, day, year] = formatter.format(date).split('/');
  return { year, month, day };
}

/**
 * Parse a dateValue (Date object or "YYYY-MM-DD" string) into {year, month, day}.
 * For Date objects, returns Eastern time parts.
 */
export function parseDateParts(dateValue = new Date()) {
  if (typeof dateValue === 'string') {
    const [year, month, day] = dateValue.split('-');
    return { year, month, day };
  }

  return getEasternDateParts(dateValue);
}

/**
 * Format a dateValue as "MM/DD/YYYY" for the NCAA sdata contests API.
 */
export function formatContestDate(dateValue = new Date()) {
  const { year, month, day } = parseDateParts(dateValue);
  return `${month}/${day}/${year}`;
}

/**
 * Format a date as "YYYY-MM-DD" in Eastern time for settings/comparison.
 * Uses 'en-CA' locale which produces ISO-format dates.
 */
export function getTodayEtDateString(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(date);
}

/**
 * Compute the NCAA "season year" (the academic year start) for a given date.
 * Nov or later = current calendar year; earlier months = previous calendar year.
 */
export function getSeasonYear(dateValue = new Date()) {
  const { year, month } = parseDateParts(dateValue);

  const numericYear = Number.parseInt(year, 10);
  const numericMonth = Number.parseInt(month, 10);

  if (!Number.isFinite(numericYear) || !Number.isFinite(numericMonth)) {
    return new Date().getFullYear();
  }

  return numericMonth >= 11 ? numericYear : numericYear - 1;
}
