import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, expect, test } from 'vitest';

const PROJECT_ROOT = import.meta.dirname;
let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'rainbow-native-fingerprint-'));
  for (const file of [
    'fingerprint.config.cjs',
    'fingerprint.config.ts',
    '.node-version',
    '.ruby-version',
    '.xcode-version',
    '.yarnrc.yml',
    'Gemfile',
    'Gemfile.lock',
    'yarn.lock',
  ]) {
    copyFileSync(join(PROJECT_ROOT, file), join(root, file));
  }
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'fingerprint-fixture', version: '1.0.0' }));
  writeFileSync(join(root, '.env'), 'BRANCH_KEY=first\n');
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

test('Stim fingerprints root environment changes through the supported configuration', () => {
  const before = fingerprint();
  writeFileSync(join(root, '.env'), 'BRANCH_KEY=second\n');
  expect(fingerprint()).not.toBe(before);
});

test('native compiler overrides change the identity while unrelated process values do not', () => {
  const before = fingerprint();
  expect(fingerprint({ TERM: 'another-terminal' })).toBe(before);
  expect(fingerprint({ CXXFLAGS: '-DSTIM_TEST' })).not.toBe(before);
});

test('the optional testing marker distinguishes normal and E2E artifacts', () => {
  const before = fingerprint();
  writeFileSync(join(root, 'is_testing'), '');
  expect(fingerprint()).not.toBe(before);
});

function fingerprint(env: Partial<NodeJS.ProcessEnv> = {}): string {
  return execFileSync(process.execPath, [join(PROJECT_ROOT, 'tools/stim/fixtures/fingerprint.mts')], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, CXXFLAGS: undefined, ...env },
    timeout: 30000,
  });
}
