import { type Enabled } from '@/features/placements/surfaces/types';

export function isEnabled(enabled: Enabled | undefined, now: number): boolean {
  if (enabled === undefined || enabled === true) return true;
  if (enabled === false) return false;

  const startsAt = enabled.startsAt ? Date.parse(enabled.startsAt) : undefined;
  const endsAt = enabled.endsAt ? Date.parse(enabled.endsAt) : undefined;

  if (startsAt !== undefined && (!Number.isFinite(startsAt) || now < startsAt)) return false;
  if (endsAt !== undefined && (!Number.isFinite(endsAt) || now >= endsAt)) return false;

  return true;
}
