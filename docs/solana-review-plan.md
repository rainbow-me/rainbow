# Solana review checkpoint — November 19, 2026

**Start here: [src/__swaps__/screens/Swap/Swap.tsx](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/__swaps__/screens/Swap/Swap.tsx:79) — read the opt-in screen branch (about 2 minutes).**

An existing mnemonic EVM subaccount gains a paired Solana address through a separate protected key record and public metadata mapping. Balances v2 adds Solana holdings to the wallet screen. The latest local work lets the normal swap sheet use the preview SDK for nine supported pairs, while keeping EVM signing and quote paths separate.

This guide covers **77 mobile paths**: the active stack from develop merge base `c73b4271c4761949371dcb041123a398dfb1bacd` through committed HEAD `f7c96d49e25508ea457b55c4ffd45db6cc91bd32`, plus **32 relevant uncommitted paths (19 tracked edits, 13 new files)**. It does not imply that the changes have passed a fresh merge-readiness audit. The editor recovery file `src/features/wallet/data/.enableSolanaAccount.ts.swp` is excluded and left untouched.

Active checkout: `/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp` on `jin/solana-swap-ui`. Local links point to this checkout, so later edits can move the content; `solana-review-inventory.json` records file hashes for this checkpoint. No product files, commits, branches, simulators or transactions were changed for this review-plan task.

## Branch map

Verified GitHub refs with `git ls-remote` on November 19; no checkout or rebase performed.

| Repository | Branch | Local head / published state | Role |
| --- | --- | --- | --- |
| rainbow | `jin/solana-internal-mvp` | Local `2ade52707`; [GitHub](https://github.com/rainbow-me/rainbow/tree/jin/solana-internal-mvp) at `f44971c09`, **5 commits behind local** | Wallet enablement/keychain, preview SDK, developer swap harness. 32 paths against its develop merge base. |
| rainbow | `jin/solana-balances-v2` | `f7c96d49e`; **not published** | Two commits atop local MVP: v2 balances, then metadata. 20 paths against MVP. Separate worktree: `solana-balances-metadata`. |
| rainbow | `jin/solana-swap-ui` | `f7c96d49e`; **not published** | Same committed HEAD as balances; all swap UI work is in the active worktree's uncommitted changes. |
| rainbow | `jin/solana-derivation-simulator` | [GitHub](https://github.com/rainbow-me/rainbow/tree/jin/solana-derivation-simulator) `c60507d5c` | Earlier broad wallet/keychain abstraction. **Sibling, not ancestor of the MVP stack**; do not merge it just to review/test this MVP. |
| sdk | `jin/solana-source-fee-guard` | Local `7df0f36` + 5 uncommitted source/test edits; **not published** | Source counterpart of the preview gasless guard plus an undeployed worker guard proposal; see appendix. |
| rainbow | `@christian/solana-sdk` | Local `f37a88da5`; [GitHub](https://github.com/rainbow-me/rainbow/tree/%40christian/solana-sdk) `90e7f43e9` | Christian's mobile integration reference. Local copy diverged; the installed tarball was sourced from the documented `f37a88da5` artifact, not the latest branch head. |
| sdk | `@christian/solana` | [GitHub](https://github.com/rainbow-me/sdk/tree/%40christian/solana) `7df0f36` | Christian's SDK and reference worker source. Local tracking refs are stale; live remote result above is authoritative for this checkpoint. |
| rainbow | `@jin/solana-derivation` | [GitHub](https://github.com/rainbow-me/rainbow/tree/%40jin/solana-derivation) `ef1acaa52` | Earlier debug derivation branch. |
| rainbow | `@jin/solana-feature-flag` | `aecfee732`; no published ref | Earlier flag work, historical context. |
| rainbow | `@jin/solana-sandbox` | `4123bd0c7`; local only | Historical sandbox, not the active implementation. |
| rainbow | `tsnap/solana` | [GitHub](https://github.com/rainbow-me/rainbow/tree/tsnap/solana) `b91a1a575` | Separate earlier Solana reference implementation. |

```text
c73b4271c (develop merge base)
└─ 53bfded42 (derivation)
   ├─ earlier abstraction work → jin/solana-derivation-simulator
   └─ MVP → jin/solana-internal-mvp (2ade52707)
      └─ balances + metadata → jin/solana-balances-v2 (f7c96d49e)
         └─ jin/solana-swap-ui (same HEAD + uncommitted work)
```

GitHub is currently an incomplete review surface. In the active checkout use `git diff c73b4271c jin/solana-internal-mvp -- <file>` for MVP, `git diff jin/solana-internal-mvp jin/solana-balances-v2 -- <file>` for balances, and `git diff HEAD -- <file>` for tracked UI edits. New UI files are untracked, so open them directly; ordinary `git diff` does not include them. Do not switch this dirty checkout to review another branch.

## Latest documents

| Document | Use it for |
| --- | --- |
| [docs/solana-swap-ui.md](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/docs/solana-swap-ui.md:1) | Latest normal-sheet work, shared controls, fee display and limitations. |
| [docs/solana-balances-v2.md](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/docs/solana-balances-v2.md:1) | v2 balance/metadata contract, wallet-row integration and known exclusions. |
| [docs/solana-internal-mvp.md](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/docs/solana-internal-mvp.md:1) | Wallet enablement, key storage, SDK artifact/relay setup, developer routes and historical receipts. |
| [Earlier findings](/Users/jin/rainbow_studio/chats/solana-wallet-abstraction/findings.html) | Architectural discussion, last modified November 5; not the current implementation status. |

## Review route

**Wallet identity/key storage → SDK execution → balances → swap state → shared presentation.** This is a reading order: each phase establishes contracts used in the next, not a claim that every arrow is a direct function call. Allow roughly **100–145 minutes**, in five separate sessions. Read changed hunks and the named symbols; do not reread entire legacy files.

### Phase 1 — Can the correct account be enabled and signed without changing legacy storage? (about 20–30 minutes)

Start with identity and secret ownership; downstream work relies on these invariants.

| Order | Depth | File / symbol | What to check |
| --- | --- | --- | --- |
| 1 | Read | [AGENTS.md](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/AGENTS.md:1) | Scope contract: additive paths, existing flag, EVM presentation reuse; shared view changes still need EVM regression review. |
| 2 | Read | [src/features/wallet/types.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/wallet/types.ts:162) — `WalletDescriptor` | Separate legacy compatible aliases from opt-in discriminated wallet types and precise account-key records. Identify which proposed types have actual consumers. |
| 3 | Read | [src/features/solana/core/address.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/core/address.ts:26) — `requireSolanaAddress` | Case-sensitive base58 identity and bounded validation; address validity is not proof that an account is funded. |
| 4 | Verify | [src/features/solana/core/address.test.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/core/address.test.ts:1) | Base58 lengths, invalid characters and canonical addresses. |
| 5 | Read | [src/features/solana/core/derivation.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/core/derivation.ts:66) — `deriveHardenedEd25519Node` | SLIP-0010 hardened path, index bounds, known vectors, and clearing intermediate key bytes. |
| 6 | Verify | [src/features/solana/core/derivation.test.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/core/derivation.test.ts:1) | SLIP-0010 vectors, supported mnemonic examples, index isolation and signature verification. |
| 7 | Read | [src/features/wallet/core/solanaAccount.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/wallet/core/solanaAccount.ts:8) — `solanaKeyFromSeed` | Derive index-specific Ed25519 seed; decode persisted base64 and prove its public key matches the requested address. |
| 8 | Verify | [src/features/wallet/core/solanaAccount.test.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/wallet/core/solanaAccount.test.ts:1) | Persisted format decoding and address/key binding. |
| 9 | Read | [src/features/wallet/data/enableSolanaAccount.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/wallet/data/enableSolanaAccount.ts:48) — `enableSolanaAccount` | Authenticate the existing mnemonic, prove EVM ownership at the index, save/read back the Solana key, then publish metadata. Recheck selection after awaits. |
| 10 | Read | [src/features/wallet/data/solanaKeychain.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/wallet/data/solanaKeychain.ts:25) — `saveSolanaKey` | Separate Solana record prefix avoids legacy backup ingestion; reuse shared auth policy; never overwrite an unreadable record; require successful readback. |
| 11 | Verify | [src/features/wallet/data/solanaKeychain.test.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/wallet/data/solanaKeychain.test.ts:1) | Shared auth policy, protected write/readback, cancellation, corrupt records and secret-safe errors. |
| 12 | Read | [src/features/wallet/data/stores/accountMetadataStore.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/wallet/data/stores/accountMetadataStore.ts:46) — `getSolanaAccount` | Persist only public wallet/index/address mapping; existing wallet profiles, damaged state and selection remain authoritative. |
| 13 | Read | [src/features/wallet/data/loadSolanaSigner.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/wallet/data/loadSolanaSigner.ts:9) — `withSolanaSigner` | Operation-scoped signing; reject account/cluster changes and expire the capability after the callback. |
| 14 | Verify | [src/features/wallet/data/solanaWallet.test.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/wallet/data/solanaWallet.test.ts:1) | Enable/publish ordering, wrong mnemonic/account rejection, operation-scoped signer expiry. |

**Checkpoint:** What prevents a key or signature from being attached to the wrong EVM subaccount?

**Next:** Pause, then continue to phase 2.

### Phase 2 — What exactly gets quoted, signed, submitted and retained on failure? (about 25–35 minutes)

With signer ownership established, trace the provider and execution boundary; UI uses this same executor.

| Order | Depth | File / symbol | What to check |
| --- | --- | --- | --- |
| 1 | Read | [docs/solana-internal-mvp.md](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/docs/solana-internal-mvp.md:1) | Scope, configuration, manual checks and explicit internal-MVP limitations. Read the current status and latest appended revision. |
| 2 | Read | [package.json](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/package.json:209) — `@rainbow-me/solana-sdk` | Preview SDK installed under a separate package name; production SDK remains 0.4.1. Check added direct crypto/RPC dependencies. |
| 3 | Skim | [rainbow-me-sdk-solana-mvp-0.5.0.tgz](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/rainbow-me-sdk-solana-mvp-0.5.0.tgz:1) | Binary preview SDK from the mobile Christian branch artifact, not a live dependency on latest upstream; hash is recorded in inventory and MVP documentation. |
| 4 | Read | [patches/@rainbow-me+solana-sdk+0.5.0.patch](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/patches/@rainbow-me+solana-sdk+0.5.0.patch:1) — `diff --git` | Installed-package patch covers CommonJS and ESM gasless reporting/preflight; compare to SDK source appendix. It does not deploy the worker. |
| 5 | Skim | [yarn.lock](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/yarn.lock:5764) — `@rainbow-me/solana-sdk` | Generated dependency resolution; compare with package.json and the preview tarball rather than reading unrelated lockfile context. |
| 6 | Read | [metro.config.js](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/metro.config.js:92) — `sourceExts` | Global Metro .mjs resolution for preview SDK lazy chunks; this is outside the runtime feature flag. |
| 7 | Read | [src/features/solana/core/mvpRoutes.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/core/mvpRoutes.ts:36) — `validateMvpReview` | Fixed mainnet routes, token identities, input caps, output/minimum validation and sponsorship requirements. |
| 8 | Verify | [src/features/solana/core/mvpRoutes.test.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/core/mvpRoutes.test.ts:1) | Fixed test route caps, recipients/assets, sponsorship, expiry and precise units. |
| 9 | Read | [src/features/solana/data/mvpSdk.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/data/mvpSdk.ts:23) — `configureSolanaMvpSdk` | Isolated preview SDK and Cloudflare transport; no production cache persistence/sync. Latest UI work captures up to eight prepared messages for fee estimation. |
| 10 | Verify | [src/features/solana/data/mvpSdk.test.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/data/mvpSdk.test.ts:1) | Relay selection/cache isolation, unchanged prepared response, exact-message lookup and bounded retention. |
| 11 | Read | [src/features/solana/data/mvpTrades.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/data/mvpTrades.ts:153) — `executeMvpTrade` | Read prepareSwapTrade, then executeMvpTrade and checkMvpExecution: exact prepared object, post-unlock checks, source fee RPC, persistent uncertain/pending journal, ManagedExecutionFailedError, single submission. |
| 12 | Verify | [src/features/solana/data/mvpTrades.test.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/data/mvpTrades.test.ts:1) | Signature/submission lifecycle, ambiguous outcomes, account/funds changes, fee estimation/recheck and no second spend. |
| 13 | Read | [src/features/solana/ui/SolanaMvpMenu.tsx](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/ui/SolanaMvpMenu.tsx:37) — `SolanaMvpMenu` | Internal developer buttons and explicit mainnet confirmation; compare developer paths with normal-sheet validation rather than assuming identical guards. |
| 14 | Read | [src/features/debug/screens/DevSection.tsx](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/debug/screens/DevSection.tsx:22) — `SolanaMvpMenu` | Entry wiring only; follow the child component for feature/build gating. |
| 15 | Read | [docs/relay-permit-contract-version.md](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/docs/relay-permit-contract-version.md:1) | Historical investigation and proposed worker changes; distinguish recorded evidence from deployed behavior. |
| 16 | Verify | [docs/relay-permit-contract-version.patch](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/docs/relay-permit-contract-version.patch:1) | Proposed external-source patch, not deployed worker behavior. Compare with its adjacent investigation and SDK appendix. |
| 17 | Read | [docs/solana-source-fee-investigation.md](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/docs/solana-source-fee-investigation.md:1) | Historical investigation and proposed worker changes; distinguish recorded evidence from deployed behavior. |
| 18 | Verify | [docs/solana-source-fee-guard.patch](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/docs/solana-source-fee-guard.patch:1) | Proposed external-source patch, not deployed worker behavior. Compare with its adjacent investigation and SDK appendix. |

**Checkpoint:** After an uncertain submission, which ID survives and why can a retry not spend twice?

**Next:** Pause, then continue to phase 3.

### Phase 3 — Can balances or metadata leak across accounts, currencies or flag state? (about 15–20 minutes)

With execution understood, inspect how public holdings are read and attached to the current wallet.

| Order | Depth | File / symbol | What to check |
| --- | --- | --- | --- |
| 1 | Read | [docs/solana-balances-v2.md](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/docs/solana-balances-v2.md:1) | Scope, configuration, manual checks and explicit internal-MVP limitations. Read the current status and latest appended revision. |
| 2 | Read | [src/features/solana/core/balances.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/core/balances.ts:66) — `parseSolanaBalances` | Validate v2 response account, currency, chain, mint, numeric units and duplicates; use metadata without guessing unknown decimals or prices. |
| 3 | Verify | [src/features/solana/core/balances.test.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/core/balances.test.ts:1) | Live-shape fixtures, missing metadata, exact units, currency/account validation and failed versus empty responses. |
| 4 | Read | [src/features/solana/data/fetchSolanaBalances.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/data/fetchSolanaBalances.ts:12) — `fetchSolanaBalances` | Independent authenticated v2 request; CAIP-10 only at this boundary; raw case-sensitive address remains internal. |
| 5 | Verify | [src/features/solana/data/fetchSolanaBalances.test.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/data/fetchSolanaBalances.test.ts:1) | Exact v2 request and abort behavior without changing v1 clients. |
| 6 | Read | [src/features/solana/data/solanaBalancesStore.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/data/solanaBalancesStore.ts:15) — `useSolanaBalancesAddress` | Flag/non-store/mainnet/account gate; address+currency cache identity, stale-data isolation, failed refresh and forced refresh. |
| 7 | Verify | [src/features/solana/data/solanaBalancesStore.test.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/data/solanaBalancesStore.test.ts:1) | Flags/build/account/currency gates; ignore stale data and prevent manual-fetch gate bypass. |
| 8 | Read | [src/hooks/useWalletSectionsData.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/hooks/useWalletSectionsData.ts:71) — `const solanaRows` | Map only current Solana balances into wallet rows; do not inject into other list types. |
| 9 | Read | [src/components/asset-list/RecyclerAssetList2/core/ViewTypes.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/components/asset-list/RecyclerAssetList2/core/ViewTypes.ts:16) — `SOLANA_COIN` | Discriminated list data for new Solana row and loading/error status. |
| 10 | Read | [src/helpers/buildWalletSections.tsx](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/helpers/buildWalletSections.tsx:418) — `const withBriefBalanceSection` | New rows above Small Balances is an approved internal exception; verify empty wallets, token headers and edit mode. |
| 11 | Verify | [src/helpers/buildWalletSections.solana.test.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/helpers/buildWalletSections.solana.test.ts:1) | Placement, headers, empty-token state and preserving EVM sections. |
| 12 | Read | [src/components/asset-list/RecyclerAssetList2/core/RowRenderer.tsx](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/components/asset-list/RecyclerAssetList2/core/RowRenderer.tsx:135) — `CellType.SOLANA_COIN` | New row/status dispatch only; EVM coin rows retain their branch. |
| 13 | Read | [src/components/asset-list/RecyclerAssetList2/core/ViewDimensions.tsx](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/components/asset-list/RecyclerAssetList2/core/ViewDimensions.tsx:42) — `CellType.SOLANA_COIN` | Row heights must match 70px token and 44px status views; verify recycled list scrolling. |
| 14 | Read | [src/features/solana/ui/SolanaBalanceRow.tsx](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/ui/SolanaBalanceRow.tsx:13) — `SolanaBalanceRow` | Metadata icon/24h display, direct image URL fallback and zero price display; currently a read-only row, not the EVM expanded-asset sheet. |
| 15 | Verify | [src/features/solana/ui/SolanaBalanceRow.test.tsx](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/ui/SolanaBalanceRow.test.tsx:1) | Metadata/icons/fallback and existing zero-value display conventions. |
| 16 | Read | [src/hooks/useLiveWalletBalance.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/hooks/useLiveWalletBalance.ts:51) — `const solanaBalance` | Add only current-account/current-currency Solana value to total; test no EVM double counting. |
| 17 | Read | [src/hooks/useRefreshAccountData.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/hooks/useRefreshAccountData.ts:11) — `refreshSolanaBalances` | Pull-to-refresh includes gated Solana fetch alongside existing operations. |

**Checkpoint:** Which store rejects stale account data, and what contributes to the wallet total?

**Next:** Pause, then continue to phase 4.

### Phase 4 — Does the normal sheet always act on the latest reviewed quote? (about 20–30 minutes)

Use the preceding account, executor and balance contracts to follow normal-sheet state transitions.

| Order | Depth | File / symbol | What to check |
| --- | --- | --- | --- |
| 1 | Read | [docs/solana-swap-ui.md](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/docs/solana-swap-ui.md:1) | Scope, configuration, manual checks and explicit internal-MVP limitations. Read the current status and latest appended revision. |
| 2 | Read | [src/features/solana/core/swap.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/core/swap.ts:46) — `validateSwapReview` | Supported assets and nine pairs; exact input precision, minimum output, sponsorship and expiry; Max leaves the internal SOL reserve. |
| 3 | Verify | [src/features/solana/core/swap.test.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/core/swap.test.ts:1) | Nine route pairs, token precision, minimum output, sponsorship/expiry and percentage/Max arithmetic. |
| 4 | Read | [src/features/solana/data/swapTypes.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/data/swapTypes.ts:5) — `PreparedSwap` | Source-discriminated SDK execution plus networkFeeLamports; zero here means user-paid zero, not original gas cost. |
| 5 | Read | [src/features/solana/data/swapSelection.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/data/swapSelection.ts:18) — `selectSolanaSwap` | Ephemeral selection binds EVM wallet/account and raw Solana address; no persisted quote or cross-account reuse. |
| 6 | Verify | [src/features/solana/data/swapSelection.test.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/data/swapSelection.test.ts:1) | Disabled gate and wallet/account-bound selection. |
| 7 | Read | [src/features/solana/ui/SolanaSwapOptions.tsx](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/ui/SolanaSwapOptions.tsx:13) — `SolanaSwapOptions` | Hardcoded default outputs and owned source options; only show with empty search and enabled mapping. |
| 8 | Read | [src/__swaps__/screens/Swap/Swap.tsx](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/__swaps__/screens/Swap/Swap.tsx:79) — `export function SwapScreen` | Two-minute entry point: existing EVM screen remains the fallback; selection and enabled-account gate opt into Solana and clear on account changes/unmount. |
| 9 | Read | [src/features/solana/ui/SolanaSwapFlow.tsx](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/ui/SolanaSwapFlow.tsx:60) — `export function SolanaSwapFlow` | Follow 500ms preparation debounce, stale-result generation checks, invalidation/retry/expiry, Review, 400ms hold, pending polling and confirmed balance refresh. Then inspect sponsorship and animated icon state. |
| 10 | Verify | [src/features/solana/ui/SolanaSwapFlow.test.tsx](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/ui/SolanaSwapFlow.test.tsx:1) | Quote retry after failure, stale output clearing, balance refresh, fee currency, shared hold, centered loading icon, sponsored versus wallet-paid footer. |

**Checkpoint:** Which events invalidate a quote, and where are identity, expiry and funds checked again?

**Next:** Pause, then continue to phase 5.

### Phase 5 — Which shared EVM views changed, and do existing controls still behave identically? (about 20–30 minutes)

Finish by checking the reused presentation and the existing EVM callers that still depend on it.

| Order | Depth | File / symbol | What to check |
| --- | --- | --- | --- |
| 1 | Read | [src/__swaps__/screens/Swap/components/SwapAssetFields.tsx](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/__swaps__/screens/Swap/components/SwapAssetFields.tsx:5) — `export function SwapAssetFields` | Common two-row token/amount/fiat/balance layout; verify slot ordering against EVM input and output wrappers. |
| 2 | Read | [src/__swaps__/screens/Swap/components/SwapInput.tsx](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/__swaps__/screens/Swap/components/SwapInput.tsx:13) — `export const SwapInput` | Read-only narrowed color shape permits the adapter without fake EVM asset identity. |
| 3 | Read | [src/__swaps__/screens/Swap/hooks/useSwapInputStyles.ts](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/__swaps__/screens/Swap/hooks/useSwapInputStyles.ts:21) — `export const` | Only narrowed read-only color input type; compare before/after animation behavior. |
| 4 | Read | [src/__swaps__/screens/Swap/components/SwapInputAsset.tsx](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/__swaps__/screens/Swap/components/SwapInputAsset.tsx:123) — `export function SwapInputAsset` | EVM callbacks and input state stay in place; layout is delegated to SwapAssetFields. |
| 5 | Read | [src/__swaps__/screens/Swap/components/SwapOutputAsset.tsx](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/__swaps__/screens/Swap/components/SwapOutputAsset.tsx:152) — `export function SwapOutputAsset` | Same layout extraction, preserving disabled-output handling and EVM native/token input controls. |
| 6 | Read | [src/__swaps__/screens/Swap/components/SwapCoinIconTextFallback.tsx](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/__swaps__/screens/Swap/components/SwapCoinIconTextFallback.tsx:42) — `type SwapCoinIconTextFallbackProps` | Read-only narrowed asset shape; runtime icon behavior should be preserved. |
| 7 | Read | [src/__swaps__/screens/Swap/components/SwapNumberPad.tsx](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/__swaps__/screens/Swap/components/SwapNumberPad.tsx:232) — `export function SwapNumberPadView` | Extract presentation and canDelete input; preserve worklet handlers, long-press backspace and EVM native-currency input. |
| 8 | Read | [src/__swaps__/screens/Swap/components/SwapSlider.tsx](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/__swaps__/screens/Swap/components/SwapSlider.tsx:78) — `export const SwapSliderView` | Explicit state and icon injection; compare original gesture/Max behavior, disabled/loading state and slider quote synchronization. |
| 9 | Read | [src/features/solana/ui/SolanaSwapControls.tsx](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/ui/SolanaSwapControls.tsx:125) — `SolanaSwapAmountControls` | Adapt Solana values to shared cards, keyboard and slider; check exact percentage rounding, native value display, SOL reserve and interaction/quote invalidation. |
| 10 | Read | [src/__swaps__/screens/Swap/components/SwapNavbar.tsx](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/__swaps__/screens/Swap/components/SwapNavbar.tsx:99) — `export function SwapNavbarView` | Shared profile/title layout; EVM supplies settings and its animation; Solana does not expose fee editing. |
| 11 | Read | [src/__swaps__/screens/Swap/components/SwapWarning.tsx](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/__swaps__/screens/Swap/components/SwapWarning.tsx:76) — `export function SwapWarningView` | Reuse text layout and styling; EVM still computes its own warning state. |
| 12 | Read | [src/__swaps__/screens/Swap/components/CoinRow.tsx](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/__swaps__/screens/Swap/components/CoinRow.tsx:120) — `CoinRowView` | Extracted layout/actions slots; EVM favorite/info logic stays in its adapter. Check output versus input spacing and press propagation. |
| 13 | Read | [src/features/solana/ui/SolanaSwapTokenRow.tsx](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/ui/SolanaSwapTokenRow.tsx:14) — `SolanaSwapTokenRow` | Shared row view; case-sensitive SPL mint copy/explorer actions. Favorites and native SOL info are still disabled; native SOL tracker discussion was not implemented. |
| 14 | Verify | [src/features/solana/ui/SolanaSwapTokenRow.test.tsx](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/features/solana/ui/SolanaSwapTokenRow.test.tsx:1) | Shared row wiring, mint case preservation, input/output actions and intentionally disabled controls. |
| 15 | Read | [src/__swaps__/screens/Swap/components/TokenList/TokenToBuyList.tsx](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/__swaps__/screens/Swap/components/TokenList/TokenToBuyList.tsx:236) — `ListHeaderComponent` | Solana default-list header and conditional item layout; verify EVM-only loading/search/filter behavior. |
| 16 | Read | [src/__swaps__/screens/Swap/components/TokenList/TokenToSellList.tsx](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/__swaps__/screens/Swap/components/TokenList/TokenToSellList.tsx:130) — `ListHeaderComponent` | Solana owned-token header; same layout consideration, no conversion of raw mints into EVM addresses. |
| 17 | Read | [src/__swaps__/screens/Swap/components/SwapActionButton.tsx](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/__swaps__/screens/Swap/components/SwapActionButton.tsx:224) — `const HoldProgress` | Hold color now comes from the button asset instead of EVM context; JS long-press callback is forwarded. Check all existing callers. |
| 18 | Read | [src/__swaps__/screens/Swap/components/GasButton.tsx](/Users/jin/rainbow_studio/frontend/rainbow-worktrees/solana-internal-mvp/src/__swaps__/screens/Swap/components/GasButton.tsx:89) — `SelectedGasView` | Shared gas label/icon/layout presentation; original EVM gas-speed menu and estimates stay connected to EVM state. |

**Checkpoint:** Can you identify every shared rendering change that needs an EVM flag-off regression test?

**Next:** Use the test matrix below to verify the changed behavior, especially EVM presentation with Solana disabled.

## Internal scaffolding versus reusable foundation

| Area | Current assessment for review |
| --- | --- |
| Wallet/key foundation | Intended reusable boundary: raw identity, separate protected keys, strict decoding and account checks. Still needs physical-device auth/cancellation and recovery coverage before calling it production-ready. |
| Balances | Small isolated v2 parser/fetch/store can survive backend schema changes; temporary above-Small-Balances placement, read-only rows and direct icon URLs remain MVP choices. |
| Execution | Exact reviewed-object submission and uncertain-execution journal are substantive foundations. Preview SDK alias/tarball, public mainnet RPC, bounded message interception, Cloudflare reference worker and fixed asset routes are integration scaffolding. |
| Swap controller | Functional but still a separate controller with a custom detail-review block and hardcoded three-token output list. No general EVM-output selection, global transaction-history integration or editable Solana fee controls. |
| Shared UI | Reused views are intended to remain; their extraction changes EVM rendering even when Solana is disabled. A feature flag alone does not prove zero production impact. Verify these as behavior-preserving changes, separately from new route behavior where possible. |

## Optional SDK source appendix (10–15 minutes)

Read these only after mobile phase 2. These **5 uncommitted files** are in the SDK worktree, not the mobile branch. The mobile installed-package patch includes the SDK reporting/preflight guards; the worker guard below is a proposal, not evidence of deployment.

| Depth | File | Check |
| --- | --- | --- |
| Read | [src/actions/internal/managedExecutionReview.ts](/Users/jin/rainbow_studio/smart-contract-sdks/sdk-worktrees/solana-source-fee-guard/src/actions/internal/managedExecutionReview.ts) | Solana source is not called gasless merely because the worker broadcasts it. |
| Read | [src/actions/internal/preflightRelay.ts](/Users/jin/rainbow_studio/smart-contract-sdks/sdk-worktrees/solana-source-fee-guard/src/actions/internal/preflightRelay.ts) | Reject a gasless Solana-source request under the current wallet-paid fee-payer contract. |
| Verify | [src/actions/internal/preflightRelay.test.ts](/Users/jin/rainbow_studio/smart-contract-sdks/sdk-worktrees/solana-source-fee-guard/src/actions/internal/preflightRelay.test.ts) | Tests for both reporting and policy rejection. |
| Read | [workers/relay-reference/gateway/src/providers/relay-link/prepare.ts](/Users/jin/rainbow_studio/smart-contract-sdks/sdk-worktrees/solana-source-fee-guard/workers/relay-reference/gateway/src/providers/relay-link/prepare.ts) | Server-side counterpart of the unsupported-gasless rejection; not deployed by this work. |
| Verify | [workers/relay-reference/gateway/test/relay-link-prepare.test.ts](/Users/jin/rainbow_studio/smart-contract-sdks/sdk-worktrees/solana-source-fee-guard/workers/relay-reference/gateway/test/relay-link-prepare.test.ts) | Worker policy regression fixtures; local tests do not demonstrate deployed worker behavior. |

## Coverage and limits

**77/77 mobile changed paths assigned; 5/5 SDK changed paths assigned in the appendix; 0 unchanged source anchors.** No renames or deletions in the mobile inventory. The older abstraction/reference branches are listed for orientation, not included as extra implementation diffs in these counts. Binary SDK internals and the entire lockfile were not audited; review their provenance/resolution rather than treating their inventory entry as an audit.

This is a human reading guide, not a correctness or security review. No broad tests were rerun for it, no branches were published, and no funded swaps were executed. Existing documentation records older live test receipts; those do not establish current service availability. Simulator visual checks for the latest fee/menu/button revisions remain incomplete. The latest focused footer suite passed 11 tests with lint and TypeScript, but that is narrower than the full pre-merge matrix.

**Next two-minute action:** open `SwapScreen` at the first link and trace the branch that chooses `SolanaSwapFlow` versus `EvmSwapScreen`. Then begin phase 1 when ready.

## Network assets branch

`jin/solana-network-assets` starts from a committed copy of the November 19 swap UI checkpoint. The original `jin/solana-swap-ui` worktree remains unchanged except for these review documents. Review the network-assets changes separately from the snapshot commit.
