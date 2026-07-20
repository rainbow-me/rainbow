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

const TMP = mkdtempSync(join(tmpdir(), 'deps-check-'));
process.on('exit', () => rmSync(TMP, { recursive: true, force: true }));

/**
 * Run the depcruise CLI for one platform and return the result summary: the
 * raw violation list plus the rule set used. The cruise is baseline-agnostic;
 * all baseline matching happens downstream by identity (see classify.ts).
 */
export function cruise(platform: string): CruiseSummary {
  const out = join(TMP, `cruise-${platform}.json`);
  const cliArgs = ['index.js', '--config', '.dependency-cruiser.cjs', '--output-type', 'json', '--output-to', out, '--progress', 'none'];
  const res = spawnSync(join(ROOT, 'node_modules/.bin/depcruise'), cliArgs, {
    cwd: ROOT,
    env: { ...process.env, DEPCRUISE_PLATFORM: platform },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  // depcruise exits with the violation count; only a missing result file is fatal.
  if (!existsSync(out)) {
    console.error(res.stderr?.toString() ?? '');
    throw new Error(`depcruise produced no output for ${platform} (exit ${res.status})`);
  }
  return (JSON.parse(readFileSync(out, 'utf8')) as { summary: CruiseSummary }).summary;
}
