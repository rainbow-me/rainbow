# Solana review stack — November 20, 2026

Start here: [enableSolanaAccount.ts](https://github.com/rainbow-me/rainbow/blob/862aa83cc3a729b7ebfeb83a4ff55d96fffacbed/src/features/wallet/data/enableSolanaAccount.ts) — follow authentication through protected storage to the published address (2 minutes).

Five draft PRs separate wallet enablement, holdings and token editing, execution, shared UI refactoring, and feature wiring. Balances can be reviewed and merged before the preview SDK or swap UI. Existing production callers retain their wallet/keychain paths; shared rendering still needs EVM regression review.

The reviewed snapshot is `d0118d9c2b96f44b14662f3d416fad67b55211fc`, based on develop `38757729b3a451b84d0b77121e84661825530993`. Original working snapshot `01b8d6e6d0c7b5c48dbb6446f0afa2b02ce7aba9` and old branches remain preserved. This index is refreshed in a documentation-only commit above that snapshot; code links below are pinned to it. PR links and branch guides follow the current stack.

| Review order | Draft PR | Branch | Base | Guide / time |
| --- | --- | --- | --- | --- |
| 1. Wallet enablement | [#7959](https://github.com/rainbow-me/rainbow/pull/7959) | `jin/solana-review-1-wallet` | `develop` | [01-wallet](01-wallet.md), 20–30 min |
| 2. Balances, metadata and network badges | [#7960](https://github.com/rainbow-me/rainbow/pull/7960) | `jin/solana-review-2-balances` | `jin/solana-review-1-wallet` | [02-balances](02-balances.md), 15–20 min |
| 3. SDK execution | [#7961](https://github.com/rainbow-me/rainbow/pull/7961) | `jin/solana-review-3-execution` | `jin/solana-review-2-balances` | [03-execution](03-execution.md), 25–35 min |
| 4. Shared swap presentation | [#7962](https://github.com/rainbow-me/rainbow/pull/7962) | `jin/solana-review-4-presentation` | `jin/solana-review-3-execution` | [04-presentation](04-presentation.md), 20–30 min |
| 5. Solana swap flow | [#7963](https://github.com/rainbow-me/rainbow/pull/7963) | `jin/solana-review-5-swap-flow` | `jin/solana-review-4-presentation` | [05-swap-flow](05-swap-flow.md), 20–30 min |

`wallet identity → balances → execution → shared presentation → screen wiring` is the reading order, not a complete call graph. PR 4 does not semantically depend on the preview SDK; it is stacked there to keep a single review/merge sequence. PR 2 deliberately includes the small network badge changes alongside its first visible consumer.

## Review and merge procedure

1. Review one PR against its stated base. Start with the guide, then use GitHub Files changed. Do not review every branch against develop: that repeats earlier layers.
2. Resolve feedback at the lowest layer that owns it, then restack descendants and rerun the affected checks. Preserve the draft state until required native checks pass.
3. Merge in order. After each merge, rebase the next PR onto develop using its previous parent tip as the exclusion boundary, then restack its descendants. This matters after squash merges: merely retargeting can repeat already-merged commits. Verify each new diff before retargeting.
4. Keep broad unused wallet replacement types, general Solana token search, additional routes and backend deployment out of this stack. The source-fee guard remains a separate [SDK branch](https://github.com/rainbow-me/sdk/tree/jin/solana-source-fee-guard); no worker deployment occurred here.
5. Test the complete tip using the [swap matrix](../solana-swap-test-plan.md) and [results CSV](../solana-swap-test-results.csv). It covers nine normal-sheet pairs and SOL → Base USDC in Developer Settings. Prior simulator receipts do not prove this new stack.

## Verification and remaining gates

Existing internal accounts: after loading this build, select each mnemonic subaccount and press **Enable Solana for this account** again. This overwrites the previous Base64 key record with Base58 at the same keychain entry; the derived address and 32-byte signing seed stay the same. There is no automatic migration or legacy Base64 reader. Signing fails for accounts not yet re-enabled; older builds cannot read newly written Base58 records. No keychain entries were deleted.


Shared balance-row/editing update: 208 tests across 22 changed-stack test files passed after propagation; full-stack TypeScript and dependency checks passed. PR 2 also passed the JavaScript type-error baseline check. Native visual/gesture testing remains pending.

Earlier derivation, keychain and metadata updates: 356 tests across 28 files passed after restacking. Saving accepts a raw address and private-key bytes, adds Base58 encoding plus format/version metadata, and writes directly without checking for an existing record or reading back; reads still validate the key. Like the EVM save path, this relies on the shared setter, which does not surface a native `false` write result. Metadata reads/writes no longer validate the source wallet; the balances caller retains its wallet eligibility checks. Layer-specific counts below, except PR1, describe earlier validation runs.

| Scope | Evidence |
| --- | --- |
| PR 1 | 80 wallet/derivation/storage tests passed after the simplifications. TypeScript and dependency checks passed with the HDKey replacement. |
| PR 2 | 99 balances/shared-row/editing tests; TypeScript, JS type-baseline and dependency checks passed. |
| PR 3 | 158 wallet/balances/execution tests; TypeScript and dependency checks passed. |
| PR 4 | All 149 existing EVM swap tests passed before and after extraction; TypeScript/dependency checks passed. |
| Complete stack | 356 tests across 28 files; TypeScript passed on the latest restack; dependency checks passed with the persistence refactor. JS baseline (1,373 existing errors, no regressions) passed before the recent simplifications. Commit formatting/ESLint checks passed; copied wallet tests retain existing non-null-assertion warnings. |

Native startup and source identity were checked in the dedicated simulator after the initial reorganization; native gesture/visual regression coverage, physical-device authentication, release/store-build behavior and funded settlement remain pending. The flag-gate update passes the wallet/store-build regression cases; these simulate store detection and do not replace a signed-store-build test. Feature gating does not establish production safety: shared presentation changes affect EVM too. Solana-specific store-build exclusions have been removed. Store builds are controlled by remote `solana_enabled`; internal builds also honor the existing local Solana override. The default remains off; wallet eligibility, authentication, ownership checks and signing protections remain. No remote flag value was changed by this work. Enablement captures the source account once and completes for it even if selection changes; metadata publication and lookup do not revalidate the original account; stale mappings can remain after deletion. Transaction/signing selection checks remain, and balances eligibility is checked by its caller. The preview SDK tarball and patch are unchanged from the working stack; hardcoded token choices, public RPC and Cloudflare service configuration remain internal-MVP constraints. Runtime setup/results should be recorded separately from the code-review evidence.

Current-develop adaptations are limited to retaining develop's dependencies/dev settings, preserving its new swap route observer and memoization, forwarding HTTP cancellation through its new signal, and locking the unconditional derived balances dependencies to avoid repeated fetches on failure with stores 0.13. Legacy wallet types remain unchanged; only consumed additive records were brought over.

## Preserved work and deferred proposals

| Previous branch / artifact | Where it fits now |
| --- | --- |
| `jin/solana-internal-mvp` at `2ade52707` | Split between wallet PR 1 and execution PR 3; menu consumers join PR 5. |
| `jin/solana-balances-v2` at `f7c96d49e` | PR 2, before execution. |
| `jin/solana-swap-ui` at `7c570d519` | Shared presentation PR 4 and screen wiring PR 5; three duplicate developer buttons remain removed. |
| `jin/solana-network-assets` at `01b8d6e6d` | Badge assets join PR 2; swap consumers join PR 5. Frozen source for this reorganization. |
| Broader WalletDescriptor / source-material proposals and investigations | Preserved in the [old wallet types](https://github.com/rainbow-me/rainbow/blob/01b8d6e6d/src/features/wallet/types.ts) and [old docs](https://github.com/rainbow-me/rainbow/tree/01b8d6e6d/docs); not required by this MVP. |

## Complete reading inventory

Each changed file has one primary home below. A later layer touching it again is called out rather than assigning a second home. Source links pin the final reviewed code snapshot; each PR/guide above shows its intermediate version. Read behavior/contracts, verify tests and wiring, skim only generated lock output. The preview tarball is opaque rather than a source-review substitute.

### Phase 1 — Wallet enablement (20–30 minutes)

Start at [enableSolanaAccount.ts](https://github.com/rainbow-me/rainbow/blob/862aa83cc3a729b7ebfeb83a4ff55d96fffacbed/src/features/wallet/data/enableSolanaAccount.ts), then follow the [layer guide](01-wallet.md). This establishes wallet identity for every later layer.

| Depth | File / changed hunk | Check |
| --- | --- | --- |
| Read | [AGENTS.md](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/AGENTS.md) | Incremental integration and production-path scope constraints. |
| Verify | [docs/solana-review/01-wallet.md](https://github.com/rainbow-me/rainbow/blob/jin/solana-review-5-swap-flow/docs/solana-review/01-wallet.md) | Reading guide or manual-test evidence; keep unrun cases marked Not run. |
| Read | [package.json](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/package.json) | Read crypto dependencies here; revisit the separate preview SDK alias in PR 3. Revisited in PR 3. |
| Verify | [src/features/debug/screens/DevSection.tsx](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/debug/screens/DevSection.tsx) | Only the new gated menu import/mount is added; current develop cash controls are retained. |
| Verify | [src/features/solana/core/address.test.ts](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/solana/core/address.test.ts) | Validate raw Solana addresses and normalization at the boundary. Tests do not establish native/live-service behavior. |
| Read | [src/features/solana/core/address.ts](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/solana/core/address.ts) | Validate raw Solana addresses and normalization at the boundary. |
| Verify | [src/features/solana/core/derivation.test.ts](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/solana/core/derivation.test.ts) | Check BIP39 seed → HDKey hardened SLIP-0010 derivation, unchanged account path, and pinned key/address vectors. Tests do not establish native/live-service behavior. |
| Read | [src/features/solana/core/derivation.ts](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/solana/core/derivation.ts) | Check BIP39 seed → HDKey hardened SLIP-0010 derivation, unchanged account path, and pinned key/address vectors. |
| Read | [src/features/solana/ui/SolanaMvpMenu.tsx](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/solana/ui/SolanaMvpMenu.tsx) | PR 1 exposes enablement only; revisit in PR 5 for the one retained swap, balances and status. Revisited in PR 5. |
| Verify | [src/features/wallet/core/solanaAccount.test.ts](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/wallet/core/solanaAccount.test.ts) | Check Base58 decoding, 32-byte length and derived-address validation; record metadata is ignored and malformed input reaches the catch. Tests do not establish native/live-service behavior. |
| Read | [src/features/wallet/core/solanaAccount.ts](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/wallet/core/solanaAccount.ts) | Check Base58 decoding, 32-byte length and derived-address validation; record metadata is ignored and malformed input reaches the catch. |
| Read | [src/features/wallet/data/enableSolanaAccount.ts](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/wallet/data/enableSolanaAccount.ts) | Trace authentication, EVM ownership, derivation, write, then metadata publication. |
| Verify | [src/features/wallet/data/solanaKeychain.test.ts](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/wallet/data/solanaKeychain.test.ts) | Check separate raw-address key namespace, existing auth policy, direct writes and validated reads. Tests do not establish native/live-service behavior. |
| Read | [src/features/wallet/data/solanaKeychain.ts](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/wallet/data/solanaKeychain.ts) | Check separate raw-address key namespace, existing auth policy, direct writes and validated reads. |
| Verify | [src/features/wallet/data/solanaWallet.test.ts](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/wallet/data/solanaWallet.test.ts) | Read the failure, cancellation and success assertions beside the corresponding implementation. Tests do not establish native/live-service behavior. Revisited in PR 3. |
| Read | [src/features/wallet/data/stores/accountMetadataStore.ts](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/wallet/data/stores/accountMetadataStore.ts) | Read direct metadata lookup/publication by wallet ID/index; profile composition is not implemented here. |
| Read | [src/features/wallet/types.ts](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/wallet/types.ts) | Read additive account/key records; legacy types retain their contracts. Combined-profile types currently have no production consumer. |
| Skim | [yarn.lock](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/yarn.lock) | Verify only manifest-required resolution changes; revisit SDK additions in PR 3. Revisited in PR 3. |

**Checkpoint:** Can a mapping appear before ownership and protected storage are verified?

**Next:** [Balances, metadata and network badges](02-balances.md), which uses the contracts just reviewed.

### Phase 2 — Balances, metadata and network badges (15–20 minutes)

Start at [solanaBalancesStore.ts](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/features/solana/data/solanaBalancesStore.ts), then follow the [layer guide](02-balances.md). The previous layers establish the contracts consumed here.

| Depth | File / changed hunk | Check |
| --- | --- | --- |
| Verify | [docs/solana-review/02-balances.md](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/docs/solana-review/02-balances.md) | Reading guide or manual-test evidence; keep unrun cases marked Not run. |
| Verify | [src/assets/networks/solana/badge@3x.png](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/assets/networks/solana/badge@3x.png) | Original DES-190 artwork; compare icon/badge appearance in light and dark mode. |
| Verify | [src/assets/networks/solana/icon@3x.png](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/assets/networks/solana/icon@3x.png) | Original DES-190 artwork; compare icon/badge appearance in light and dark mode. |
| Verify | [src/components/asset-list/RecyclerAssetList2/core/RowRenderer.tsx](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/components/asset-list/RecyclerAssetList2/core/RowRenderer.tsx) | Check the new row type, renderer and height agree; EVM cases remain intact. |
| Verify | [src/components/asset-list/RecyclerAssetList2/core/ViewDimensions.tsx](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/components/asset-list/RecyclerAssetList2/core/ViewDimensions.tsx) | Check the new row type, renderer and height agree; EVM cases remain intact. |
| Verify | [src/components/asset-list/RecyclerAssetList2/core/ViewTypes.ts](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/components/asset-list/RecyclerAssetList2/core/ViewTypes.ts) | Check the new row type, renderer and height agree; EVM cases remain intact. |
| Verify | [src/features/network/components/ChainImage.test.tsx](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/features/network/components/ChainImage.test.tsx) | Check optional image source retains EVM dimensions and default behavior. Tests do not establish native/live-service behavior. |
| Read | [src/features/network/components/ChainImage.tsx](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/features/network/components/ChainImage.tsx) | Check optional image source retains EVM dimensions and default behavior. |
| Read | [src/features/solana/constants/networkAssets.ts](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/features/solana/constants/networkAssets.ts) | Verify the bundled DES-190 icon/badge mapping. |
| Verify | [src/features/solana/core/balances.test.ts](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/features/solana/core/balances.test.ts) | Validate quantities, metadata, prices and native/SPL identity. Tests do not establish native/live-service behavior. |
| Read | [src/features/solana/core/balances.ts](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/features/solana/core/balances.ts) | Validate quantities, metadata, prices and native/SPL identity. |
| Verify | [src/features/solana/data/fetchSolanaBalances.test.ts](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/features/solana/data/fetchSolanaBalances.test.ts) | Verify request parameters and cancellation. Tests do not establish native/live-service behavior. |
| Read | [src/features/solana/data/fetchSolanaBalances.ts](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/features/solana/data/fetchSolanaBalances.ts) | Verify request parameters and cancellation. |
| Verify | [src/features/solana/data/solanaBalancesStore.test.ts](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/features/solana/data/solanaBalancesStore.test.ts) | Read flag/account/currency gates and stable query subscription on failed refresh. Tests do not establish native/live-service behavior. |
| Read | [src/features/solana/data/solanaBalancesStore.ts](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/features/solana/data/solanaBalancesStore.ts) | Read flag/account/currency gates and stable query subscription on failed refresh. |
| Verify | [src/helpers/buildWalletSections.solana.test.ts](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/helpers/buildWalletSections.solana.test.ts) | Read the failure, cancellation and success assertions beside the corresponding implementation. Tests do not establish native/live-service behavior. |
| Read | [src/helpers/buildWalletSections.tsx](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/helpers/buildWalletSections.tsx) | Verify combined EVM/Solana value ordering and shared Small Balances rules. |
| Read | [src/hooks/useLiveWalletBalance.ts](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/hooks/useLiveWalletBalance.ts) | Verify Solana total aggregation without altering EVM valuation. |
| Read | [src/hooks/useRefreshAccountData.ts](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/hooks/useRefreshAccountData.ts) | Verify refresh fan-out includes Solana. |
| Read | [src/hooks/useWalletSectionsData.ts](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/hooks/useWalletSectionsData.ts) | Check derived balance inputs and row/total integration. |
| Read | [AGENTS.md](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/AGENTS.md) | Keep Solana flag-gated; scope list/row subscriptions to minimize rerenders. |
| Verify | [src/components/asset-list/RecyclerAssetList2/FastComponents/FastBalanceCoinRow.test.tsx](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/components/asset-list/RecyclerAssetList2/FastComponents/FastBalanceCoinRow.test.tsx) | Shared layout and edit controls; separate per-token EVM/Solana subscriptions. Solana normal taps remain inactive. |
| Read | [src/components/asset-list/RecyclerAssetList2/FastComponents/FastBalanceCoinRow.tsx](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/components/asset-list/RecyclerAssetList2/FastComponents/FastBalanceCoinRow.tsx) | Shared layout and edit controls; separate per-token EVM/Solana subscriptions. Solana normal taps remain inactive. |
| Verify | [src/components/asset-list/RecyclerAssetList2/FastComponents/FastFallbackCoinIconImage.test.tsx](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/components/asset-list/RecyclerAssetList2/FastComponents/FastFallbackCoinIconImage.test.tsx) | Preserve EVM proxy loading and Solana direct loading with error fallback. |
| Read | [src/components/asset-list/RecyclerAssetList2/FastComponents/FastFallbackCoinIconImage.tsx](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/components/asset-list/RecyclerAssetList2/FastComponents/FastFallbackCoinIconImage.tsx) | Preserve EVM proxy loading and Solana direct loading with error fallback. |
| Read | [src/components/asset-list/RecyclerAssetList2/core/RawRecyclerList.tsx](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/components/asset-list/RecyclerAssetList2/core/RawRecyclerList.tsx) | Verify shared EVM/Solana ordering, edit-mode inclusion and hidden-row filtering. |
| Verify | [src/components/asset-list/RecyclerAssetList2/core/useMemoBriefSectionData.test.ts](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/components/asset-list/RecyclerAssetList2/core/useMemoBriefSectionData.test.ts) | Verify shared EVM/Solana ordering, edit-mode inclusion and hidden-row filtering. |
| Read | [src/components/asset-list/RecyclerAssetList2/core/useMemoBriefSectionData.ts](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/components/asset-list/RecyclerAssetList2/core/useMemoBriefSectionData.ts) | Verify shared EVM/Solana ordering, edit-mode inclusion and hidden-row filtering. |
| Read | [src/components/coin-icon/RainbowCoinIcon.tsx](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/components/coin-icon/RainbowCoinIcon.tsx) | Use numeric Solana chain ID for the shared icon and badge. |
| Read | [src/features/solana/core/chainId.ts](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/features/solana/core/chainId.ts) | Confirm 1399811149 matches the backend/Codex mapping; do not register it as EVM. |
| Read | [src/helpers/assets.ts](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/helpers/assets.ts) | Verify shared EVM/Solana ordering, edit-mode inclusion and hidden-row filtering. |
| Verify | [src/hooks/useCoinListEditOptions.test.ts](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/hooks/useCoinListEditOptions.test.ts) | Mixed-network selection, pin/hide actions and case-sensitive Solana IDs; account-scoped preferences. |
| Read | [src/hooks/useCoinListEditOptions.ts](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/hooks/useCoinListEditOptions.ts) | Mixed-network selection, pin/hide actions and case-sensitive Solana IDs; account-scoped preferences. |
| Read | [src/state/assets/createUserAssetsStore.ts](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/state/assets/createUserAssetsStore.ts) | Hidden preference IDs accept opaque strings; storage format and EVM asset fetching remain unchanged. |
| Verify | [src/state/assets/persistence.test.ts](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/state/assets/persistence.test.ts) | Hidden preference IDs accept opaque strings; storage format and EVM asset fetching remain unchanged. |
| Read | [src/state/assets/persistence.ts](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/state/assets/persistence.ts) | Hidden preference IDs accept opaque strings; storage format and EVM asset fetching remain unchanged. |
| Read | [src/state/assets/types.ts](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/state/assets/types.ts) | Hidden preference IDs accept opaque strings; storage format and EVM asset fetching remain unchanged. |
| Read | [src/state/assets/utils.ts](https://github.com/rainbow-me/rainbow/blob/d27dc3ec1387eeffcb25080df38084114813dac9/src/state/assets/utils.ts) | Hidden preference IDs accept opaque strings; storage format and EVM asset fetching remain unchanged. |

**Checkpoint:** Can stale data from a different account or currency reach wallet rows?

**Next:** [SDK execution](03-execution.md), which uses the contracts just reviewed.

### Phase 3 — SDK execution (25–35 minutes)

Start at [mvpTrades.ts](https://github.com/rainbow-me/rainbow/blob/92187208a2d64678006fdcb6053b1f97c9e51bd2/src/features/solana/data/mvpTrades.ts), then follow the [layer guide](03-execution.md). The previous layers establish the contracts consumed here.

| Depth | File / changed hunk | Check |
| --- | --- | --- |
| Verify | [docs/solana-review/03-execution.md](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/docs/solana-review/03-execution.md) | Reading guide or manual-test evidence; keep unrun cases marked Not run. |
| Read | [metro.config.js](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/metro.config.js) | Verify the added mjs extension needed by the preview package. |
| Read | [patches/@rainbow-me+solana-sdk+0.5.0.patch](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/patches/@rainbow-me+solana-sdk+0.5.0.patch) | Review the preview source-fee guard and confirm package patch application. |
| Verify | [rainbow-me-sdk-solana-mvp-0.5.0.tgz](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/rainbow-me-sdk-solana-mvp-0.5.0.tgz) | Opaque preview build: byte-identical to the preserved stack; source counterpart linked below. |
| Verify | [src/features/solana/core/mvpRoutes.test.ts](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/solana/core/mvpRoutes.test.ts) | Check fixed developer route amounts, chains and token mints. Tests do not establish native/live-service behavior. |
| Read | [src/features/solana/core/mvpRoutes.ts](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/solana/core/mvpRoutes.ts) | Check fixed developer route amounts, chains and token mints. |
| Verify | [src/features/solana/core/swap.test.ts](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/solana/core/swap.test.ts) | Check amount precision, quote expiry, SOL reserve and allowed pairs. Tests do not establish native/live-service behavior. |
| Read | [src/features/solana/core/swap.ts](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/solana/core/swap.ts) | Check amount precision, quote expiry, SOL reserve and allowed pairs. |
| Verify | [src/features/solana/data/mvpSdk.test.ts](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/solana/data/mvpSdk.test.ts) | Check separate SDK cache/config and prepared-message fee estimation. Tests do not establish native/live-service behavior. |
| Read | [src/features/solana/data/mvpSdk.ts](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/solana/data/mvpSdk.ts) | Check separate SDK cache/config and prepared-message fee estimation. |
| Verify | [src/features/solana/data/mvpTrades.test.ts](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/solana/data/mvpTrades.test.ts) | Trace quote, funds, sponsorship, exact submission, fees and persisted uncertain outcomes. Tests do not establish native/live-service behavior. |
| Read | [src/features/solana/data/mvpTrades.ts](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/solana/data/mvpTrades.ts) | Trace quote, funds, sponsorship, exact submission, fees and persisted uncertain outcomes. |
| Read | [src/features/solana/data/swapTypes.ts](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/solana/data/swapTypes.ts) | Read the input/output asset contracts before execution and UI consumers. |
| Read | [src/features/wallet/data/loadSolanaSigner.ts](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/wallet/data/loadSolanaSigner.ts) | Check selected-account validation and limited signer lifetime. |

**Checkpoint:** Does uncertain submission retain its execution ID instead of allowing a blind retry?

**Next:** [Shared swap presentation](04-presentation.md), which uses the contracts just reviewed.

### Phase 4 — Shared swap presentation (20–30 minutes)

Start at [CoinRow.tsx](https://github.com/rainbow-me/rainbow/blob/44b07de05e37a88e189d80d4fe107f30bd7e15f0/src/__swaps__/screens/Swap/components/CoinRow.tsx), then follow the [layer guide](04-presentation.md). The previous layers establish the contracts consumed here.

| Depth | File / changed hunk | Check |
| --- | --- | --- |
| Verify | [docs/solana-review/04-presentation.md](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/docs/solana-review/04-presentation.md) | Reading guide or manual-test evidence; keep unrun cases marked Not run. |
| Read | [src/__swaps__/screens/Swap/components/CoinRow.tsx](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/__swaps__/screens/Swap/components/CoinRow.tsx) | Compare the extracted presentation with its EVM adapter; verify state, handlers, defaults and worklet boundaries. |
| Read | [src/__swaps__/screens/Swap/components/GasButton.tsx](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/__swaps__/screens/Swap/components/GasButton.tsx) | Compare the extracted presentation with its EVM adapter; verify state, handlers, defaults and worklet boundaries. |
| Read | [src/__swaps__/screens/Swap/components/SwapActionButton.tsx](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/__swaps__/screens/Swap/components/SwapActionButton.tsx) | Compare the extracted presentation with its EVM adapter; verify state, handlers, defaults and worklet boundaries. |
| Read | [src/__swaps__/screens/Swap/components/SwapAssetFields.tsx](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/__swaps__/screens/Swap/components/SwapAssetFields.tsx) | Compare the extracted presentation with its EVM adapter; verify state, handlers, defaults and worklet boundaries. |
| Read | [src/__swaps__/screens/Swap/components/SwapCoinIconTextFallback.tsx](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/__swaps__/screens/Swap/components/SwapCoinIconTextFallback.tsx) | Compare the extracted presentation with its EVM adapter; verify state, handlers, defaults and worklet boundaries. |
| Read | [src/__swaps__/screens/Swap/components/SwapInput.tsx](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/__swaps__/screens/Swap/components/SwapInput.tsx) | Compare the extracted presentation with its EVM adapter; verify state, handlers, defaults and worklet boundaries. |
| Read | [src/__swaps__/screens/Swap/components/SwapInputAsset.tsx](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/__swaps__/screens/Swap/components/SwapInputAsset.tsx) | Compare the extracted presentation with its EVM adapter; verify state, handlers, defaults and worklet boundaries. |
| Read | [src/__swaps__/screens/Swap/components/SwapNavbar.tsx](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/__swaps__/screens/Swap/components/SwapNavbar.tsx) | Compare the extracted presentation with its EVM adapter; verify state, handlers, defaults and worklet boundaries. |
| Read | [src/__swaps__/screens/Swap/components/SwapNumberPad.tsx](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/__swaps__/screens/Swap/components/SwapNumberPad.tsx) | Compare the extracted presentation with its EVM adapter; verify state, handlers, defaults and worklet boundaries. |
| Read | [src/__swaps__/screens/Swap/components/SwapOutputAsset.tsx](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/__swaps__/screens/Swap/components/SwapOutputAsset.tsx) | Compare the extracted presentation with its EVM adapter; verify state, handlers, defaults and worklet boundaries. |
| Read | [src/__swaps__/screens/Swap/components/SwapSlider.tsx](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/__swaps__/screens/Swap/components/SwapSlider.tsx) | Compare the extracted presentation with its EVM adapter; verify state, handlers, defaults and worklet boundaries. |
| Read | [src/__swaps__/screens/Swap/components/SwapWarning.tsx](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/__swaps__/screens/Swap/components/SwapWarning.tsx) | Compare the extracted presentation with its EVM adapter; verify state, handlers, defaults and worklet boundaries. |
| Read | [src/__swaps__/screens/Swap/hooks/useSwapInputStyles.ts](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/__swaps__/screens/Swap/hooks/useSwapInputStyles.ts) | Compare the extracted presentation with its EVM adapter; verify state, handlers, defaults and worklet boundaries. |

**Checkpoint:** Do EVM adapters still pass identical state/actions into the extracted views?

**Next:** [Solana swap flow](05-swap-flow.md), which uses the contracts just reviewed.

### Phase 5 — Solana swap flow (20–30 minutes)

Start at [Swap.tsx](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/__swaps__/screens/Swap/Swap.tsx), then follow the [layer guide](05-swap-flow.md). The previous layers establish the contracts consumed here.

| Depth | File / changed hunk | Check |
| --- | --- | --- |
| Verify | [docs/solana-review/05-swap-flow.md](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/docs/solana-review/05-swap-flow.md) | Reading guide or manual-test evidence; keep unrun cases marked Not run. |
| Verify | [docs/solana-review/README.md](README.md) | Reading guide or manual-test evidence; keep unrun cases marked Not run. |
| Verify | [docs/solana-swap-test-plan.md](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/docs/solana-swap-test-plan.md) | Reading guide or manual-test evidence; keep unrun cases marked Not run. |
| Verify | [docs/solana-swap-test-results.csv](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/docs/solana-swap-test-results.csv) | Reading guide or manual-test evidence; keep unrun cases marked Not run. |
| Read | [src/__swaps__/screens/Swap/Swap.tsx](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/__swaps__/screens/Swap/Swap.tsx) | Read the route wrapper; current EVM observer/provider tree and memoization remain. |
| Read | [src/__swaps__/screens/Swap/components/TokenList/TokenToBuyList.tsx](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/__swaps__/screens/Swap/components/TokenList/TokenToBuyList.tsx) | Verify optional Solana list header, account gate and layout handling preserve current EVM search. |
| Read | [src/__swaps__/screens/Swap/components/TokenList/TokenToSellList.tsx](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/__swaps__/screens/Swap/components/TokenList/TokenToSellList.tsx) | Verify optional Solana list header, account gate and layout handling preserve current EVM search. |
| Verify | [src/features/solana/data/swapSelection.test.ts](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/solana/data/swapSelection.test.ts) | Read enabled account identity, initial selection and reset contract. Tests do not establish native/live-service behavior. |
| Read | [src/features/solana/data/swapSelection.ts](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/solana/data/swapSelection.ts) | Read enabled account identity, initial selection and reset contract. |
| Read | [src/features/solana/ui/SolanaSwapControls.tsx](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/solana/ui/SolanaSwapControls.tsx) | Verify shared keypad/slider/action/fee views receive correct Solana state. |
| Verify | [src/features/solana/ui/SolanaSwapFlow.test.tsx](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/solana/ui/SolanaSwapFlow.test.tsx) | Trace amount changes → quote → review → signing → status/refresh; check cancellation races. Tests do not establish native/live-service behavior. |
| Read | [src/features/solana/ui/SolanaSwapFlow.tsx](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/solana/ui/SolanaSwapFlow.tsx) | Trace amount changes → quote → review → signing → status/refresh; check cancellation races. |
| Read | [src/features/solana/ui/SolanaSwapOptions.tsx](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/solana/ui/SolanaSwapOptions.tsx) | Check feature/account/query gates and hardcoded SOL/USDC/BONK choices. |
| Verify | [src/features/solana/ui/SolanaSwapTokenRow.test.tsx](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/solana/ui/SolanaSwapTokenRow.test.tsx) | Verify shared row, badge, balance and mint-info behavior. Tests do not establish native/live-service behavior. |
| Read | [src/features/solana/ui/SolanaSwapTokenRow.tsx](https://github.com/rainbow-me/rainbow/blob/d0118d9c2b96f44b14662f3d416fad67b55211fc/src/features/solana/ui/SolanaSwapTokenRow.tsx) | Verify shared row, badge, balance and mint-info behavior. |

**Checkpoint:** Can a stale quote or a changed wallet reach signing?

**Next:** [Manual test matrix](../solana-swap-test-plan.md); begin with unsigned EVM and account/feature-gate checks.

The original stack inventory is extended above with the shared-row/editing files in PR 2; the per-layer guides and current GitHub diffs are authoritative. Deleted Solana-specific row files are replaced by the shared `FastBalanceCoinRow` implementation and regression tests.

Next two-minute action: open PR #7959 and read the enableSolanaAccount function.
