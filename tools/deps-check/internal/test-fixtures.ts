import { classifyPlatform } from './classify';
import { baselineDelta } from './delta';
import { buildReport, type Report } from './report';
import type { Violation } from './violation';

export function cycle(names: string[], rule = 'no-circular'): Violation {
  return {
    from: names[0],
    to: names[1],
    rule: { name: rule },
    cycle: names.map(name => ({ name })),
  };
}

export function edge(from: string, to: string, rule: string): Violation {
  return { from, to, rule: { name: rule } };
}

type Scenario = {
  /** Committed (head) baselines per platform. */
  committed: Record<string, Violation[]>;
  /** Violations actually occurring in the code per platform. */
  occurring: Record<string, Violation[]>;
  /** Base-ref baselines; omit for "baselines untouched", null for "no base ref readable". */
  baseCommitted?: Record<string, Violation[]> | null;
};

/** Build a Report the way runCheck does, minus the cruise and git reads. */
export function check({ committed, occurring, baseCommitted }: Scenario): Report {
  const platforms = Object.keys(committed);
  const results = platforms.map(platform => classifyPlatform(platform, committed[platform], occurring[platform] ?? []));
  const delta =
    baseCommitted === null
      ? null
      : baselineDelta(
          platforms.map(platform => ({ platform, base: (baseCommitted ?? committed)[platform] ?? [], head: committed[platform] }))
        );
  return buildReport(results, delta);
}
