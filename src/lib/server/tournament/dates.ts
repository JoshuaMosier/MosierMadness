export interface DateParts {
  year: string;
  month: string;
  day: string;
}

export interface EasternDateOptions {
  dayStartsAtHourEt?: number;
}

interface EasternDateTimeParts extends DateParts {
  hour: string;
}

export const SCOREBOARD_DAY_START_HOUR_ET = 4;

function padNumber(value: number): string {
  return String(value).padStart(2, '0');
}

function shiftDatePartsByDays(parts: DateParts, deltaDays: number): DateParts {
  const shifted = new Date(Date.UTC(
    Number.parseInt(parts.year, 10),
    Number.parseInt(parts.month, 10) - 1,
    Number.parseInt(parts.day, 10) + deltaDays,
  ));

  return {
    year: String(shifted.getUTCFullYear()),
    month: padNumber(shifted.getUTCMonth() + 1),
    day: padNumber(shifted.getUTCDate()),
  };
}

function getEasternDateTimeParts(date: Date = new Date()): EasternDateTimeParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  });

  const lookup = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter(part => part.type !== 'literal')
      .map(part => [part.type, part.value]),
  ) as Record<string, string>;

  return {
    year: lookup.year,
    month: lookup.month,
    day: lookup.day,
    hour: lookup.hour,
  };
}

/**
 * Convert a JS Date to {year, month, day} parts in Eastern time.
 * month and day are zero-padded 2-digit strings. year is a 4-digit string.
 */
export function getEasternDateParts(date: Date = new Date(), options: EasternDateOptions = {}): DateParts {
  const { dayStartsAtHourEt = 0 } = options;
  const { year, month, day, hour } = getEasternDateTimeParts(date);

  if (dayStartsAtHourEt > 0 && Number.parseInt(hour, 10) < dayStartsAtHourEt) {
    return shiftDatePartsByDays({ year, month, day }, -1);
  }

  return { year, month, day };
}

/**
 * Parse a dateValue (Date object or "YYYY-MM-DD" string) into {year, month, day}.
 * For Date objects, returns Eastern time parts.
 */
export function parseDateParts(
  dateValue: Date | string = new Date(),
  options: EasternDateOptions = {},
): DateParts {
  if (typeof dateValue === 'string') {
    const [year, month, day] = dateValue.split('-');
    return { year, month, day };
  }

  return getEasternDateParts(dateValue, options);
}

/**
 * Format a dateValue as "MM/DD/YYYY" for the NCAA sdata contests API.
 */
export function formatContestDate(
  dateValue: Date | string = new Date(),
  options: EasternDateOptions = {},
): string {
  const { year, month, day } = parseDateParts(dateValue, options);
  return `${month}/${day}/${year}`;
}

/**
 * Format a date as "YYYY-MM-DD" in Eastern time for settings/comparison.
 */
export function getTodayEtDateString(date: Date = new Date(), options: EasternDateOptions = {}): string {
  const { year, month, day } = getEasternDateParts(date, options);
  return `${year}-${month}-${day}`;
}

/**
 * Compute the NCAA "season year" (the academic year start) for a given date.
 * Nov or later = current calendar year; earlier months = previous calendar year.
 */
export function getSeasonYear(
  dateValue: Date | string = new Date(),
  options: EasternDateOptions = {},
): number {
  const { year, month } = parseDateParts(dateValue, options);

  const numericYear = Number.parseInt(year, 10);
  const numericMonth = Number.parseInt(month, 10);

  if (!Number.isFinite(numericYear) || !Number.isFinite(numericMonth)) {
    return new Date().getFullYear();
  }

  return numericMonth >= 11 ? numericYear : numericYear - 1;
}
