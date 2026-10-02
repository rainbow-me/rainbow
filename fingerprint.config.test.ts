import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, expect, test } from 'vitest';

const require = createRequire(import.meta.url);
const PROJECT_ROOT = import.meta.dirname;
const STIM_PACKAGE = require.resolve('stim/package.json');
let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'rainbow-native-fingerprint-'));
  for (const file of [
    'fingerprint.config.cjs',
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
  const script = `
    const { createRequire } = require('node:module');
    const fromStim = createRequire(${JSON.stringify(STIM_PACKAGE)});
    const { createFingerprintAsync } = fromStim('@expo/fingerprint');
    createFingerprintAsync(process.cwd(), { platforms: [], silent: true }).then(result => {
      const environment = result.sources.find(source => source.id === 'rainbowBuildEnvironment');
      const dotenv = result.sources.find(source => source.filePath === '.env');
      if (!environment?.hash || !dotenv?.hash) throw new Error('Rainbow fingerprint configuration was not loaded');
      process.stdout.write(result.hash);
    }).catch(error => { console.error(error); process.exitCode = 1; });
  `;
  return execFileSync(process.execPath, ['-e', script], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, CXXFLAGS: undefined, ...env },
    timeout: 30000,
  });
}
