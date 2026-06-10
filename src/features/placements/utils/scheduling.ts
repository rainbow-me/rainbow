export type ScheduleWindow = {
  endsAt?: string;
  startsAt?: string;
};

export type EnabledSchedule = boolean | ScheduleWindow;

export function isScheduleWindowEnabled(schedule: ScheduleWindow, now: number): boolean {
  const startsAt = schedule.startsAt ? Date.parse(schedule.startsAt) : undefined;
  const endsAt = schedule.endsAt ? Date.parse(schedule.endsAt) : undefined;

  if (startsAt !== undefined && (!Number.isFinite(startsAt) || now < startsAt)) return false;
  if (endsAt !== undefined && (!Number.isFinite(endsAt) || now >= endsAt)) return false;

  return true;
}

export function isEnabledSchedule(enabled: EnabledSchedule, now: number): boolean {
  if (enabled === true) return true;
  if (enabled === false) return false;

  return isScheduleWindowEnabled(enabled, now);
}
