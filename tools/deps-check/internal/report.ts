import type { PlatformResult } from './classify';
import type { BaselineDelta } from './delta';
import { tagByPlatform, violationKey, type TaggedViolation, type Violation } from './violation';

export type Report = {
  results: PlatformResult[];
  strictViolations: TaggedViolation[];
  newViolations: TaggedViolation[];
  stale: TaggedViolation[];
  /** Baseline entries this change removed whose violations are truly gone. */
  banked: TaggedViolation[];
  /** Baseline entries this change added (grandfathered via --allow-additions). */
  grandfathered: TaggedViolation[];
  failed: boolean;
};

export function buildReport(results: PlatformResult[], delta: BaselineDelta | null): Report {
  const tag = (pick: (result: PlatformResult) => Violation[]): TaggedViolation[] =>
    tagByPlatform(results.map(result => ({ platform: result.platform, violations: pick(result) })));

  const strictViolations = tag(r => r.strictViolations);
  const newViolations = tag(r => r.newViolations);
  const stale = tag(r => r.staleEntries);
  // A baseline entry removed while its violation still occurs is not a banked
  // fix — it resurfaces above as a new violation, so it is excluded here.
  const occurringKeys = new Set(newViolations.map(tagged => violationKey(tagged.violation)));
  const banked = (delta?.banked ?? []).filter(tagged => !occurringKeys.has(violationKey(tagged.violation)));
  const grandfathered = delta?.grandfathered ?? [];
  // Stale entries fail too: keeping baselines exact means staleness on a PR
  // always means THIS PR fixed something, so the remedy lands where it belongs.
  const failed = strictViolations.length > 0 || newViolations.length > 0 || stale.length > 0;
  return { results, strictViolations, newViolations, stale, banked, grandfathered, failed };
}
