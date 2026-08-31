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
 * Two graphs, selected by DEPCRUISE_GRAPH, because the rules ask two different
 * questions of the code. Every rule belongs to exactly one graph
 * (tools/deps-check/config.test.ts holds that); tools/deps-check runs both per
 * platform and unions the results.
 *
 * - `runtime`: what actually executes. Each file is compiled to JavaScript and
 *   the imports are read off the result, so anything TypeScript erases (type
 *   imports, imports only used as types) is not an edge. That is what makes it
 *   the right graph for cycles: a cycle here is one the bundle really has.
 *   Resolution follows into node_modules so rules about edges originating
 *   inside dependencies can see them. The TypeScript parser is not enabled on
 *   this graph: much of React Native is Flow-typed, which TypeScript does not
 *   parse (dependency-cruiser 18.0.0 also crashes on the malformed statements
 *   TypeScript hands back for Flow-only syntax).
 *
 * - `source`: what the code says. First-party files are read straight from the
 *   TypeScript AST (`tsPreCompilationDeps: true`), so `import type` edges are
 *   in the graph tagged `type-only`. Layer and boundary rules live here because
 *   type coupling across a boundary is a violation too, and it is invisible on
 *   the runtime graph. node_modules are recorded as leaves, not followed. Never
 *   put a cycle rule on this graph: type edges and DFS path selection make its
 *   notion of a "runtime cycle" unsound.
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
const GRAPH = process.env.DEPCRUISE_GRAPH ?? 'runtime';

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

const runtimeRules = [
  {
    name: 'no-circular',
    severity: 'error',
    comment:
      "No net-new circular dependency between first-party modules. Cycles cause hard-to-debug 'undefined on import' crashes (often only in release builds) and make module load order fragile. Existing cycles are grandfathered per platform in .deps-check-baseline.{ios,android}.json (enforced by tools/deps-check), so only net-new cycles fail. Removing a cycle also fails until the baseline is ratcheted to match (run `yarn lint:deps:baseline:update` and commit), so baselines stay exact. Both endpoints are scoped to first-party code (node_modules cycles are not ours to fix).",
    from: { pathNot: 'node_modules' },
    to: { circular: true, pathNot: 'node_modules' },
  },
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

// A layered module is a feature or the framework that has been split into
// ui/data/core. Layer is a property of the code's subject, not of the module,
// so core/ may not import ui/ or data/ of any layered module, its own or
// another's: another feature's store is still IO. Anchoring on the real layer
// directories rather than a bare `core/` keeps legacy folders that share the
// name out of scope.
const LAYERED_MODULE = '(src/features/[^/]+|src/framework)';

// The packages that make a file UI-runtime code. Matched as whole package
// directories so react-prefixed packages that are not the runtime (mmkv, svg,
// ...) are not caught.
const UI_RUNTIME_PACKAGES = '^node_modules/(react|react-native|react-native-reanimated)/';

const sourceRules = [
  {
    name: 'layer-core-is-a-leaf',
    severity: 'error',
    comment:
      "core/ holds a module's models and pure domain logic and imports nothing from any ui/ or data/ layer. Allowed layer edges are ui → data, ui → core and data → core only; anything else inverts the dependency direction and drags rendering or IO concerns into the layer that is supposed to be testable without them.",
    from: { path: `^${LAYERED_MODULE}/core/` },
    to: { path: `^${LAYERED_MODULE}/(ui|data)/` },
  },
  {
    name: 'layer-data-does-not-import-ui',
    severity: 'error',
    comment:
      'data/ holds stores, API clients and transforms and imports nothing from any ui/ layer. Rendering depends on state and IO, never the other way round; a store that needs something from a component is a store holding UI runtime concerns that belong in a ui/ hook.',
    from: { path: `^${LAYERED_MODULE}/data/` },
    to: { path: `^${LAYERED_MODULE}/ui/` },
  },
  {
    name: 'layer-ui-runtime-only-in-ui',
    severity: 'error',
    comment:
      'Only ui/ may import the UI runtime (React, React Native, Reanimated). core/ and data/ are framework-agnostic by definition: stores work as hooks and imperatively via getState(), and domain logic runs in tests without a renderer. A React import outside ui/ is code that belongs in a ui/ hook or component.',
    from: { path: `^${LAYERED_MODULE}/(core|data)/` },
    to: { path: UI_RUNTIME_PACKAGES },
  },
  {
    name: 'layer-core-has-no-state',
    severity: 'error',
    comment:
      'core/ knows domain models and pure rules only; it never creates or reads stores, whether via the store library or the legacy state, query and redux layers. Reading state from core/ makes the pure layer depend on IO and load order; the read belongs in data/ (a derived store) or at the call site.',
    from: { path: `^${LAYERED_MODULE}/core/` },
    to: { path: '^(node_modules/@storesjs/stores/|src/(state|react-query|redux)/)' },
  },
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
  runtime: {
    forbidden: runtimeRules,
    options: {
      ...sharedOptions,
      // Follow into node_modules so import edges that originate inside
      // dependencies are visible; only skip caches/binaries.
      doNotFollow: { path: 'node_modules/\\.(cache|bin)/' },
    },
  },
  source: {
    forbidden: sourceRules,
    options: {
      ...sharedOptions,
      tsPreCompilationDeps: true,
      doNotFollow: { path: 'node_modules' },
      enhancedResolveOptions: {
        ...sharedOptions.enhancedResolveOptions,
        // Type imports may land on a declaration file. Listed last so a
        // sibling .ts/.js still wins; without it the edge is unresolved and
        // the layer rules never see it.
        extensions: [...extensions, '.d.ts'],
      },
    },
  },
};

if (!graphs[GRAPH]) {
  throw new Error(`Unknown DEPCRUISE_GRAPH "${GRAPH}"; expected one of ${Object.keys(graphs).join(', ')}`);
}

module.exports = graphs[GRAPH];
