/* eslint-disable import/no-commonjs */
/**
 * Architectural dependency rules, enforced in CI.
 *
 * Deterministic, hard-fail boundaries on import edges: a violation fails the
 * build. This is the home for any dependency invariant we want enforced
 * statically — e.g. domain/layer boundaries (ui/data/core), keeping the
 * framework module self-contained, no cross-feature imports, and the like. Add
 * to the relevant graph's rules as the architecture grows; each rule's
 * `comment` says what it protects.
 *
 * Two graphs, because the two kinds of rule need incompatible cruises. Every
 * rule belongs to exactly one graph (tools/deps-check/config.test.ts holds
 * that), and tools/deps-check runs both per platform and unions the results.
 *
 * - `first-party` (DEPCRUISE_GRAPH unset or 'first-party'): our own code only.
 *   Read straight from the TypeScript AST (`tsPreCompilationDeps: true`), so
 *   `import type` edges are in the graph tagged `type-only`, and the layer and
 *   boundary rules can see type coupling. Rules that only care about runtime
 *   edges opt out per rule with `viaOnly`/`dependencyTypesNot`. The AST path
 *   also avoids the transpile-then-parse path, which drops imports from files
 *   it cannot parse. node_modules are recorded as leaves, not followed.
 *
 * - `third-party` (DEPCRUISE_GRAPH=third-party): rules that inspect edges
 *   originating inside dependencies, so resolution follows into node_modules
 *   (which dependency-cruiser skips by default). Runs on the default
 *   post-compilation extractor: `tsPreCompilationDeps` would route every .js
 *   file through the TypeScript parser, and much of React Native is Flow-typed,
 *   which TypeScript does not parse (dependency-cruiser 18.0.0 also crashes on
 *   the malformed statements TypeScript hands back for Flow-only syntax).
 *
 * Platform resolution: dependency-cruiser builds one graph per run, resolving
 * each platform-split import (foo.ios / foo.android) to a single variant, while
 * Metro builds a separate graph per platform when bundling. A forbidden edge
 * living only in an .android file is therefore invisible to a run that resolved
 * the .ios variant, and vice versa. To cover both, tools/deps-check runs each
 * graph once per platform (DEPCRUISE_PLATFORM=ios|android); the platform only
 * changes the extension order below, and the union of the runs sees every edge
 * that can ship on either platform.
 */

const PLATFORM = process.env.DEPCRUISE_PLATFORM === 'android' ? 'android' : 'ios';
const GRAPH = process.env.DEPCRUISE_GRAPH === 'third-party' ? 'third-party' : 'first-party';

// React Native / Metro extension order for the active platform: the platform
// variant, then the shared-native variant, then the plain file. Only one
// platform's variant is listed per run (Metro never falls back across platforms),
// so the ios and android runs cleanly partition platform-split files.
const BASE_EXTENSIONS = ['js', 'jsx', 'ts', 'tsx'];
const extensions = [...BASE_EXTENSIONS.flatMap(ext => [`.${PLATFORM}.${ext}`, `.native.${ext}`, `.${ext}`]), '.json'];

// Capability-sensitive native modules that nothing else should import: secure
// storage (keychain), clipboard, and media. Extend as the boundary set grows.
const RESTRICTED_PACKAGES = ['react-native-keychain', '@react-native-clipboard/clipboard', 'react-native-video'];

const escapeRegExp = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const restrictedImportRules = RESTRICTED_PACKAGES.map(pkg => {
  const pkgPath = `node_modules/${escapeRegExp(pkg)}/`;
  return {
    name: `no-untrusted-import-of-${pkg.replace(/[^a-zA-Z0-9]+/g, '-')}`,
    severity: 'error',
    comment: `Only "${pkg}" itself (and our own app code) may import "${pkg}"; no other third-party package may. Keeps the import surface of a capability-sensitive native module locked down so a stray or compromised dependency cannot quietly reach into it.`,
    from: { path: 'node_modules/', pathNot: pkgPath },
    to: { path: pkgPath },
  };
});

const firstPartyRules = [
  {
    name: 'no-circular',
    severity: 'error',
    comment:
      "No net-new circular dependency between first-party modules. Cycles cause hard-to-debug 'undefined on import' crashes (often only in release builds) and make module load order fragile. Existing cycles are grandfathered per platform in .deps-check-baseline.{ios,android}.json (enforced by tools/deps-check), so only net-new cycles fail. Removing a cycle also fails until the baseline is ratcheted to match (run `yarn lint:deps:baseline:update` and commit), so baselines stay exact. A cycle only fails at runtime if every edge in it survives compilation, so the whole path must be free of type-only edges (viaOnly); dependencyTypesNot on `to` would filter only the closing edge.",
    from: { pathNot: 'node_modules' },
    to: { circular: true, pathNot: 'node_modules', viaOnly: { dependencyTypesNot: ['type-only'] } },
  },
];

const thirdPartyRules = [
  {
    name: 'no-dep-into-app-source',
    severity: 'error',
    comment:
      "A third-party package must not import any of the app's own first-party files. Dependencies should point outward, not reach back into our code: an inward edge couples a library to our internals (usually a fork or patch gone wrong) and inverts the dependency graph.",
    from: { path: '^node_modules/' },
    // pathNot drops node_modules targets, incl. nested workspaces like src/graphql/node_modules/*.
    to: { dependencyTypes: ['local'], pathNot: 'node_modules/' },
  },
  ...restrictedImportRules,
];

const sharedOptions = {
  tsConfig: { fileName: 'tsconfig.json' },
  enhancedResolveOptions: {
    extensions,
    mainFields: ['react-native', 'browser', 'module', 'main'],
  },
};

/** @type {Record<string, import('dependency-cruiser').IConfiguration>} */
const graphs = {
  'first-party': {
    forbidden: firstPartyRules,
    options: {
      ...sharedOptions,
      tsPreCompilationDeps: true,
      doNotFollow: { path: 'node_modules' },
    },
  },
  'third-party': {
    forbidden: thirdPartyRules,
    options: {
      ...sharedOptions,
      // Follow into node_modules so import edges that originate inside
      // dependencies are visible; only skip caches/binaries.
      doNotFollow: { path: 'node_modules/\\.(cache|bin)/' },
    },
  },
};

module.exports = graphs[GRAPH];
