export type ModuleRef = { name: string };

/** The subset of dependency-cruiser's violation shape this check consumes. */
export type Violation = {
  from: string;
  to: string;
  rule: { name: string };
  cycle?: ModuleRef[];
  via?: ModuleRef[];
};

/** A violation deduped across platforms, tagged with where it occurs. */
export type TaggedViolation = { violation: Violation; platforms: string[] };

function sortedNames(modules: ModuleRef[]): string {
  return modules
    .map(m => m.name)
    .sort()
    .join('|');
}

/**
 * Canonical identity of a violation — the single definition used for
 * classification, staleness, deltas, and baseline updates alike. Cycles are
 * identified by rule + module-name set (rotation- and order-insensitive), so
 * an unchanged cycle keeps its identity no matter which edge reported it;
 * plain edges by rule + from→to.
 */
export function violationKey(v: Violation): string {
  if (v.cycle) {
    return `${v.rule.name}|cycle|${sortedNames(v.cycle)}`;
  }
  if (v.via) {
    return `${v.rule.name}|via|${v.from}>${v.to}|${sortedNames(v.via)}`;
  }
  return `${v.rule.name}|edge|${v.from}>${v.to}`;
}

/** Entries of `a` whose identity does not occur in `b`. */
export function differenceByIdentity(a: Violation[], b: Violation[]): Violation[] {
  const bKeys = new Set(b.map(violationKey));
  return a.filter(v => !bKeys.has(violationKey(v)));
}

/** Unions per-platform violation groups by identity, tagging each violation with the platforms it occurs on. */
export function tagByPlatform(groups: { platform: string; violations: Violation[] }[]): TaggedViolation[] {
  const union = new Map<string, TaggedViolation>();
  for (const { platform, violations } of groups) {
    for (const violation of violations) {
      const key = violationKey(violation);
      if (!union.has(key)) {
        union.set(key, { violation, platforms: [] });
      }
      union.get(key)?.platforms.push(platform);
    }
  }
  return [...union.values()];
}

/** Canonical textual form: cycles as a closed loop, plain edges as from → to. */
export function describeViolation(v: Violation): string {
  return v.cycle ? [...v.cycle.map(m => m.name), v.cycle[0].name].join(' → ') : `${v.from} → ${v.to}`;
}
