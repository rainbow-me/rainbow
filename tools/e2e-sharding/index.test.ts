import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CLI = join(__dirname, 'index.ts');
const HISTORY_HEADER = 'platform\ttest\tupdated_at\tpass_weight\tretry_weight\tpass_duration\ttotal_duration\tattempts';

describe('planning', () => {
  it('assigns every flow exactly once with deterministic duration balancing', () => {
    const root = fixture();
    const flows = join(root, 'flows');
    const history = join(root, 'history.tsv');
    const selection = join(root, 'selection.txt');
    const plan = join(root, 'plan.tsv');

    for (const test of ['a', 'b', 'c', 'd', 'e', 'f']) flow(flows, test);
    writeFileSync(
      history,
      `${HISTORY_HEADER}\n${[
        timing('ios', 'a', 9),
        timing('ios', 'b', 8),
        timing('ios', 'c', 7),
        timing('ios', 'd', 6),
        timing('ios', 'e', 5),
        timing('ios', 'f', 4),
      ].join('\n')}\n`
    );

    const result = run(['plan', 'ios', '2', '1', flows, history, selection, plan]);
    expect(result.status).toBe(0);
    expect(readFileSync(selection, 'utf8').trim().split('\n')).toEqual([
      join(flows, 'a.yaml'),
      join(flows, 'd.yaml'),
      join(flows, 'e.yaml'),
    ]);

    const rows = tsv(plan);
    expect(rows.map(row => row[5]).sort()).toEqual(['a', 'b', 'c', 'd', 'e', 'f'].map(test => join(flows, `${test}.yaml`)).sort());
    expect([...new Set(rows.map(row => Number(row[3])))].sort()).toEqual([19, 20]);
  });

  it('ignores corrupt history and gives new flows the default weight', () => {
    const root = fixture();
    const flows = join(root, 'flows');
    const history = join(root, 'history.tsv');
    const selection = join(root, 'selection.txt');
    const plan = join(root, 'plan.tsv');
    for (const test of ['a', 'b', 'c']) flow(flows, test);
    writeFileSync(history, `${HISTORY_HEADER}\nios\ta\tnot-a-number\t1\t0\t1\t1\t1\n`);

    const result = run(['plan', 'ios', '2', '2', flows, history, selection, plan]);
    expect(result.status).toBe(0);
    expect(result.stderr).toContain('Skipping invalid timing row');
    expect(tsv(plan).map(row => Number(row[4]))).toEqual([60, 60, 60]);
  });
});

describe('timing updates', () => {
  it('smooths pass and bounded retry cost from the latest successful result', () => {
    const root = fixture();
    const results = join(root, 'results');
    const history = join(root, 'history.tsv');
    mkdirSync(results);
    writeFileSync(history, `${HISTORY_HEADER}\n${timing('ios', 'cash/Setup', 140, { pass: 100, retry: 40 })}\n`);
    writeFileSync(
      join(results, 'shard-1.jsonl'),
      [
        resultRow('cash/Setup', 'planned'),
        resultRow('cash/Setup', 'retried', { attempts: 2, duration: 240, pass_duration: 120 }),
        resultRow('screens/Home', 'passed', { attempts: 1, duration: 80 }),
        resultRow('transactions/SendNft', 'failed', { attempts: 3, duration: 400 }),
      ].join('\n') + '\n'
    );

    const result = run(['update', 'ios', results, history]);
    expect(result.status).toBe(0);
    const rows = new Map(tsv(history).map(row => [row[1], row]));
    expect(rows.get('cash/Setup')?.slice(2, 5)).toEqual([expect.any(String), '105', '60']);
    expect(rows.get('screens/Home')?.slice(2, 5)).toEqual([expect.any(String), '80', '0']);
    expect(rows.has('transactions/SendNft')).toBe(false);
  });

  it('rejects a test reported by more than one shard', () => {
    const root = fixture();
    const results = join(root, 'results');
    const history = join(root, 'history.tsv');
    mkdirSync(results);
    writeFileSync(join(results, 'shard-1.jsonl'), `${resultRow('screens/Home', 'passed', { attempts: 1, duration: 80 })}\n`);
    writeFileSync(join(results, 'shard-2.jsonl'), `${resultRow('screens/Home', 'passed', { shard: 2, attempts: 1, duration: 81 })}\n`);

    const result = run(['update', 'ios', results, history]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('reported by shards 1 and 2');
  });
});

function fixture(): string {
  return mkdtempSync(join(tmpdir(), 'e2e-sharding-'));
}

function flow(root: string, test: string): void {
  mkdirSync(root, { recursive: true });
  writeFileSync(join(root, `${test}.yaml`), 'appId: test\n---\n');
}

function timing(platform: string, test: string, weight: number, over: { pass?: number; retry?: number } = {}): string {
  const pass = over.pass ?? weight;
  const retry = over.retry ?? 0;
  return [platform, test, 1, pass, retry, pass, pass + retry, retry ? 2 : 1].join('\t');
}

function resultRow(test: string, status: string, over: Record<string, unknown> = {}): string {
  return JSON.stringify({
    shard: 1,
    platform: 'ios',
    test,
    status,
    attempts: null,
    duration: null,
    pass_duration: null,
    ...over,
  });
}

function tsv(file: string): string[][] {
  return readFileSync(file, 'utf8')
    .trim()
    .split('\n')
    .slice(1)
    .map(line => line.split('\t'));
}

function run(args: string[]) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8' });
}
