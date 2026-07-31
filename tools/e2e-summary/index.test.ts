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

  it('links the run artifacts when running inside Actions', () => {
    const dir = ledgers({ 'shard-1.jsonl': [row('screens/Home', 'passed', { attempts: 1, duration: 74 })] });
    const stdout = run([dir], {
      GITHUB_SERVER_URL: 'https://github.com',
      GITHUB_REPOSITORY: 'rainbow-me/rainbow',
      GITHUB_RUN_ID: '30336051803',
    }).stdout;
    expect(stdout).toMatchSnapshot();
  });

  it('says so plainly when no shard reported anything', () => {
    expect(run([ledgers({})]).stdout).toMatchSnapshot();
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
    expect(result.stderr).toContain('usage: node tools/e2e-summary/index.ts <resultsDir>');
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

// GitHub sets GITHUB_* in CI, which would change the rendered output and split
// snapshots between local and CI runs, so every case declares what it wants.
function run(args: string[], extraEnv: Record<string, string> = {}) {
  const env: NodeJS.ProcessEnv = { ...process.env, ...extraEnv };
  for (const key of Object.keys(env)) {
    if (key.startsWith('GITHUB_') && !(key in extraEnv)) delete env[key];
  }
  return spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env });
}
