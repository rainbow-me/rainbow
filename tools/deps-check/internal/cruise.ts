import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { ROOT } from './paths';
import type { Violation } from './violation';

export type CruiseSummary = {
  violations: Violation[];
  ruleSetUsed?: { forbidden?: { name: string }[] };
};

/**
 * The graphs .dependency-cruiser.cjs exports, selected by DEPCRUISE_GRAPH. Each
 * rule lives on exactly one graph, so unioning the two summaries loses nothing
 * and double-counts nothing.
 */
export const GRAPHS = ['first-party', 'third-party'] as const;
export type Graph = (typeof GRAPHS)[number];

const TMP = mkdtempSync(join(tmpdir(), 'deps-check-'));
process.on('exit', () => rmSync(TMP, { recursive: true, force: true }));

/**
 * Cruise every graph for one platform and return the union: the raw violation
 * list plus the rule set used. The cruise is baseline-agnostic; all baseline
 * matching happens downstream by identity (see classify.ts).
 */
export function cruise(platform: string): CruiseSummary {
  const summaries = GRAPHS.map(graph => cruiseGraph(platform, graph));
  return {
    violations: summaries.flatMap(summary => summary.violations),
    ruleSetUsed: { forbidden: summaries.flatMap(summary => summary.ruleSetUsed?.forbidden ?? []) },
  };
}

function cruiseGraph(platform: string, graph: Graph): CruiseSummary {
  const out = join(TMP, `cruise-${platform}-${graph}.json`);
  const cliArgs = ['index.js', '--config', '.dependency-cruiser.cjs', '--output-type', 'json', '--output-to', out, '--progress', 'none'];
  const res = spawnSync(join(ROOT, 'node_modules/.bin/depcruise'), cliArgs, {
    cwd: ROOT,
    env: { ...process.env, DEPCRUISE_PLATFORM: platform, DEPCRUISE_GRAPH: graph },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  // depcruise exits with the violation count; only a missing result file is fatal.
  if (!existsSync(out)) {
    console.error(res.stderr?.toString() ?? '');
    throw new Error(`depcruise produced no output for ${platform}/${graph} (exit ${res.status})`);
  }
  return (JSON.parse(readFileSync(out, 'utf8')) as { summary: CruiseSummary }).summary;
}
