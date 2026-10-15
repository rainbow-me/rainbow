import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { expect, test } from 'vitest';

const require = createRequire(import.meta.url);
const STIM_CLI = join(dirname(require.resolve('stim/package.json')), 'dist/cli.mjs');
const EXCLUDED_FILES = [
  '.claude/notes.md',
  '.local/report.txt',
  '.sentry/state',
  '.gradle/state',
  'android/.gradle/state',
  'android/app/.cxx/state',
  'android/app/build/output.apk',
  'android/local.properties',
  'android/keystores/release.keystore',
  'artifacts/screenshot.png',
  'ios/build/output.app',
  'ios/.xcode.env.local',
];

test('Stim warms prepared inputs without copying scratch state or sharing writable dependencies', () => {
  const base = realpathSync(mkdtempSync(join(tmpdir(), 'rainbow-worktree-')));
  const source = join(base, 'source');
  const target = join(base, 'target');
  try {
    mkdirSync(source);
    git(source, 'init', '-q', '-b', '@christian/warm-source');
    write(source, '.gitignore', ['node_modules/', 'ios/Pods/', '.env', 'ios/debug.xcconfig', ...EXCLUDED_FILES].join('\n'));
    write(source, 'package.json', JSON.stringify({ name: 'warm-fixture' }));
    write(source, 'android/app/build.gradle', '// Tracked native project');
    write(source, 'ios/Podfile.lock', 'installed pods');
    copyFileSync(join(import.meta.dirname, '../../.worktreeexclude'), join(source, '.worktreeexclude'));
    git(source, 'add', '.');
    git(
      source,
      '-c',
      'user.name=Fixture',
      '-c',
      'user.email=fixture@example.com',
      '-c',
      'commit.gpgsign=false',
      'commit',
      '-qm',
      'Fixture'
    );
    git(source, 'worktree', 'add', '-qb', '@christian/warm-target', target);

    write(source, 'node_modules/package/installed.txt', 'installed dependency');
    write(source, 'ios/Pods/Manifest.lock', 'installed pods');
    const podConfig = 'ios/Pods/Target Support Files/Fixture/Fixture.debug.xcconfig';
    write(source, podConfig, `HEADER_SEARCH_PATHS = "${source}/node_modules/package"\n`);
    write(source, 'ios/debug.xcconfig', 'prepared configuration');
    write(source, '.env', 'SOURCE=fixture');
    write(target, '.env', 'TARGET=preserve');
    for (const file of EXCLUDED_FILES) write(source, file, 'excluded fixture');

    const result = spawnSync(process.execPath, [STIM_CLI, 'worktree', 'warm'], {
      cwd: target,
      encoding: 'utf8',
      env: { ...process.env, STIM_HOME: join(base, 'stim'), STIM_MAINTENANCE: 'off' },
      timeout: 30000,
    });
    expect({ status: result.status, error: result.error }).toEqual({ status: 0, error: undefined });
    expect(readFileSync(join(target, 'node_modules/package/installed.txt'), 'utf8')).toBe('installed dependency');
    expect(readFileSync(join(target, 'ios/Pods/Manifest.lock'), 'utf8')).toBe('installed pods');
    expect(readFileSync(join(target, 'ios/Podfile.lock'), 'utf8')).toBe('installed pods');
    expect(readFileSync(join(target, podConfig), 'utf8')).toBe(`HEADER_SEARCH_PATHS = "${target}/node_modules/package"\n`);
    expect(readFileSync(join(source, podConfig), 'utf8')).toBe(`HEADER_SEARCH_PATHS = "${source}/node_modules/package"\n`);
    expect(readFileSync(join(target, 'ios/debug.xcconfig'), 'utf8')).toBe('prepared configuration');
    expect(readFileSync(join(target, '.env'), 'utf8')).toBe('TARGET=preserve');
    for (const file of EXCLUDED_FILES) expect(existsSync(join(target, file))).toBe(false);

    write(target, 'node_modules/package/installed.txt', 'independent change');
    expect(readFileSync(join(source, 'node_modules/package/installed.txt'), 'utf8')).toBe('installed dependency');
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

function git(root: string, ...args: string[]): void {
  execFileSync('git', ['-C', root, ...args], { stdio: 'pipe', timeout: 15000 });
}

function write(root: string, path: string, contents: string): void {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
}
