import { type ImportDeclaration, type ImportSpecifier } from '@babel/types';

import { createViemExportReader, type ViemModuleFormat } from './reexports';

/**
 * Splits a Viem import into direct module imports and bindings that still
 * need the package entry.
 */
export interface ViemImportPlan {
  /** Absolute module paths and the bindings to import from each. */
  direct: ReadonlyMap<string, readonly ImportSpecifier[]>;
  /** Bindings left on the original import. */
  remaining: ImportDeclaration['specifiers'];
}

/** Returns a direct-import plan, or `undefined` when the declaration should stay unchanged. */
export type ViemImportPlanner = (declaration: ImportDeclaration, importer: string) => ViemImportPlan | undefined;

/**
 * Plans imports that bypass Viem's export barrels and avoid loading unused
 * modules. Uses the Viem installation resolved from each importing file.
 */
export function createViemImportPlanner(format: ViemModuleFormat): ViemImportPlanner {
  const readExports = createViemExportReader(format);

  return function planViemImport(declaration, importer): ViemImportPlan | undefined {
    const source = declaration.source.value;
    if (
      (source !== 'viem' && source !== 'viem/chains') ||
      declaration.importKind === 'type' ||
      declaration.importKind === 'typeof' ||
      declaration.attributes?.length ||
      declaration.assertions?.length ||
      !declaration.specifiers.some(isNamedValueImport)
    ) {
      return undefined;
    }

    const exports = readExports(source, importer);
    const direct = new Map<string, ImportSpecifier[]>();
    const remaining: ImportDeclaration['specifiers'] = [];

    for (const specifier of declaration.specifiers) {
      if (!isNamedValueImport(specifier)) {
        remaining.push(specifier);
        continue;
      }

      const name = specifier.imported.type === 'Identifier' ? specifier.imported.name : specifier.imported.value;
      const target = exports.get(name);
      if (!target) {
        remaining.push(specifier);
        continue;
      }

      const bindings = direct.get(target.source) ?? [];
      bindings.push({ ...specifier, imported: { type: 'Identifier', name: target.imported } });
      direct.set(target.source, bindings);
    }

    return direct.size ? { direct, remaining } : undefined;
  };
}

function isNamedValueImport(specifier: ImportDeclaration['specifiers'][number]): specifier is ImportSpecifier {
  return specifier.type === 'ImportSpecifier' && specifier.importKind !== 'type' && specifier.importKind !== 'typeof';
}
