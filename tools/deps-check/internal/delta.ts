import { readBaseline, readBaselineAtRef } from './baseline';
import { differenceByIdentity, tagByPlatform, type TaggedViolation, type Violation } from './violation';

/** What this change did to the committed baselines, relative to the merge base. */
export type BaselineDelta = { banked: TaggedViolation[]; grandfathered: TaggedViolation[] };

/**
 * Base ref for baseline comparison. On pull_request runs the checkout is the
 * merge commit, so HEAD^1 is the base branch tip and the diff is exactly this
 * change's effect on the baselines. Overridable for other contexts, e.g.
 * DEPS_CHECK_BASE_REF=origin/develop for a local "what did my branch change".
 */
const BASE_REF = process.env.DEPS_CHECK_BASE_REF ?? 'HEAD^1';

export type BaselinePair = { platform: string; base: Violation[]; head: Violation[] };

/**
 * What this change did to the committed baseline files, relative to BASE_REF.
 * Returns null when no base baseline is readable (shallow clone, local run
 * without the ref, pre-rename history), in which case the report simply omits
 * the delta sections.
 */
export function computeBaselineDelta(platforms: string[]): BaselineDelta | null {
  const pairs: BaselinePair[] = [];
  for (const platform of platforms) {
    const base = readBaselineAtRef(platform, BASE_REF);
    if (base) {
      pairs.push({ platform, base, head: readBaseline(platform) });
    }
  }
  if (pairs.length === 0) {
    return null;
  }
  return baselineDelta(pairs);
}

/**
 * The movement between each platform's base and head baselines, unioned
 * across platforms by identity: entries removed (fixes being banked) and
 * entries added (grandfathered via --allow-additions).
 */
export function baselineDelta(pairs: BaselinePair[]): BaselineDelta {
  return {
    banked: tagByPlatform(pairs.map(({ platform, base, head }) => ({ platform, violations: differenceByIdentity(base, head) }))),
    grandfathered: tagByPlatform(pairs.map(({ platform, base, head }) => ({ platform, violations: differenceByIdentity(head, base) }))),
  };
}
