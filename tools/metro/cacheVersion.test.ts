import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { createSourceFile, isImportDeclaration, isNamedImports, isStringLiteral, ScriptTarget } from 'typescript';
import { afterEach, beforeEach, expect, test } from 'vitest';

import { getMetroCacheVersion } from './cacheVersion';

const DECLARATIONS = `declare module 'react-native-dotenv' {
  export const DOTENV_VALUE: string;
  export const SECOND_VALUE: string;
}`;

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'rainbow-metro-cache-'));
  write('globals.d.ts', DECLARATIONS);
  write('.env', 'DOTENV_VALUE=first\n');
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

test('identical inputs share an identity across checkout paths', () => {
  const other = mkdtempSync(join(tmpdir(), 'rainbow-metro-other-'));
  try {
    writeFileSync(join(other, 'globals.d.ts'), DECLARATIONS);
    writeFileSync(join(other, '.env'), readFileSync(join(root, '.env')));
    expect(getMetroCacheVersion(other, {})).toBe(getMetroCacheVersion(root, {}));
  } finally {
    rmSync(other, { recursive: true, force: true });
  }
});

test('dotenv changes produce different compiled values and transform identities', () => {
  const firstKey = getMetroCacheVersion(root, {});
  expect(transformEnvironment()).toContain('"first"');

  write('.env', 'DOTENV_VALUE=second\n');
  expect(transformEnvironment()).toContain('"second"');
  expect(getMetroCacheVersion(root, {})).not.toBe(firstKey);
});

test('mode files and process overrides participate without changing their inputs', () => {
  const env = { NODE_ENV: 'development', DOTENV_VALUE: 'override' };
  const before = getMetroCacheVersion(root, env);
  write('.env.development', 'DOTENV_VALUE=mode\n');
  expect(getMetroCacheVersion(root, env)).not.toBe(before);
  expect(env).toEqual({ NODE_ENV: 'development', DOTENV_VALUE: 'override' });
  expect(readFileSync(join(root, '.env'), 'utf8')).toBe('DOTENV_VALUE=first\n');

  const modeKey = getMetroCacheVersion(root, env);
  expect(getMetroCacheVersion(root, { ...env, DOTENV_VALUE: 'other' })).not.toBe(modeKey);
  expect(getMetroCacheVersion(root, { ...env, BABEL_ENV: 'production' })).not.toBe(modeKey);
});

test('unrelated process variables and ordinary source edits do not invalidate transforms globally', () => {
  const before = getMetroCacheVersion(root, {});
  write('src/App.tsx', 'export const title = "Changed screen";');
  expect(getMetroCacheVersion(root, { PWD: '/another/checkout', TERM: 'xterm' })).toBe(before);
});

test.each(['babel.config.js', 'metro.config.js', 'tsconfig.json', 'yarn.lock', 'patches/native.patch', '.yarn/patches/package.patch'])(
  '%s invalidates transforms when its contents change',
  path => {
    write(path, 'before');
    const before = getMetroCacheVersion(root, {});
    write(path, 'after');
    expect(getMetroCacheVersion(root, {})).not.toBe(before);
  }
);

test('an absent file differs from an empty file', () => {
  const before = getMetroCacheVersion(root, {});
  write('.env.development', '');
  expect(getMetroCacheVersion(root, {})).not.toBe(before);
});

test('new declared environment keys participate without a second key list', () => {
  const declarations = DECLARATIONS.replace('SECOND_VALUE', 'NEW_VALUE');
  write('globals.d.ts', declarations);
  expect(getMetroCacheVersion(root, { NEW_VALUE: 'one' })).not.toBe(getMetroCacheVersion(root, { NEW_VALUE: 'two' }));
});

test('missing environment declarations fail instead of accepting an incomplete identity', () => {
  write('globals.d.ts', 'declare const unrelated: string;');
  expect(() => getMetroCacheVersion(root, {})).toThrow('Missing react-native-dotenv declaration');
});

test('every dotenv import in Rainbow participates in the transform identity', () => {
  const project = join(import.meta.dirname, '../..');
  const sourceRoot = join(project, 'src');
  const names = new Set<string>();
  for (const file of readdirSync(sourceRoot, { recursive: true, encoding: 'utf8' })) {
    if (!/\.[jt]sx?$/.test(file) || /\.(test|spec)\.[jt]sx?$/.test(file) || file.includes('__tests__/')) continue;
    const contents = readFileSync(join(sourceRoot, file), 'utf8');
    if (!contents.includes('react-native-dotenv')) continue;
    const source = createSourceFile(file, contents, ScriptTarget.Latest);
    for (const statement of source.statements) {
      if (!isImportDeclaration(statement) || !isStringLiteral(statement.moduleSpecifier)) continue;
      if (statement.moduleSpecifier.text !== 'react-native-dotenv') continue;
      const bindings = statement.importClause?.namedBindings;
      if (!bindings || !isNamedImports(bindings)) throw new Error(`Expected named dotenv imports in ${file}`);
      for (const binding of bindings.elements) names.add((binding.propertyName ?? binding.name).text);
    }
  }

  expect(names.size).toBeGreaterThan(0);
  const before = getMetroCacheVersion(project, {});
  for (const name of names) {
    expect({ name, key: getMetroCacheVersion(project, { [name]: 'cache-test-override' }) }).not.toEqual({ name, key: before });
  }
});

function write(path: string, contents: string): void {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
}

function transformEnvironment(): string {
  return execFileSync(process.execPath, [join(import.meta.dirname, 'fixtures/transformEnvironment.mts')], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, DOTENV_VALUE: undefined },
  });
}
