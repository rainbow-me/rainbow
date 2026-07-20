import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { ROOT } from './paths';
import { differenceByIdentity, type Violation } from './violation';

export function readBaseline(platform: string): Violation[] {
  return existsSync(baselinePath(platform)) ? (JSON.parse(readFileSync(baselinePath(platform), 'utf8')) as Violation[]) : [];
}

/** The platform's baseline as committed at `ref`; null when not readable there. */
export function readBaselineAtRef(platform: string, ref: string): Violation[] | null {
  // Baselines are multi-megabyte; spawnSync's default 1MiB maxBuffer kills git mid-pipe.
  const result = spawnSync('git', ['show', `${ref}:${baselineFile(platform)}`], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) {
    return null;
  }
  try {
    return JSON.parse(result.stdout) as Violation[];
  } catch {
    return null;
  }
}

export function writeBaseline(platform: string, entries: Violation[]): void {
  writeFileSync(baselinePath(platform), JSON.stringify(entries, null, 2) + '\n');
}

export type UpdatePlan = { written: Violation[]; removed: Violation[]; additions: Violation[] };

/**
 * Ratchet plan for one platform's baseline. Removals always apply (banking
 * fixes is never blocked); additions only with `allowAdditions`. Kept entries
 * are preserved verbatim from the old baseline so the diff shows exactly the
 * removals.
 */
export function planUpdate(oldBaseline: Violation[], current: Violation[], allowAdditions: boolean): UpdatePlan {
  const additions = differenceByIdentity(current, oldBaseline);
  const removed = differenceByIdentity(oldBaseline, current);
  const written = allowAdditions ? current : differenceByIdentity(oldBaseline, removed);
  return { written, removed, additions };
}

function baselineFile(platform: string): string {
  return `.deps-check-baseline.${platform}.json`;
}

function baselinePath(platform: string): string {
  return join(ROOT, baselineFile(platform));
}
