import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Driven as a CLI rather than by importing the render functions: the contract is
// "ledger files on disk in, markdown out", so reading and merging the per-shard
// files is part of what needs pinning, as are the exit codes.
const CLI = join(__dirname, 'index.ts');

describe('rendering', () => {
  it('reports an all-green run', () => {
    const dir = ledgers({
      'shard-1.jsonl': [
        row('screens/Home', 'planned'),
        row('onboarding/CreateWallet', 'planned'),
        row('screens/Home', 'passed', { attempts: 1, duration: 74 }),
        row('onboarding/CreateWallet', 'passed', { attempts: 1, duration: 132 }),
      ],
    });
    expect(run([dir]).stdout).toMatchSnapshot();
  });

  it('sorts failures and retries above passes, merging every shard file', () => {
    const dir = ledgers({
      'shard-1.jsonl': [row('cash/SetupResume', 'planned'), row('cash/SetupResume', 'retried', { attempts: 2, duration: 127 })],
      'shard-2.jsonl': [
        row('screens/Home', 'planned', { shard: 2 }),
        row('transactions/WrapTransaction', 'planned', { shard: 2 }),
        row('screens/Home', 'passed', { shard: 2, attempts: 1, duration: 40 }),
        row('transactions/WrapTransaction', 'failed', { shard: 2, attempts: 3, duration: 252 }),
      ],
    });
    expect(run([dir]).stdout).toMatchSnapshot();
  });

  it('names the tests a killed shard never got to', () => {
    const dir = ledgers({
      'shard-1.jsonl': [
        row('screens/Home', 'planned'),
        row('settings/ManualBackup', 'planned'),
        row('screens/Home', 'passed', { attempts: 1, duration: 74 }),
      ],
    });
    expect(run([dir]).stdout).toMatchSnapshot();
  });

  it('skips a half-written row without losing the rest of the file', () => {
    const dir = ledgers({
      'shard-1.jsonl': [row('screens/Home', 'passed', { attempts: 1, duration: 74 }), '{"shard":1,"test":"cash/Set'],
    });
    const result = run([dir]);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatchSnapshot();
  });

  it('says so plainly when no shard reported anything', () => {
    expect(run([ledgers({})]).stdout).toMatchSnapshot();
  });
});

describe('shards that never reported', () => {
  it('names the shard whose ledger never arrived, and warns the table is partial', () => {
    const dir = ledgers({
      'shard-1.jsonl': [row('screens/Home', 'passed', { attempts: 1, duration: 74 })],
      'shard-2.jsonl': [row('cash/SetupResume', 'passed', { shard: 2, attempts: 1, duration: 91 })],
    });
    expect(run([dir, '3']).stdout).toMatchSnapshot();
  });

  it('lists every missing shard when more than one is gone', () => {
    const dir = ledgers({ 'shard-2.jsonl': [row('screens/Home', 'passed', { shard: 2, attempts: 1, duration: 74 })] });
    expect(run([dir, '4']).stdout).toMatchSnapshot();
  });

  it('treats an empty ledger as having reported, since the shard wrote it before running anything', () => {
    const dir = ledgers({ 'shard-1.jsonl': [row('screens/Home', 'passed', { attempts: 1, duration: 74 })], 'shard-2.jsonl': [] });
    const result = run([dir, '2']);
    expect(result.stdout).not.toContain('did not report');
    expect(result.stdout).toMatchSnapshot();
  });

  it('checks nothing when no shard count is given, so local single runs are unaffected', () => {
    const dir = ledgers({ 'shard-1.jsonl': [row('screens/Home', 'passed', { attempts: 1, duration: 74 })] });
    expect(run([dir]).stdout).not.toContain('did not report');
  });

  it('still reports the shards it does have when the count is wrong in the other direction', () => {
    const dir = ledgers({
      'shard-1.jsonl': [row('screens/Home', 'passed', { attempts: 1, duration: 74 })],
      'shard-9.jsonl': [row('cash/SetupResume', 'passed', { shard: 9, attempts: 1, duration: 91 })],
    });
    expect(run([dir, '1']).stdout).toContain('cash/SetupResume');
  });
});

describe('reporting is never fatal', () => {
  it('exits 0 and explains itself when the results directory is missing', () => {
    const result = run([join(tmpdir(), 'summary-does-not-exist')]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Could not render the e2e summary');
  });

  it('writes to the step summary instead of stdout when Actions provides one', () => {
    const dir = ledgers({ 'shard-1.jsonl': [row('screens/Home', 'passed', { attempts: 1, duration: 74 })] });
    const summary = join(mkdtempSync(join(tmpdir(), 'summary-out-')), 'summary.md');
    const result = run([dir], { GITHUB_STEP_SUMMARY: summary });
    expect(result.stdout).toBe('');
    expect(readFileSync(summary, 'utf8')).toContain('| ✅ | `screens/Home` | 1 | 1 | 1m 14s |');
  });
});

describe('being called wrong is fatal', () => {
  it('exits non-zero with usage when no results directory is given', () => {
    const result = run([]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('usage: node tools/e2e-summary/index.ts <resultsDir> [expectedShards]');
  });

  it('exits non-zero when the shard count is not a number', () => {
    const result = run([ledgers({}), 'four']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('expectedShards must be a non-negative integer');
  });
});

function row(test: string, status: string, over: Record<string, unknown> = {}): string {
  return JSON.stringify({
    shard: 1,
    platform: 'ios',
    test,
    status,
    attempts: null,
    duration: null,
    failure_class: null,
    artifact_dir: null,
    ...over,
  });
}

function ledgers(files: Record<string, string[]>): string {
  const dir = mkdtempSync(join(tmpdir(), 'summary-'));
  for (const [name, lines] of Object.entries(files)) {
    writeFileSync(join(dir, name), lines.length > 0 ? `${lines.join('\n')}\n` : '');
  }
  return dir;
}

// GitHub sets GITHUB_STEP_SUMMARY in CI, which would divert output to a file and
// empty every snapshot, so each case declares the environment it wants.
function run(args: string[], extraEnv: Record<string, string> = {}) {
  const env: NodeJS.ProcessEnv = { ...process.env, ...extraEnv };
  for (const key of Object.keys(env)) {
    if (key.startsWith('GITHUB_') && !(key in extraEnv)) delete env[key];
  }
  return spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env });
}
