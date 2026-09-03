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

- `src/framework/` -- app-agnostic infrastructure (http, safe math, UI primitives). The litmus test is "could this be copied into an app for a completely different business, unchanged?" -- crypto and chain knowledge fails it, so a CAIP parser, an address validator or a units helper is domain code in `src/features/{domain}/`, however pure it is. Framework-agnostic (no React) is not the same as domain-agnostic. `framework/core/evm/` predates this rule and is not precedent.
- `src/__swaps__/` -- swap feature, aliased as `@/swaps` in tsconfig
- `src/graphql/` -- separate yarn workspace for GraphQL codegen
- `scripts/` -- flat, single-file scripts that orchestrate/wrap existing things
- `tools/` -- standalone tooling with its own logic, modules, and tests

### Feature flags

Unfinished user-visible work ships behind a flag, default off. Add a label constant plus a `config` entry in `src/features/config/constants/experimental.ts`; `settings: true` puts a toggle in Developer Settings, and `needsRestart: true` restarts the app on toggle, which is required whenever the flag decides something memoized for the life of the process (store selectors, module-scope constants). Read it with `getExperimentalFlag(FLAG)` outside React and `useExperimentalFlag(FLAG)` inside. Toggling from an e2e test goes through `rainbow://e2e/setExperimentalFlag?flag=<label>&value=true`.

**The persisted config replaces the declared one, so a declared default is not what decides the flag on a device that already has a config.** `config` is a single top-level key and hydration is a top-level shallow merge of persisted over declared, so the stored object replaces `defaultConfigValues` wholesale. Three consequences, all of them measured against the running app, on every build that reads persisted state:

- **A declared default is dead once its key is persisted.** `getFlag` applies `?? defaultConfig[key].value` only for keys missing from the stored blob. Editing `value` in `experimental.ts` changes nothing on a device that already stored that key, so a flag shipped default-on and later flipped to default-off stays on there, and no code change turns it off. Change it with `setFlag`, a migration, or Reset Experimental Config; not by editing the default.
- **The two read styles disagree for a newly added flag.** `getExperimentalFlag` and `useExperimentalFlag` apply the declared default; `useExperimentalConfig()` hands consumers the raw map, which they index directly and which has no entry for a key that was never persisted. A new flag declared `value: true` is therefore on for the first two and `undefined` for the third, silently.
- **A newly added flag has no Developer Settings row at all** until something writes its key, because the list is built from `Object.keys(config)`, the persisted map. You cannot turn a new flag on there on any device with an existing config; tap Reset Experimental Config first, which writes every declared key at its declared default and makes the row appear.

The bound: `getFlag`, `useExperimentalFlag` and `useExperimentalConfig` all short-circuit to the declared values when `IS_STORE_INSTALL`, so App Store and Play Store builds ignore persisted flag state entirely and none of the above reaches those users. TestFlight, internal and local builds do read persisted state, so all three reach testers and developers on them.

## Code conventions

- **No barrel exports** -- import directly from source files, not `index.ts`. Barrels defeat tree-shaking, hide circular deps, and trigger cascading module loading. ESLint-enforced with a limited allowlist.
- **Type-only imports** -- use the `type` annotation for type-only imports (ESLint-enforced).
- **TypeScript over JavaScript** -- write all new files in `.ts`/`.tsx`. Remaining JS files are checked against an error baseline (`yarn lint:js-types`) -- don't regress it.
