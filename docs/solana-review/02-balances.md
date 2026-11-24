# 2. Show Solana holdings in the wallet

Start at `src/features/solana/data/solanaBalancesStore.ts` (2 minutes): the enabled account mapping supplies the request address; mismatched cached addresses/currencies never reach the wallet.

Depends on wallet enablement only. No preview SDK, relay configuration, or swap execution is required. The wallet gains Solana rows using the existing balance-row presentation and editing controls, backend metadata/prices, refresh behavior and the DES-190 network badge.

## Reading order (15–20 minutes)

1. `core/balances.ts` validates the backend response; read its parser tests and `fetchSolanaBalances` request tests.
2. `solanaBalancesStore.ts` gates requests, maps selection and currency, and suppresses stale account data; read its store tests.
3. `buildWalletSections.tsx` and the section/balance/refresh hooks append Solana data to existing wallet behavior. `buildWalletSections.solana.test.ts` covers section assembly.
4. `FastBalanceCoinRow` shares presentation and selection controls between EVM and Solana. Separate per-asset subscriptions feed the shared content; EVM still uses `useAccountAsset`. `RainbowCoinIcon` and `ChainImage` recognize the backend numeric Solana ID and preserve the bundled badge/direct image fallback.
5. Check the two original DES-190 PNGs and constants against https://linear.app/rainbow/issue/DES-190/design-assets-for-solana-blockchain-support. Bundling is temporary until the network registry supports Solana.

Manual checks: switch enabled accounts/currencies, pull to refresh, toggle the flag off, compare EVM totals/rows, and inspect light/dark badges. Not run during this reorganization. Solana holdings use the existing combined value ordering, currency threshold, five-row limit, Small Balances total, and expand/collapse behavior. Enter Edit and select, pin/unpin, and hide/unhide Solana alone and mixed with EVM tokens. Verify preferences survive an account switch and restart, and that hidden tokens reappear in Edit. Solana normal taps remain inactive until expanded-sheet support is added.

## Changed-file inventory

- `src/assets/networks/solana/badge@3x.png`
- `src/assets/networks/solana/icon@3x.png`
- `src/components/asset-list/RecyclerAssetList2/core/RowRenderer.tsx`
- `src/components/asset-list/RecyclerAssetList2/core/ViewDimensions.tsx`
- `src/components/asset-list/RecyclerAssetList2/core/ViewTypes.ts`
- `src/components/asset-list/RecyclerAssetList2/core/useMemoBriefSectionData.ts`
- `src/components/asset-list/RecyclerAssetList2/core/useMemoBriefSectionData.test.ts`
- `src/features/network/components/ChainImage.test.tsx`
- `src/features/network/components/ChainImage.tsx`
- `src/features/solana/constants/networkAssets.ts`
- `src/features/solana/core/balances.test.ts`
- `src/features/solana/core/balances.ts`
- `src/features/solana/data/fetchSolanaBalances.test.ts`
- `src/features/solana/data/fetchSolanaBalances.ts`
- `src/features/solana/data/solanaBalancesStore.test.ts`
- `src/features/solana/data/solanaBalancesStore.ts`
- `src/helpers/assets.ts`
- `src/helpers/buildWalletSections.solana.test.ts`
- `src/helpers/buildWalletSections.tsx`
- `src/hooks/useLiveWalletBalance.ts`
- `src/hooks/useRefreshAccountData.ts`
- `src/hooks/useWalletSectionsData.ts`

This guide and its listed implementation/configuration/test files define this layer.

## Current-develop compatibility

The newer HTTP client forwards cancellation through its own signal; tests now verify cancellation behavior rather than signal identity. Stores 0.13 rebuilds unlocked derived dependencies; the balances view has unconditional dependencies, so it locks them to retain the query subscription and avoid immediate refetch on failed refresh. The regression checks preserved data/query errors and one new request per forced refresh.

Validation: 25 focused tests, TypeScript and dependency checks passed. Native rendering checks remain pending.

Balance requests use the shared Solana feature gate regardless of store installation. The regression verifies an enabled store build can fetch and that disabling the flag blocks further requests and hides holdings.

Solana loading participates in the existing wallet asset-list skeleton behavior. There is no Solana-specific loading/error text row. Failed refreshes retain matching cached balances; request errors and pull-to-refresh retry remain available in the query layer.

Solana recycler items carry asset IDs, matching the EVM row contract. A derived store computes and retains the IDs and values needed for placement, preserving the array reference when those fields are equal. The list reads that cached array directly; memoized rows subscribe to their own flat balance record with shallow equality and receive currency from the existing recycler state. Equal values in fresh responses do not invalidate unrelated row subscriptions.

## Shared row and editing

`SOLANA_CHAIN_ID = 1399811149` matches [Rainbow's backend enum](https://github.com/rainbow-me/go-utils-lib/blob/162673da884f9008fbcb7e8f4bffffabb0e0cd16/pkg/enums/chain_id.go#L65-L66) and the [Codex convention](https://github.com/Codex-Data/sdk). It is a display/API compatibility ID, not an EIP-155 ID or Relay's execution chain ID. This PR does not add Solana to the EVM `ChainId` registry. Balance requests and asset identity continue to use CAIP IDs.

The shared row reads Solana metadata/prices from the balances store and uses the same existing live-text fallbacks as EVM. It does not start a new live-price subscription or send Solana row taps into the EVM expanded sheet. Row subscriptions remain per asset; unrelated Solana balances do not notify equal row selections.

Pin and hidden preferences reuse the existing per-EVM-account storage for the combined account. Hidden ID types now accept opaque strings, with the same persisted string-array format; no data migration is needed. Solana CAIP IDs preserve base58 casing, while EVM pin normalization stays unchanged. The user-assets store still fetches and values EVM holdings only; its hidden-balance subtotal remains EVM-only, matching the existing EVM wallet-switcher balance source.

Additional review files: `FastBalanceCoinRow.tsx` and tests, `FastFallbackCoinIconImage.tsx` and tests, `RainbowCoinIcon.tsx`, `core/chainId.ts`, `useCoinListEditOptions.ts` and tests, and `state/assets/{types,persistence,createUserAssetsStore,utils}.ts` with the persistence regression test. `SolanaBalanceRow` and its bespoke layout have been removed.

Shared-row validation: 99 tests across 12 files passed, including mixed-network editing, case-preserving persistence, icon fallback, recycler filtering, and EVM navigation. TypeScript, JavaScript type-baseline, and dependency checks passed. Native visual/gesture checks and expanded-sheet/backend request verification were not run.
