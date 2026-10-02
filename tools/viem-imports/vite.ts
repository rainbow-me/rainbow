import { parse } from '@babel/parser';
import { type ImportDeclaration, type ImportSpecifier } from '@babel/types';
import MagicString, { type SourceMap } from 'magic-string';
import { type Plugin } from 'vite';

import { createViemImportPlanner } from './imports';

const planImport = createViemImportPlanner('esm');

const SCRIPT_FILE_RE = /\.[cm]?[jt]sx?$/;
const VIEM_SOURCE_RE = /(['"])viem(?:\/chains)?\1/;
const TYPESCRIPT_FILE_RE = /\.[cm]?tsx?$/;
const JSX_FILE_RE = /\.[jt]sx$/;

/**
 * Rewrites named Viem imports to their ESM source modules so Vitest avoids
 * loading unused exports. Returns `null` when the source needs no changes.
 */
export function transformViemImports(code: string, filename: string): { code: string; map: SourceMap } | null {
  if (!SCRIPT_FILE_RE.test(filename) || !VIEM_SOURCE_RE.test(code)) return null;

  const ast = parse(code, {
    sourceType: 'module',
    plugins: [
      ...(TYPESCRIPT_FILE_RE.test(filename) ? ['typescript' as const] : []),
      ...(JSX_FILE_RE.test(filename) ? ['jsx' as const] : []),
    ],
  });

  const output = new MagicString(code);

  for (const declaration of ast.program.body) {
    if (declaration.type !== 'ImportDeclaration') continue;
    const plan = planImport(declaration, filename);
    if (!plan) continue;

    const { start, end } = declaration;
    if (start == null || end == null) throw new Error(`Missing import source positions in ${filename}.`);

    const imports = [...plan.direct].map(([source, specifiers]) => renderImport(source, specifiers));
    const comments = (ast.comments ?? []).flatMap(comment =>
      comment.start != null && comment.end != null && comment.start >= start && comment.end <= end
        ? [code.slice(comment.start, comment.end)]
        : []
    );

    if (plan.remaining.length) imports.push(renderImport(declaration.source.value, plan.remaining));
    output.overwrite(start, end, [...comments, ...imports].join('\n'));
  }

  return output.hasChanged()
    ? { code: output.toString(), map: output.generateMap({ source: filename, includeContent: true, hires: true }) }
    : null;
}

/**
 * Avoids unnecessary Viem module loading in Vitest by rewriting imports before
 * Vite transforms the source. Package-entry mocks do not intercept rewritten imports.
 */
export function viemImportsVitePlugin(): Plugin {
  return { name: 'viem-direct-imports', enforce: 'pre', transform: transformViemImports };
}

function renderImport(source: string, specifiers: ImportDeclaration['specifiers'] | readonly ImportSpecifier[]): string {
  const clauses: string[] = [];
  const named: string[] = [];

  for (const specifier of specifiers) {
    if (specifier.type === 'ImportDefaultSpecifier') clauses.push(specifier.local.name);
    else if (specifier.type === 'ImportNamespaceSpecifier') clauses.push(`* as ${specifier.local.name}`);
    else {
      const imported = specifier.imported.type === 'Identifier' ? specifier.imported.name : JSON.stringify(specifier.imported.value);
      const binding = imported === specifier.local.name ? imported : `${imported} as ${specifier.local.name}`;
      named.push(`${specifier.importKind === 'type' ? 'type ' : ''}${binding}`);
    }
  }

  if (named.length) clauses.push(`{ ${named.join(', ')} }`);
  return `import ${clauses.join(', ')} from ${JSON.stringify(source)};`;
}
