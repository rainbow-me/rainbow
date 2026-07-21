import { policyFor } from '../policies';
import { differenceByIdentity, violationKey, type Violation } from './violation';

/** Classification of one platform's cruise against its baseline. */
export type PlatformResult = {
  platform: string;
  newViolations: Violation[];
  strictViolations: Violation[];
  staleEntries: Violation[];
  /** Committed baseline entries per rule. */
  baselineCountByRule: Record<string, number>;
  /** Identity fingerprint of the committed baseline set per rule, for cross-platform row collapsing. */
  baselineFingerprintByRule: Record<string, string>;
};

/**
 * Classify one platform's raw cruise output against its committed baseline.
 * Matching is identity-based throughout: occurrences with no baseline entry
 * are new, baseline entries with no occurrence are stale (fixed, awaiting a
 * ratchet). Strict-mode rules skip the baseline entirely — every occurrence
 * fails, and a baseline entry can never neutralize one.
 */
export function classifyPlatform(platform: string, baseline: Violation[], violations: Violation[]): PlatformResult {
  const occurring = violations.filter(v => policyFor(v.rule.name).mode === 'baseline');
  const newViolations = differenceByIdentity(occurring, baseline);
  const strictViolations = violations.filter(v => policyFor(v.rule.name).mode === 'strict');
  const staleEntries = differenceByIdentity(baseline, violations);

  const baselineCountByRule: Record<string, number> = {};
  for (const entry of baseline) {
    baselineCountByRule[entry.rule.name] = (baselineCountByRule[entry.rule.name] ?? 0) + 1;
  }

  // Identity fingerprint per rule (the committed baseline set), so renderers
  // collapse per-platform state rows when the committed baselines are truly
  // identical — equal counts over different grandfathered cycles must NOT
  // collapse. Pending occurrences live in the sections, not the table, so
  // they do not participate.
  const keysByRule: Record<string, string[]> = {};
  for (const entry of baseline) {
    (keysByRule[entry.rule.name] ??= []).push(violationKey(entry));
  }
  const baselineFingerprintByRule = Object.fromEntries(Object.entries(keysByRule).map(([rule, keys]) => [rule, keys.sort().join('|')]));

  return { platform, newViolations, strictViolations, staleEntries, baselineCountByRule, baselineFingerprintByRule };
}
