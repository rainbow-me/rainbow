# Rainbow

React Native crypto wallet app (iOS & Android). Uses React Navigation, custom store creators for state/data, and ethers/viem for blockchain interactions.

## Verification

- **Type check (TS):** `yarn lint:ts`
- **Type check (JS):** `yarn lint:js-types` (checks JS files against an error baseline)
- **Lint (ESLint):** `yarn lint:js`
- **Lint all:** `yarn lint` (format + TS + JS)
- **Tests:** `yarn test` (Jest)
- **Single test:** `yarn jest path/to/test`
- **Cycle check:** `yarn check:cycles`

## Architecture

### State management

Custom store creators built on Zustand, defined in `src/state/internal/`:

- **`createRainbowStore`** -- general-purpose store with optional MMKV persistence. Use for client state.
- **`createQueryStore`** -- combines data fetching + state in one store. Reactive `$` params auto-refetch when dependencies change. Replaces the React Query + Zustand dual-store pattern. Use for server/async data.
- **`createDerivedStore`** -- read-only store that composes other stores. Use for computed/aggregated state.

Stores live in `src/state/` (one per domain) and in `src/features/*/data/stores/`. These in-repo creators are being replaced by the external [`stores`](https://github.com/christianbaroni/stores) package (same APIs: `createBaseStore`, `createQueryStore`, `createDerivedStore`). The migration is mostly an import swap.

Legacy systems still in use:

- **React Query** (`src/react-query/`) -- server state caching, being replaced by `createQueryStore`
- **Redux** (`src/redux/`) -- only for: charts, contacts, ENS registration, gas, settings

### Source layout

The codebase is mid-migration toward domain-organized architecture. New code goes in `src/features/` with `ui/data/core` layer separation. Legacy code lives in flat top-level directories (`components/`, `screens/`, `hooks/`, `helpers/`, `utils/`).

Key non-obvious directories:

- `src/framework/` -- app-agnostic infrastructure (http, safe math, UI primitives)
- `src/__swaps__/` -- swap feature, aliased as `@/swaps` in tsconfig
- `src/graphql/` -- separate yarn workspace for GraphQL codegen

## Code conventions

- **No barrel exports** -- import directly from source files, not `index.ts`. Barrels defeat tree-shaking, hide circular deps, and trigger cascading module loading. ESLint-enforced with a limited allowlist.
- **Type-only imports** -- use the `type` annotation for type-only imports (ESLint-enforced).
- **TypeScript over JavaScript** -- write all new files in `.ts`/`.tsx`. Remaining JS files are checked against an error baseline (`yarn lint:js-types`) -- don't regress it.

## Cursor Cloud specific instructions

- **GraphQL codegen** is required before `yarn lint:ts` passes. Run: `cd src/graphql && yarn install && yarn codegen`. The ENS schema will fail without `GRAPH_ENS_API_KEY`; generate without it by creating a temporary codegen config that excludes the `ens` entry, or provide a stub `src/graphql/__generated__/ens.ts` (the directory is gitignored). The other schemas (arc, arcDev, metadata, metadataPOST) generate fine without special keys.
- **Networks JSON** is required for typecheck. Run: `METADATA_BASE_URL=https://metadata.p.rainbow.me yarn fetch:networks` (the `.env` file usually provides `METADATA_BASE_URL`, but it may be absent in cloud).
- This is a **React Native** app; iOS/Android builds require Xcode and Android SDK which are unavailable in cloud. Cloud agents can run `yarn lint`, `yarn lint:ts`, `yarn lint:js`, `yarn test`, and `yarn check:cycles`.
- Pre-commit hook runs `lint-staged` via Husky.
