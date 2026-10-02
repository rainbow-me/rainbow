import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, beforeEach, expect, test } from 'vitest';

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'rainbow-native-fingerprint-'));
  for (const file of ['fingerprint.config.cjs', 'fingerprint.config.ts']) copyFileSync(join(import.meta.dirname, file), join(root, file));
  for (const file of ['.node-version', '.ruby-version', '.xcode-version', '.yarnrc.yml', 'Gemfile', 'Gemfile.lock', 'yarn.lock']) {
    write(file, 'baseline');
  }
  write('package.json', JSON.stringify({ name: 'fingerprint-fixture', version: '1.0.0' }));
  write('.env', 'BRANCH_KEY=first\nUNUSED_VALUE=one\n');
  write('android/app/build.gradle', '// Native Android configuration\n');
  write('ios/Podfile', '# Native iOS configuration\n');
  write('bin/java', '#!/bin/sh\nprintf "%s\\n" "$TEST_JAVA_VERSION"\n', 0o755);
  write('bin/xcodebuild', '#!/bin/sh\nprintf "%s\\n" "$TEST_XCODE_VERSION"\n', 0o755);
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

test('Android Branch configuration invalidates Android alone', () => {
  const ios = fingerprint('ios');
  const android = fingerprint('android');
  write('.env', 'BRANCH_KEY=second\n');
  expect(fingerprint('android')).not.toBe(android);
  expect(fingerprint('ios')).toBe(ios);
});

test.each(['ios', 'android'] as const)('%s ignores dotenv comments, unused keys and development package metadata', platform => {
  const before = fingerprint(platform);
  write('.env', '# A comment\nBRANCH_KEY=first\nUNUSED_VALUE=two\n');
  write('package.json', JSON.stringify({ name: 'fingerprint-fixture', version: '1.0.0', devDependencies: { 'test-tool': '2.0.0' } }));
  write('yarn.lock', 'development dependency change');
  expect(fingerprint(platform)).toBe(before);
});

test('Android preserves the raw Branch value used by Gradle', () => {
  const before = fingerprint('android');
  write('.env', 'BRANCH_KEY="first"\n');
  expect(fingerprint('android')).not.toBe(before);

  write('.env', 'BRANCH_KEY=discarded\nBRANCH_KEY=first\n');
  expect(fingerprint('android')).toBe(before);
});

test('Java changes invalidate Android alone', () => {
  const ios = fingerprint('ios');
  const android = fingerprint('android');
  expect(fingerprint('android', { TEST_JAVA_VERSION: 'java 18' })).not.toBe(android);
  expect(fingerprint('ios', { TEST_JAVA_VERSION: 'java 18' })).toBe(ios);
});

if (process.platform === 'darwin') {
  test('Xcode changes invalidate iOS alone', () => {
    const ios = fingerprint('ios');
    const android = fingerprint('android');
    expect(fingerprint('ios', { TEST_XCODE_VERSION: 'Xcode 27' })).not.toBe(ios);
    expect(fingerprint('android', { TEST_XCODE_VERSION: 'Xcode 27' })).toBe(android);
  });
}

test.each([
  ['ios', 'ios/Podfile'],
  ['android', 'android/app/build.gradle'],
] as const)('%s native edits remain part of the fingerprint', (platform, file) => {
  const before = fingerprint(platform);
  write(file, 'changed native configuration');
  expect(fingerprint(platform)).not.toBe(before);
});

function write(path: string, contents: string, mode?: number): void {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents, { mode });
}

function fingerprint(platform: 'ios' | 'android', env: Partial<NodeJS.ProcessEnv> = {}): string {
  return execFileSync(process.execPath, [join(import.meta.dirname, 'tools/stim/fixtures/fingerprint.mts'), platform], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${join(root, 'bin')}:${process.env.PATH}`,
      JAVA_HOME: root,
      TEST_JAVA_VERSION: 'java 17',
      TEST_XCODE_VERSION: 'Xcode 26',
      ...env,
    },
    timeout: 30000,
  });
}
