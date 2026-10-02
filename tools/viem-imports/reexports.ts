import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

import { parse } from '@babel/parser';
import { type Expression, type MemberExpression, type Node, type Statement } from '@babel/types';

/** The Viem build used by the caller: ESM for Vitest, CommonJS for Metro. */
export type ViemModuleFormat = 'esm' | 'commonjs';

/** Viem barrels supported by the import transform. */
export type ViemEntrySpecifier = 'viem' | 'viem/chains';

/** The module and binding name to use in a rewritten import. */
export interface ViemReexport {
  imported: string;
  source: string;
}

/** Resolves exports from the Viem installation used by an importing file. */
export type ViemExportReader = (specifier: ViemEntrySpecifier, importer: string) => ReadonlyMap<string, ViemReexport>;

interface CachedEntry {
  content: string;
  exports: ReadonlyMap<string, ViemReexport>;
}

/**
 * Finds the modules behind Viem's named exports without executing the package.
 * Resolves from each importer using the requested module format. Throws for
 * unsupported package metadata or reexport syntax.
 */
export function createViemExportReader(format: ViemModuleFormat): ViemExportReader {
  const entries = new Map<string, CachedEntry>();

  return function readExports(specifier, importer): ReadonlyMap<string, ViemReexport> {
    const { entry } = resolveEntry(specifier, importer, format);
    const content = readFileSync(entry, 'utf8');
    const cached = entries.get(entry);

    if (cached?.content === content) return cached.exports;

    const statements = parse(content, { sourceType: format === 'esm' ? 'module' : 'script' }).program.body;
    const exports = format === 'esm' ? readEsmReexports(statements, entry) : readCommonJsReexports(statements, entry);
    entries.set(entry, { content, exports });
    return exports;
  };
}

/**
 * Builds a key for invalidating cached Viem import rewrites when tooling or
 * dependencies change. Restart Metro or Vitest after such changes.
 */
export function getViemImportsCacheKey(projectRoot: string, format: ViemModuleFormat): string {
  const directory = resolve(projectRoot, 'tools/viem-imports');
  const files = new Set([
    resolve(projectRoot, 'yarn.lock'),
    ...readdirSync(directory)
      .filter(name => name.endsWith('.ts') && !name.endsWith('.test.ts'))
      .map(name => resolve(directory, name)),
  ]);

  for (const specifier of ['viem', 'viem/chains'] as const) {
    const { manifestPath, entry } = resolveEntry(specifier, resolve(projectRoot, 'package.json'), format);
    files.add(manifestPath);
    files.add(entry);
  }

  const hash = createHash('sha256');
  for (const filename of [...files].sort()) hash.update(filename).update('\0').update(readFileSync(filename)).update('\0');

  return hash.digest('hex');
}

function resolveEntry(specifier: ViemEntrySpecifier, importer: string, format: ViemModuleFormat): { manifestPath: string; entry: string } {
  const require = createRequire(importer);
  const manifestPath = realpathSync(require.resolve('viem/package.json'));
  const manifest: unknown = JSON.parse(readFileSync(manifestPath, 'utf8'));

  if (!isRecord(manifest) || manifest.sideEffects !== false || !isRecord(manifest.exports)) {
    throw new Error(`Cannot optimize Viem imports: ${manifestPath} must declare sideEffects: false and an exports map.`);
  }

  const target = manifest.exports[specifier === 'viem' ? '.' : './chains'];
  const condition = format === 'esm' ? 'import' : 'default';
  const filename = isRecord(target) ? target[condition] : undefined;

  if (
    !isRecord(target) ||
    typeof filename !== 'string' ||
    !filename.startsWith('./') ||
    Object.keys(target).some(key => !['types', 'import', 'default'].includes(key))
  ) {
    throw new Error(`Cannot optimize ${specifier}: ${manifestPath} has unsupported ${format} conditions.`);
  }

  return { manifestPath, entry: realpathSync(resolve(dirname(manifestPath), filename)) };
}

function readEsmReexports(statements: readonly Statement[], filename: string): ReadonlyMap<string, ViemReexport> {
  const exports = new Map<string, ViemReexport>();

  for (const statement of statements) {
    if (
      statement.type !== 'ExportNamedDeclaration' ||
      !statement.source ||
      statement.declaration ||
      statement.attributes?.length ||
      statement.assertions?.length
    ) {
      unsupportedEntry(filename);
    }

    for (const binding of statement.specifiers) {
      if (binding.type !== 'ExportSpecifier' || binding.local.type !== 'Identifier') unsupportedEntry(filename);
      const name = binding.exported.type === 'Identifier' ? binding.exported.name : binding.exported.value;
      addReexport(exports, filename, name, binding.local.name, statement.source.value);
    }
  }

  return exports;
}

function readCommonJsReexports(statements: readonly Statement[], filename: string): ReadonlyMap<string, ViemReexport> {
  const sources = new Map<string, string>();
  const exports = new Map<string, ViemReexport>();
  const declaredExports = new Set<string>();

  for (const statement of statements) {
    if (statement.type === 'VariableDeclaration') {
      for (const declaration of statement.declarations) {
        const call = declaration.init;
        if (
          declaration.id.type !== 'Identifier' ||
          call?.type !== 'CallExpression' ||
          call.callee.type !== 'Identifier' ||
          call.callee.name !== 'require' ||
          call.arguments.length !== 1 ||
          call.arguments[0]?.type !== 'StringLiteral'
        ) {
          unsupportedEntry(filename);
        }

        if (sources.has(declaration.id.name) || ['require', 'exports', 'Object'].includes(declaration.id.name)) unsupportedEntry(filename);
        sources.set(declaration.id.name, call.arguments[0].value);
      }
      continue;
    }

    if (statement.type !== 'ExpressionStatement') {
      unsupportedEntry(filename);
    }

    const expression = statement.expression;

    if (isExportInitialization(expression)) {
      if (sources.size) unsupportedEntry(filename);
      continue;
    }

    if (expression.type !== 'CallExpression' || !isMember(expression.callee, 'Object', 'defineProperty')) {
      unsupportedEntry(filename);
    }

    const [owner, name, descriptor] = expression.arguments;

    if (
      expression.arguments.length !== 3 ||
      owner?.type !== 'Identifier' ||
      owner.name !== 'exports' ||
      name?.type !== 'StringLiteral' ||
      descriptor?.type !== 'ObjectExpression'
    ) {
      unsupportedEntry(filename);
    }

    if (declaredExports.has(name.value)) unsupportedEntry(filename);
    declaredExports.add(name.value);

    const properties = new Map<string, Expression>();
    for (const property of descriptor.properties) {
      if (
        property.type !== 'ObjectProperty' ||
        property.computed ||
        property.key.type !== 'Identifier' ||
        (property.value.type !== 'BooleanLiteral' && property.value.type !== 'FunctionExpression')
      ) {
        unsupportedEntry(filename);
      }
      properties.set(property.key.name, property.value);
    }

    const value = properties.get('value');
    if (name.value === '__esModule' && properties.size === 1 && value?.type === 'BooleanLiteral' && value.value) continue;

    const enumerable = properties.get('enumerable');
    const getter = properties.get('get');

    if (
      properties.size !== 2 ||
      enumerable?.type !== 'BooleanLiteral' ||
      !enumerable.value ||
      getter?.type !== 'FunctionExpression' ||
      getter.id ||
      getter.params.length ||
      getter.async ||
      getter.generator ||
      getter.body.body.length !== 1
    ) {
      unsupportedEntry(filename);
    }

    const returned = getter.body.body[0];
    if (returned?.type !== 'ReturnStatement' || returned.argument?.type !== 'MemberExpression') unsupportedEntry(filename);

    const binding = returned.argument;
    if (binding.computed || binding.object.type !== 'Identifier' || binding.property.type !== 'Identifier') unsupportedEntry(filename);

    const source = sources.get(binding.object.name);
    if (!source) unsupportedEntry(filename);

    addReexport(exports, filename, name.value, binding.property.name, source);
  }

  return exports;
}

function addReexport(exports: Map<string, ViemReexport>, filename: string, name: string, imported: string, source: string): void {
  // Bare reexports retain their public entry and its package-resolution context.
  if (!source.startsWith('./') && !source.startsWith('../')) return;
  exports.set(name, { imported, source: resolve(dirname(filename), source) });
}

function isExportInitialization(expression: Expression): boolean {
  let value = expression;
  if (value.type !== 'AssignmentExpression') return false;

  while (value.type === 'AssignmentExpression') {
    if (value.operator !== '=' || !isMember(value.left, 'exports')) return false;
    value = value.right;
  }

  return (
    value.type === 'UnaryExpression' && value.operator === 'void' && value.argument.type === 'NumericLiteral' && value.argument.value === 0
  );
}

function isMember(node: Node, object: string, property?: string): node is MemberExpression {
  return (
    node.type === 'MemberExpression' &&
    !node.computed &&
    node.object.type === 'Identifier' &&
    node.object.name === object &&
    node.property.type === 'Identifier' &&
    (property === undefined || node.property.name === property)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unsupportedEntry(filename: string): never {
  throw new Error(`Cannot optimize Viem imports: ${filename} is not a supported pure reexport entry.`);
}
