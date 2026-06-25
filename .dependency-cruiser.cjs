/* eslint-disable import/no-commonjs */
/**
 * Architectural dependency rules, enforced in CI.
 *
 * Deterministic, hard-fail boundaries on import edges: a violation fails the
 * build. This is the home for any dependency invariant we want enforced
 * statically — e.g. domain/layer boundaries (ui/data/core), keeping the
 * framework module self-contained, no cross-feature imports, and the like. Add
 * to `forbidden` as the architecture grows; each rule's `comment` says what it
 * protects.
 *
 * The rules currently here inspect third-party code, so resolution deliberately
 * follows into node_modules (which dependency-cruiser skips by default) and
 * mirrors React Native / Metro platform resolution, so the check evaluates the
 * same files that actually ship. First-party-only rules won't need that.
 */

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

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-dep-into-app-source',
      severity: 'error',
      comment:
        "A third-party package must not import the app's own source (src/). Dependencies should point outward, not reach back into our code: an inward edge couples a library to our internals (usually a fork or patch gone wrong) and inverts the dependency graph.",
      from: { path: 'node_modules/' },
      // pathNot excludes nested workspaces (e.g. src/graphql/node_modules/*),
      // which are third-party files that merely live under src/.
      to: { path: '^src/', pathNot: 'node_modules/' },
    },
    ...restrictedImportRules,
  ],
  options: {
    // Follow into node_modules (skipped by default) so import edges that
    // originate inside dependencies are visible; only skip caches/binaries.
    doNotFollow: { path: 'node_modules/\\.(cache|bin)/' },
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      // Mirror React Native / Metro platform resolution.
      extensions: [
        '.ios.js',
        '.android.js',
        '.native.js',
        '.js',
        '.ios.jsx',
        '.android.jsx',
        '.native.jsx',
        '.jsx',
        '.ios.ts',
        '.android.ts',
        '.native.ts',
        '.ts',
        '.ios.tsx',
        '.android.tsx',
        '.native.tsx',
        '.tsx',
        '.json',
      ],
      mainFields: ['react-native', 'browser', 'module', 'main'],
    },
  },
};
