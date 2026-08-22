/**
 * Plans duration-balanced E2E shards and updates their timing history.
 *
 * Usage:
 *   node tools/e2e-sharding/index.ts plan <platform> <shardTotal> <shardIndex> <flowsDir> <historyFile> <selectionFile> <planFile>
 *   node tools/e2e-sharding/index.ts update <platform> <resultsDir> <historyFile>
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';

const DEFAULT_WEIGHT = 60;
const HISTORY_HEADER = 'platform\ttest\tupdated_at\tpass_weight\tretry_weight\tpass_duration\ttotal_duration\tattempts';
const PLAN_HEADER = 'platform\tshard\tshard_total\tplanned_shard_seconds\tflow_seconds\tflow';

type Timing = {
  platform: string;
  test: string;
  updatedAt: number;
  passWeight: number;
  retryWeight: number;
  passDuration: number;
  totalDuration: number;
  attempts: number;
};

type Result = {
  platform: string;
  test: string;
  shard: number;
  status: string;
  attempts: number | null;
  duration: number | null;
  passDuration: number | null;
};

type WeightedFlow = {
  file: string;
  test: string;
  weight: number;
};

type Shard = {
  index: number;
  totalWeight: number;
  flows: WeightedFlow[];
};

function filesUnder(root: string, suffix: string): string[] {
  const files: string[] = [];

  function visit(directory: string): void {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile() && entry.name.endsWith(suffix)) files.push(path);
    }
  }

  visit(root);
  return files;
}

function testId(flowsDir: string, flow: string): string {
  return relative(flowsDir, flow)
    .split(sep)
    .join('/')
    .replace(/\.yaml$/, '');
}

function parseInteger(value: string, name: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${name} must be a positive integer, got: ${value}`);
  return parsed;
}

function parseTiming(line: string, platform: string): Timing | null {
  const [rowPlatform, test, ...rawNumbers] = line.split('\t');
  if (!rowPlatform || rowPlatform === 'platform' || rowPlatform !== platform || !test || rawNumbers.length !== 6) return null;

  const [updatedAt, passWeight, retryWeight, passDuration, totalDuration, attempts] = rawNumbers.map(Number);
  const valid =
    [updatedAt, passWeight, retryWeight, passDuration, totalDuration, attempts].every(Number.isFinite) &&
    updatedAt >= 0 &&
    passWeight >= 1 &&
    retryWeight >= 0 &&
    passDuration >= 1 &&
    totalDuration >= passDuration &&
    Number.isInteger(attempts) &&
    attempts >= 1;

  if (!valid) {
    console.error(`Skipping invalid timing row: ${line}`);
    return null;
  }

  return { platform, test, updatedAt, passWeight, retryWeight, passDuration, totalDuration, attempts };
}

function readHistory(file: string, platform: string): Map<string, Timing> {
  const timings = new Map<string, Timing>();
  if (!existsSync(file)) return timings;

  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const timing = parseTiming(line, platform);
    if (timing) timings.set(timing.test, timing);
  }
  return timings;
}

function plan(platform: string, shardTotal: number, shardIndex: number, flowsDir: string, historyFile: string): Shard[] {
  if (shardIndex > shardTotal) throw new Error(`shardIndex ${shardIndex} exceeds shardTotal ${shardTotal}`);

  const timings = readHistory(historyFile, platform);
  const flows = filesUnder(flowsDir, '.yaml')
    .map(file => {
      const test = testId(flowsDir, file);
      const timing = timings.get(test);
      return { file, test, weight: timing ? timing.passWeight + timing.retryWeight : DEFAULT_WEIGHT };
    })
    .sort((a, b) => b.weight - a.weight || a.test.localeCompare(b.test));
  const shards = Array.from({ length: shardTotal }, (_, index): Shard => ({ index: index + 1, totalWeight: 0, flows: [] }));

  for (const flow of flows) {
    const shard = shards.reduce((lightest, candidate) =>
      candidate.totalWeight < lightest.totalWeight || (candidate.totalWeight === lightest.totalWeight && candidate.index < lightest.index)
        ? candidate
        : lightest
    );
    shard.flows.push(flow);
    shard.totalWeight += flow.weight;
  }

  return shards;
}

function writePlan(
  platform: string,
  shardTotal: number,
  shards: Shard[],
  selectionFile: string,
  planFile: string,
  shardIndex: number
): void {
  mkdirSync(dirname(selectionFile), { recursive: true });
  mkdirSync(dirname(planFile), { recursive: true });

  const selected = shards[shardIndex - 1].flows.map(flow => flow.file);
  writeFileSync(selectionFile, selected.length ? `${selected.join('\n')}\n` : '');

  const rows = shards.flatMap(shard =>
    shard.flows.map(flow => [platform, shard.index, shardTotal, shard.totalWeight, flow.weight, flow.file].join('\t'))
  );
  writeFileSync(planFile, `${[PLAN_HEADER, ...rows].join('\n')}\n`);

  console.log(`E2E shard plan for ${platform}:`);
  for (const shard of shards) console.log(`  shard ${shard.index}/${shardTotal}: ${shard.totalWeight}s, ${shard.flows.length} flows`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readLatestResults(resultsDir: string, platform: string): Map<string, Result> {
  const results = new Map<string, Result>();

  for (const file of filesUnder(resultsDir, '.jsonl')) {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      if (!line.trim()) continue;

      let parsed: unknown;
      try {
        parsed = JSON.parse(line);
      } catch {
        console.error(`Skipping unparseable result row in ${file}`);
        continue;
      }
      if (!isRecord(parsed) || parsed.platform !== platform || typeof parsed.test !== 'string' || typeof parsed.status !== 'string')
        continue;

      const shard = typeof parsed.shard === 'number' ? parsed.shard : 0;
      if (!Number.isInteger(shard) || shard < 1) continue;
      const previous = results.get(parsed.test);
      if (previous && previous.shard !== shard)
        throw new Error(`Test ${parsed.test} was reported by shards ${previous.shard} and ${shard}`);

      results.set(parsed.test, {
        platform,
        test: parsed.test,
        shard,
        status: parsed.status,
        attempts: typeof parsed.attempts === 'number' ? parsed.attempts : null,
        duration: typeof parsed.duration === 'number' ? parsed.duration : null,
        passDuration: typeof parsed.pass_duration === 'number' ? parsed.pass_duration : null,
      });
    }
  }

  return results;
}

function smooth(previous: number | undefined, observed: number): number {
  return previous === undefined ? observed : Math.floor((previous * 3 + observed + 2) / 4);
}

function writeHistory(file: string, timings: Map<string, Timing>): void {
  mkdirSync(dirname(file), { recursive: true });
  const rows = [...timings.values()]
    .sort((a, b) => a.test.localeCompare(b.test))
    .map(timing =>
      [
        timing.platform,
        timing.test,
        timing.updatedAt,
        timing.passWeight,
        timing.retryWeight,
        timing.passDuration,
        timing.totalDuration,
        timing.attempts,
      ].join('\t')
    );
  const temporary = `${file}.${process.pid}.tmp`;

  try {
    writeFileSync(temporary, `${[HISTORY_HEADER, ...rows].join('\n')}\n`);
    renameSync(temporary, file);
  } finally {
    rmSync(temporary, { force: true });
  }
}

function update(platform: string, resultsDir: string, historyFile: string): number {
  const timings = readHistory(historyFile, platform);
  const results = readLatestResults(resultsDir, platform);
  let updated = 0;

  for (const result of results.values()) {
    if (result.status !== 'passed' && result.status !== 'retried') continue;
    if (!Number.isInteger(result.attempts) || !result.attempts || result.duration === null) continue;

    const passDuration = result.passDuration ?? (result.attempts === 1 ? result.duration : null);
    if (passDuration === null) continue;

    const observedPass = Math.max(1, Math.round(passDuration));
    const totalDuration = Math.max(observedPass, Math.round(result.duration));
    const observedRetry = result.attempts > 1 ? Math.min(Math.max(0, totalDuration - observedPass), observedPass) : 0;
    const previous = timings.get(result.test);
    const passWeight = smooth(previous?.passWeight, observedPass);
    // Start retry cost at one quarter of a first observed flake so one failure
    // influences the next plan without becoming stable base duration.
    const retryWeight = smooth(previous?.retryWeight ?? 0, observedRetry);

    timings.set(result.test, {
      platform,
      test: result.test,
      updatedAt: Math.floor(Date.now() / 1000),
      passWeight,
      retryWeight,
      passDuration: observedPass,
      totalDuration,
      attempts: result.attempts,
    });
    updated += 1;
  }

  writeHistory(historyFile, timings);
  return updated;
}

function main(): void {
  const [, , command, ...args] = process.argv;

  try {
    if (command === 'plan' && args.length === 7) {
      const [platform, rawShardTotal, rawShardIndex, flowsDir, historyFile, selectionFile, planFile] = args;
      if (!platform) throw new Error('platform is required');
      const shardTotal = parseInteger(rawShardTotal, 'shardTotal');
      const shardIndex = parseInteger(rawShardIndex, 'shardIndex');
      const shards = plan(platform, shardTotal, shardIndex, flowsDir, historyFile);
      writePlan(platform, shardTotal, shards, selectionFile, planFile, shardIndex);
      return;
    }

    if (command === 'update' && args.length === 3) {
      const [platform, resultsDir, historyFile] = args;
      if (!platform) throw new Error('platform is required');
      console.log(`Updated ${update(platform, resultsDir, historyFile)} E2E timing records for ${platform}`);
      return;
    }

    throw new Error('Invalid arguments');
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error(
      'usage: node tools/e2e-sharding/index.ts plan <platform> <shardTotal> <shardIndex> <flowsDir> <historyFile> <selectionFile> <planFile>'
    );
    console.error('   or: node tools/e2e-sharding/index.ts update <platform> <resultsDir> <historyFile>');
    process.exitCode = 1;
  }
}

main();
