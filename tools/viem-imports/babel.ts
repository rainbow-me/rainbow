import { type PluginObj } from '@babel/core';

import { createViemImportPlanner } from './imports';

/**
 * Rewrites named imports from `viem` and `viem/chains` to their CommonJS
 * source modules, avoiding the full export barrels in Metro.
 */
export function viemImportsBabelPlugin({ types }: { types: typeof import('@babel/types') }): PluginObj {
  const planImport = createViemImportPlanner('commonjs');

  return {
    name: 'viem-direct-imports',
    visitor: {
      ImportDeclaration(path, state) {
        const importSource = path.node.source.value;
        const shouldProcess = importSource === 'viem' || importSource === 'viem/chains';
        if (!shouldProcess) return;

        const filename = state.filename;
        if (!filename) throw path.buildCodeFrameError('Viem import selection requires the importing filename.');

        const plan = planImport(path.node, filename);
        if (!plan) return;

        for (const [source, specifiers] of plan.direct) {
          path.insertBefore(
            types.importDeclaration(
              specifiers.map(specifier => types.cloneNode(specifier)),
              types.stringLiteral(source)
            )
          );
        }

        if (plan.remaining.length) path.node.specifiers = plan.remaining;
        else path.remove();
      },
    },
  };
}
