# Rainbow

React Native crypto wallet app (iOS & Android). Uses React Navigation, `@storesjs/stores` store creators for state/data, and ethers/viem for blockchain interactions.

## Verification

- **Type check (TS):** `yarn lint:ts`
- **Type check (JS):** `yarn lint:js-types` (checks JS files against an error baseline)
- **Lint (ESLint):** `yarn lint:js`
- **Lint all:** `yarn lint` (format + TS + JS)
- **Tests:** `yarn test` (Jest)
- **Single test:** `yarn jest path/to/test`
- **Dependency rules + cycles:** `yarn lint:deps` (dependency-cruiser via `tools/deps-check/`: architectural boundaries, plus circular deps checked against a grandfathered per-platform baseline). Net-new cycles fail; removing cycles also fails until you run `yarn lint:deps:baseline:update` and commit the baselines, which keeps them exact. Per-rule policies (grandfathered vs strict) live in `tools/deps-check/policies.ts`.

## Worktrees

Worktree setup is automatic and needs no action: `scripts/worktree-setup.sh` runs once per worktree, via the `SessionStart` hooks in `.claude/settings.json` and `.codex/config.toml`.

- **Worktree missing dependencies:** run `bash scripts/worktree-setup.sh`. It skips worktrees that already have `node_modules`, so use `yarn install` if a tree is present but broken.
- **Never run the app from a worktree** -- Metro, simulators and pods are single-instance. Use the main checkout.

## Architecture

### State management

State/data stores use `@storesjs/stores`:

- **`createBaseStore`** -- general-purpose store with optional synchronous MMKV persistence. Use for client state.
- **`createQueryStore`** -- combines data fetching + state in one store. Reactive `$` params auto-refetch when dependencies change. Replaces the React Query + Zustand dual-store pattern. Use for server/async data.
- **`createDerivedStore`** -- read-only store that composes other stores. Use for computed/aggregated state.

Stores live in `src/state/` (one per domain) and in `src/features/*/data/stores/`.

Legacy systems still in use:

- **React Query** (`src/react-query/`) -- server state caching, being replaced by `createQueryStore`
- **Redux** (`src/redux/`) -- only for: charts, contacts, ENS registration, gas, settings

### Source layout

The codebase is mid-migration toward domain-organized architecture. New code goes in `src/features/` with `ui/data/core` layer separation. Legacy code lives in flat top-level directories (`components/`, `screens/`, `hooks/`, `helpers/`, `utils/`).

Key non-obvious directories:

- `src/framework/` -- app-agnostic infrastructure (http, safe math, UI primitives)
- `src/__swaps__/` -- swap feature, aliased as `@/swaps` in tsconfig
- `src/graphql/` -- separate yarn workspace for GraphQL codegen
- `scripts/` -- flat, single-file scripts that orchestrate/wrap existing things
- `tools/` -- standalone tooling with its own logic, modules, and tests

## Code conventions

- **No barrel exports** -- import directly from source files, not `index.ts`. Barrels defeat tree-shaking, hide circular deps, and trigger cascading module loading. ESLint-enforced with a limited allowlist.
- **Type-only imports** -- use the `type` annotation for type-only imports (ESLint-enforced).
- **TypeScript over JavaScript** -- write all new files in `.ts`/`.tsx`. Remaining JS files are checked against an error baseline (`yarn lint:js-types`) -- don't regress it.
