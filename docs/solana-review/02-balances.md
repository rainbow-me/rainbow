# 2. Show Solana holdings in the wallet

Start at `src/features/solana/data/solanaBalancesStore.ts` (2 minutes): the enabled account mapping supplies the request address; mismatched cached addresses/currencies never reach the wallet.

Depends on wallet enablement only. No preview SDK, relay configuration, or swap execution is required. The wallet gains read-only Solana rows, backend metadata/prices, refresh behavior and the DES-190 network badge.

## Reading order (15–20 minutes)

1. `core/balances.ts` validates the backend response; read its parser tests and `fetchSolanaBalances` request tests.
2. `solanaBalancesStore.ts` gates requests, maps selection and currency, and suppresses stale account data; read its store tests.
3. `buildWalletSections.tsx` and the section/balance/refresh hooks append Solana data to existing wallet behavior. `buildWalletSections.solana.test.ts` covers section assembly.
4. Recycler view types/renderer/dimensions wire the row; `SolanaBalanceRow` uses metadata with failure fallback. `ChainImage` adds an optional bundled badge source with the same EVM layout; read both regression tests.
5. Check the two original DES-190 PNGs and constants against https://linear.app/rainbow/issue/DES-190/design-assets-for-solana-blockchain-support. Bundling is temporary until the network registry supports Solana.

Manual checks: switch enabled accounts/currencies, pull to refresh, toggle the flag off, compare EVM totals/rows, and inspect light/dark badges. Not run during this reorganization. Keeping Solana rows above Small Balances remains the approved internal-testing exception.

## Changed-file inventory

- `src/assets/networks/solana/badge@3x.png`
- `src/assets/networks/solana/icon@3x.png`
- `src/components/asset-list/RecyclerAssetList2/core/RowRenderer.tsx`
- `src/components/asset-list/RecyclerAssetList2/core/ViewDimensions.tsx`
- `src/components/asset-list/RecyclerAssetList2/core/ViewTypes.ts`
- `src/features/network/components/ChainImage.test.tsx`
- `src/features/network/components/ChainImage.tsx`
- `src/features/solana/constants/networkAssets.ts`
- `src/features/solana/core/balances.test.ts`
- `src/features/solana/core/balances.ts`
- `src/features/solana/data/fetchSolanaBalances.test.ts`
- `src/features/solana/data/fetchSolanaBalances.ts`
- `src/features/solana/data/solanaBalancesStore.test.ts`
- `src/features/solana/data/solanaBalancesStore.ts`
- `src/features/solana/ui/SolanaBalanceRow.test.tsx`
- `src/features/solana/ui/SolanaBalanceRow.tsx`
- `src/helpers/buildWalletSections.solana.test.ts`
- `src/helpers/buildWalletSections.tsx`
- `src/hooks/useLiveWalletBalance.ts`
- `src/hooks/useRefreshAccountData.ts`
- `src/hooks/useWalletSectionsData.ts`

This guide and its listed 21 implementation/configuration/test files define this layer.

## Current-develop compatibility

The newer HTTP client forwards cancellation through its own signal; tests now verify cancellation behavior rather than signal identity. Stores 0.13 rebuilds unlocked derived dependencies; the balances view has unconditional dependencies, so it locks them to retain the query subscription and avoid immediate refetch on failed refresh. The regression checks preserved data/error reporting and one new request per forced refresh.

Validation: 24 focused tests, TypeScript and dependency checks passed. Native rendering checks remain pending.
