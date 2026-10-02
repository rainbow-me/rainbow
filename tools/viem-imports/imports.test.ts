import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { transformSync } from '@babel/core';
import { parse } from '@babel/parser';
import { type ImportDeclaration } from '@babel/types';
import { afterEach, describe, expect, it } from 'vitest';

import { viemImportsBabelPlugin } from './babel';
import { createViemImportPlanner } from './imports';
import { createViemExportReader, getViemImportsCacheKey, type ViemModuleFormat } from './reexports';
import { transformViemImports } from './vite';

const temporaryDirectories: string[] = [];
const importer = join(process.cwd(), 'src', 'viem-import-probe.ts');

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

function write(filename: string, content: string): void {
  mkdirSync(dirname(filename), { recursive: true });
  writeFileSync(filename, content);
}

function fixture(parent?: string): { root: string; importer: string; entry: (format: ViemModuleFormat) => string } {
  const directory = parent ?? realpathSync(mkdtempSync(join(tmpdir(), 'viem-imports-')));
  if (!parent) temporaryDirectories.push(directory);
  const root = join(directory, 'node_modules', 'viem');
  write(
    join(root, 'package.json'),
    JSON.stringify({
      name: 'viem',
      sideEffects: false,
      exports: {
        '.': { import: './esm/index.mjs', default: './cjs/index.cjs' },
        './chains': { import: './esm/index.mjs', default: './cjs/index.cjs' },
        './package.json': './package.json',
      },
    })
  );
  write(join(root, 'esm/index.mjs'), `export { OwnerError as PublicError, mainnet as chain } from './leaf.mjs';`);
  write(join(root, 'esm/leaf.mjs'), 'export class OwnerError extends Error {} export const mainnet = { id: 1 };');
  write(
    join(root, 'cjs/index.cjs'),
    `"use strict";
Object.defineProperty(exports, '__esModule', { value: true });
exports.PublicError = exports.chain = void 0;
var leaf = require('./leaf.cjs');
Object.defineProperty(exports, 'PublicError', { enumerable: true, get: function () { return leaf.OwnerError; } });
Object.defineProperty(exports, 'chain', { enumerable: true, get: function () { return leaf.mainnet; } });`
  );
  write(join(root, 'cjs/leaf.cjs'), 'exports.OwnerError = class OwnerError extends Error {}; exports.mainnet = { id: 1 };');
  return {
    root,
    importer: join(directory, 'consumer.ts'),
    entry: format => join(root, format === 'esm' ? 'esm/index.mjs' : 'cjs/index.cjs'),
  };
}

function declaration(source: string): ImportDeclaration {
  const node = parse(source, { sourceType: 'module', plugins: ['typescript'] }).program.body[0];
  if (node?.type !== 'ImportDeclaration') throw new Error('The fixture must contain an import declaration.');
  return node;
}

describe('canonical Viem reexports', () => {
  it.each(['esm', 'commonjs'] as const)('retains class and object identity in %s', async format => {
    const files = fixture();
    const readExports = createViemExportReader(format);
    const exports = readExports('viem', files.importer);
    const original = await import(pathToFileURL(files.entry(format)).href);
    for (const name of ['PublicError', 'chain']) {
      const target = exports.get(name);
      if (!target) throw new Error(`Missing fixture export ${name}.`);
      const selected = await import(pathToFileURL(target.source).href);
      expect(selected[target.imported]).toBe(original[name]);
    }
  });

  it('resolves the package relative to each importer within one reader', () => {
    const outer = fixture();
    const nested = fixture(join(dirname(outer.importer), 'feature'));
    const readExports = createViemExportReader('esm');
    expect(readExports('viem', outer.importer).get('chain')?.source).toBe(join(outer.root, 'esm/leaf.mjs'));
    expect(readExports('viem', nested.importer).get('chain')?.source).toBe(join(nested.root, 'esm/leaf.mjs'));
  });

  it('refreshes changed entries and rechecks package metadata', () => {
    const files = fixture();
    const readExports = createViemExportReader('esm');
    expect(readExports('viem', files.importer).get('chain')?.imported).toBe('mainnet');
    write(files.entry('esm'), `export { OwnerError as chain } from './leaf.mjs';`);
    expect(readExports('viem', files.importer).get('chain')?.imported).toBe('OwnerError');
    const manifest = join(files.root, 'package.json');
    write(manifest, readFileSync(manifest, 'utf8').replace('"sideEffects":false', '"sideEffects":true'));
    expect(() => readExports('viem', files.importer)).toThrow('sideEffects: false');
  });

  it('invalidates persistent build keys for entry, transform and locked dependency changes', () => {
    const files = fixture();
    const root = dirname(files.importer);
    const tool = join(root, 'tools/viem-imports/transform.ts');
    write(tool, '// initial transform');
    write(join(root, 'yarn.lock'), '# initial dependency graph');
    const initial = getViemImportsCacheKey(root, 'commonjs');
    expect(getViemImportsCacheKey(root, 'commonjs')).toBe(initial);
    write(files.entry('commonjs'), readFileSync(files.entry('commonjs'), 'utf8') + '\n// new package artifact');
    const changedEntry = getViemImportsCacheKey(root, 'commonjs');
    expect(changedEntry).not.toBe(initial);
    write(tool, '// revised transform');
    const changedTool = getViemImportsCacheKey(root, 'commonjs');
    expect(changedTool).not.toBe(changedEntry);
    write(join(root, 'yarn.lock'), '# revised nested dependency or Yarn patch');
    expect(getViemImportsCacheKey(root, 'commonjs')).not.toBe(changedTool);
  });

  it.each(['esm', 'commonjs'] as const)('rejects extra executable code in %s without evaluating it', format => {
    const files = fixture();
    write(files.entry(format), readFileSync(files.entry(format), 'utf8') + '\nthrow new Error("executed fixture");');
    expect(() => createViemExportReader(format)('viem', files.importer)).toThrow('not a supported pure reexport entry');
  });

  it('routes unused exports without opening their implementation files', () => {
    const files = fixture();
    write(files.entry('esm'), `export { mainnet as chain } from './not-installed.mjs';`);
    expect(createViemExportReader('esm')('viem', files.importer).get('chain')?.source).toBe(join(files.root, 'esm/not-installed.mjs'));
  });

  it('rejects a CommonJS binding reassignment that would change a getter after declaration', () => {
    const files = fixture();
    write(files.entry('commonjs'), readFileSync(files.entry('commonjs'), 'utf8') + '\nvar leaf = require("./other.cjs");');
    expect(() => createViemExportReader('commonjs')('viem', files.importer)).toThrow('not a supported pure reexport entry');
  });

  it.each(['./leaf.cjs', 'external-package'])('rejects duplicate CommonJS getters from %s', source => {
    const files = fixture();
    const getter = `Object.defineProperty(exports, 'chain', { enumerable: true, get: function () { return leaf.mainnet; } });`;
    write(files.entry('commonjs'), `var leaf = require(${JSON.stringify(source)});\n${getter}\n${getter}`);
    expect(() => createViemExportReader('commonjs')('viem', files.importer)).toThrow('not a supported pure reexport entry');
  });

  it('rejects ESM reexport attributes that a plain leaf import would discard', () => {
    const files = fixture();
    write(files.entry('esm'), `export { mainnet as chain } from './leaf.mjs' with { mode: 'custom' };`);
    expect(() => createViemExportReader('esm')('viem', files.importer)).toThrow('not a supported pure reexport entry');
  });

  it('recognizes the installed package aliases in both implementation formats', () => {
    for (const format of ['esm', 'commonjs'] as const) {
      const readExports = createViemExportReader(format);
      expect(readExports('viem', importer).get('EIP1193ProviderRpcError')?.imported).toBe('ProviderRpcError');
      expect(readExports('viem/chains', importer).get('zkSync')).toEqual(readExports('viem/chains', importer).get('zksync'));
      expect(readExports('viem', importer).get('BaseError')?.source).toContain(format === 'esm' ? '/_esm/' : '/_cjs/');
    }
  });
});

describe('shared import selection', () => {
  it('preserves local aliases, groups exports from one leaf, and retains bare reexports and types', () => {
    const files = fixture();
    write(files.entry('esm'), readFileSync(files.entry('esm'), 'utf8') + '\nexport { parseAbi } from "abitype";');
    const plan = createViemImportPlanner('esm')(
      declaration(`import { PublicError as LocalError, chain, parseAbi, type Chain } from 'viem';`),
      files.importer
    );
    expect(plan?.direct.size).toBe(1);
    expect([...(plan?.direct.values() ?? [])].flat().map(binding => [binding.imported, binding.local.name])).toEqual([
      [{ type: 'Identifier', name: 'OwnerError' }, 'LocalError'],
      [{ type: 'Identifier', name: 'mainnet' }, 'chain'],
    ]);
    expect(plan?.remaining.map(binding => binding.local.name)).toEqual(['parseAbi', 'Chain']);
  });

  it.each([
    `import type { Chain } from 'viem/chains';`,
    `import { type Chain } from 'viem/chains';`,
    `import * as chains from 'viem/chains';`,
    `import viem from 'viem';`,
    `import 'viem';`,
    `import { something } from 'another-package';`,
  ])('leaves unsupported or type-only imports alone: %s', source => {
    expect(createViemImportPlanner('esm')(declaration(source), '/not-installed/consumer.ts')).toBeUndefined();
  });

  it('uses CommonJS bindings in the Babel adapter', () => {
    const files = fixture();
    const result = transformSync(`import { PublicError as LocalError } from 'viem'; export { LocalError };`, {
      filename: files.importer,
      configFile: false,
      babelrc: false,
      plugins: [viemImportsBabelPlugin],
    });
    expect(result?.code).toContain(join(files.root, 'cjs/leaf.cjs'));
    expect(result?.code).toContain('OwnerError as LocalError');
  });

  it('edits only import statements in Vite, preserving comments, types and source maps', () => {
    const files = fixture();
    const source = `// Preserve this header.
import { /* The canonical error. */ PublicError as LocalError, type Chain } from 'viem';
const identity = <T>(value: T): T => value; // Keep exact formatting here.
export { identity, LocalError };`;
    const result = transformViemImports(source, files.importer);
    expect(result?.code).toContain(join(files.root, 'esm/leaf.mjs'));
    expect(result?.code).toContain('OwnerError as LocalError');
    expect(result?.code).toContain('import { type Chain } from "viem";');
    expect(result?.code).toContain('/* The canonical error. */');
    expect(result?.code.endsWith(source.slice(source.indexOf('\nconst identity')))).toBe(true);
    expect(result?.map.sourcesContent).toEqual([source]);
  });

  it('preserves the Node CommonJS export identity selected by Babel', () => {
    const require = createRequire(importer);
    const original: unknown = require('viem/chains');
    const target = createViemExportReader('commonjs')('viem/chains', importer).get('mainnet');
    if (!target || typeof original !== 'object' || original === null) throw new Error('Missing installed chain export.');
    const leaf: unknown = require(target.source);
    if (typeof leaf !== 'object' || leaf === null) throw new Error('Missing installed chain module.');
    expect(Reflect.get(leaf, target.imported)).toBe(Reflect.get(original, 'mainnet'));
  });
});
