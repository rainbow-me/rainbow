/**
 * Per-rule policies for the dependency graph gate.
 *
 * Every rule in .dependency-cruiser.cjs gets its violations judged by one of
 * two modes:
 *
 * - `baseline`: violations are grandfathered. Pre-existing ones live in
 *   .deps-check-baseline.{ios,android}.json and are ignored,
 *   net-new ones fail CI, and fixed ones also fail until the baseline is
 *   ratcheted down (`yarn lint:deps:baseline:update`), so baselines stay exact
 *   and staleness on a PR always belongs to that PR. Deliberate additions
 *   require `--allow-additions` and show up as baseline growth in the PR diff.
 *
 * - `strict`: nothing is tolerated. Any violation fails CI, and baseline
 *   entries for the rule are themselves an error, so strict rules can never
 *   be grandfathered by accident.
 *
 * Rules not listed here default to `strict`, so a new rule is never silently
 * baselinable. Adding a grandfathered category is one `baseline` entry here;
 * `label` and `hint` drive the failure message.
 */
export type Policy = {
  mode: 'baseline' | 'strict';
  label: string;
  /** Shown under failures as the suggested remedy. */
  hint?: string;
};

const POLICIES: Record<string, Policy> = {
  'no-circular': {
    mode: 'baseline',
    label: 'Circular dependencies',
    hint: 'Fix the cycle (usually: extract the shared piece into its own module).',
  },
  'no-dep-into-app-source': { mode: 'strict', label: 'Third-party package importing app code' },
};

export function policyFor(ruleName: string): Policy {
  return POLICIES[ruleName] ?? { mode: 'strict', label: ruleName };
}

export function unknownPolicyRules(ruleNames: Set<string>): string[] {
  return Object.keys(POLICIES).filter(name => !ruleNames.has(name));
}
