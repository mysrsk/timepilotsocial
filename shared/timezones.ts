export const US_TIME_ZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
] as const;

export type LocalScheduleInput = {
  date: string;
  time: string;
  timeZone: string;
};

export type ResolvedSchedule = {
  utcDate: Date;
  requestedLocalTime: string;
  resolvedLocalTime: string;
  adjustedForDstGap: boolean;
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string) {
  const cached = formatterCache.get(timeZone);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  formatterCache.set(timeZone, formatter);
  return formatter;
}

export function timeZoneParts(date: Date, timeZone: string) {
  const parts = getFormatter(timeZone).formatToParts(date);
  const values = Object.fromEntries(
    parts.filter(part => part.type !== "literal").map(part => [part.type, part.value])
  );
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function timeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = timeZoneParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return asUtc - date.getTime();
}

function localMinuteStamp(parts: ReturnType<typeof timeZoneParts>) {
  return parts.hour * 60 + parts.minute;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function localStamp(parts: ReturnType<typeof timeZoneParts>) {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function resolveLocalDateTime(input: LocalScheduleInput): ResolvedSchedule {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(input.time);
  if (!match || !timeMatch) throw new Error("Use YYYY-MM-DD and HH:mm for scheduling.");

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (hour > 23 || minute > 59) throw new Error("Use a valid 24-hour time.");

  // Validates IANA zone names and lets the runtime’s time-zone database apply current DST rules.
  getFormatter(input.timeZone);

  const requestedLocalTime = `${input.date}T${input.time}`;
  const targetMinute = hour * 60 + minute;
  const guessedUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  let candidate = new Date(guessedUtc - timeZoneOffsetMs(new Date(guessedUtc), input.timeZone));
  const correctedOffset = timeZoneOffsetMs(candidate, input.timeZone);
  candidate = new Date(guessedUtc - correctedOffset);

  const rendered = timeZoneParts(candidate, input.timeZone);
  if (localStamp(rendered) === requestedLocalTime) {
    return {
      utcDate: candidate,
      requestedLocalTime,
      resolvedLocalTime: requestedLocalTime,
      adjustedForDstGap: false,
    };
  }

  // A spring-forward gap has no exact local instant. Resolve deterministically to the first valid
  // local minute after the requested wall-clock time, without asking the user to calculate offsets.
  for (let shift = -180; shift <= 240; shift += 1) {
    const option = new Date(candidate.getTime() + shift * 60_000);
    const optionParts = timeZoneParts(option, input.timeZone);
    const isSameDay =
      optionParts.year === year && optionParts.month === month && optionParts.day === day;
    if (isSameDay && localMinuteStamp(optionParts) >= targetMinute) {
      return {
        utcDate: option,
        requestedLocalTime,
        resolvedLocalTime: localStamp(optionParts),
        adjustedForDstGap: true,
      };
    }
  }

  throw new Error("This local time could not be resolved in the selected time zone.");
}

export function formatInTimeZone(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(date);
}

export function utcCronForOneTimePost(date: Date) {
  return `0 ${date.getUTCMinutes()} ${date.getUTCHours()} ${date.getUTCDate()} ${date.getUTCMonth() + 1} *`;
}
