#!/usr/bin/env tsx
/**
 * Dependency-rule gate over dependency-cruiser, with a per-rule policy layer.
 *
 * Rules live in .dependency-cruiser.cjs; what a violation of each rule means
 * (grandfathered vs strict) is declared in ./policies.ts. Baseline diffing is
 * identity-based (a cycle is matched by rule + module set, rotation-
 * insensitive), so removing five violations never buys room for a new one.
 *
 * dependency-cruiser resolves one platform per run (foo.ios / foo.android),
 * so every check runs once per platform; the union of the two runs sees every
 * edge that can ship on either platform. Each platform run cruises both graphs
 * declared in .dependency-cruiser.cjs (first-party, third-party) and unions
 * their violations; see internal/cruise.ts.
 *
 * Usage:
 *   yarn lint:deps                                     # check (CI + local)
 *   yarn lint:deps:baseline:update                     # ratchet baselines down
 *   yarn lint:deps:baseline:update --allow-additions   # deliberately grandfather
 *
 * Output: human-readable terminal report; deps-report.md (always, for the CI
 * step summary); deps-comment.md (when the check fails OR this change touched
 * the baselines — banked fixes and grandfathered additions stay visible on
 * green runs; consumed by the sticky PR comment step); GitHub error
 * annotations on new violations when running in Actions.
 *
 * Exit codes: 0 clean; 1 violations (new, strict, or fixed-but-unratcheted);
 * 2 configuration error.
 */
import { rmSync, writeFileSync } from 'node:fs';

import { planUpdate, readBaseline, writeBaseline } from './internal/baseline';
import { classifyPlatform } from './internal/classify';
import { cruise, type CruiseSummary } from './internal/cruise';
import { computeBaselineDelta } from './internal/delta';
import { COMMENT_PATH, REPORT_PATH } from './internal/paths';
import { renderAnnotations } from './internal/render/annotations';
import { renderMarkdown } from './internal/render/markdown';
import { renderTerminal } from './internal/render/terminal';
import { buildReport } from './internal/report';
import { describeViolation } from './internal/violation';
import { policyFor, unknownPolicyRules } from './policies';

const platforms = ['ios', 'android'];

const args = process.argv.slice(2);
const updateBaseline = args.includes('--update-baseline');
const allowAdditions = args.includes('--allow-additions');

/** A policy naming a rule that does not exist is a typo or a missed rename; fail loudly. */
function validatePolicies(summary: CruiseSummary): void {
  const unknown = unknownPolicyRules(new Set((summary.ruleSetUsed?.forbidden ?? []).map(rule => rule.name)));
  if (unknown.length > 0) {
    console.error(`✖ tools/deps-check/policies.ts references rules missing from .dependency-cruiser.cjs: ${unknown.join(', ')}`);
    process.exit(2);
  }
}

function runUpdate(): void {
  for (const platform of platforms) {
    const summary = cruise(platform);
    validatePolicies(summary);
    const current = summary.violations.filter(v => policyFor(v.rule.name).mode === 'baseline');
    const { written, removed, additions } = planUpdate(readBaseline(platform), current, allowAdditions);
    writeBaseline(platform, written);
    console.log(
      `✔ ${platform}: baseline written (${written.length} entries; ${removed.length} removed, ${allowAdditions ? additions.length : 0} added)`
    );

    if (!allowAdditions && additions.length > 0) {
      console.warn(`⚠ ${platform}: ${additions.length} new violation${additions.length === 1 ? '' : 's'} left out of the baseline:`);
      for (const v of additions) {
        console.warn(`    ${v.rule.name}: ${describeViolation(v)}`);
      }
      console.warn('  The check keeps failing until these are fixed, or grandfathered with --allow-additions.');
    }
  }
  process.exit(0);
}

function runCheck(): void {
  rmSync(REPORT_PATH, { force: true });
  rmSync(COMMENT_PATH, { force: true });

  const results = platforms.map(platform => {
    const summary = cruise(platform);
    validatePolicies(summary);
    return classifyPlatform(platform, readBaseline(platform), summary.violations);
  });
  const report = buildReport(results, computeBaselineDelta(platforms));

  console.log(renderTerminal(report));
  if (process.env.GITHUB_ACTIONS) {
    for (const line of renderAnnotations(report)) {
      console.log(line);
    }
  }
  const markdown = renderMarkdown(report);
  writeFileSync(REPORT_PATH, markdown);

  if (report.failed || report.banked.length > 0 || report.grandfathered.length > 0) {
    writeFileSync(COMMENT_PATH, markdown);
  }

  process.exit(report.failed ? 1 : 0);
}

if (updateBaseline) {
  runUpdate();
} else {
  runCheck();
}
