# 2. Show Solana holdings in the wallet

Start at `src/features/solana/data/solanaBalancesStore.ts` (2 minutes): the enabled account mapping supplies the request address; mismatched cached addresses/currencies never reach the wallet.

Depends on wallet enablement only. No preview SDK, relay configuration, or swap execution is required. The wallet gains Solana rows using the existing balance-row presentation and editing controls, backend metadata/prices, refresh behavior and the DES-190 network badge.

## Reading order (15–20 minutes)

1. `core/balances.ts` validates the backend response; read its parser tests and `fetchSolanaBalances` request tests.
2. `solanaBalancesStore.ts` gates requests, maps selection and currency, and suppresses stale account data; read its store tests.
3. `buildWalletSections.tsx` and the section/balance/refresh hooks append Solana data to existing wallet behavior. `buildWalletSections.solana.test.ts` covers section assembly.
4. `FastBalanceCoinRow` shares presentation and selection controls between EVM and Solana. Separate per-asset subscriptions feed the shared content; EVM still uses `useAccountAsset`. `RainbowCoinIcon` and `ChainImage` recognize the backend numeric Solana ID and preserve the bundled badge. Solana icons use the same image proxy and error fallback as EVM icons.
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

Solana recycler items carry asset IDs, matching the EVM row contract. The query transform indexes each fetched response as a `balances` map keyed by case-sensitive `uniqueId`, alongside an `orderedBalances` list of IDs and values for placement. Rows use map lookups. A derived store exposes the ordered list and preserves its array reference when those fields are equal. Unlike the EVM custom `setData` path, this keeps both structures in the query cache so account/currency switching retains the existing cache behavior. The list reads that cached array directly; memoized rows subscribe to their own flat balance record with shallow equality and receive currency from the existing recycler state. Equal values in fresh responses do not invalidate unrelated row subscriptions.

## Shared row and editing

`SOLANA_CHAIN_ID = 1399811149` matches [Rainbow's backend enum](https://github.com/rainbow-me/go-utils-lib/blob/162673da884f9008fbcb7e8f4bffffabb0e0cd16/pkg/enums/chain_id.go#L65-L66) and the [Codex convention](https://github.com/Codex-Data/sdk). It is a display/API compatibility ID, not an EIP-155 ID or Relay's execution chain ID. This PR does not add Solana to the EVM `ChainId` registry. Shared identifier and icon APIs use `SupportedChainId` (`ChainId | typeof SOLANA_CHAIN_ID`), defined once in `src/features/network/types/supportedChainId.ts`; existing EVM-only consumers retain `ChainId`. Balance requests retain CAIP IDs. Parsed holdings retain the backend `assetId` and add an `address_1399811149` `uniqueId` for rows and preferences.

The shared row reads Solana metadata/prices from the balances store and uses the same existing live-text fallbacks as EVM. It does not start a new live-price subscription or send Solana row taps into the EVM expanded sheet. Row subscriptions remain per asset; unrelated Solana balances do not notify equal row selections.

Pin and hidden preferences reuse the existing per-EVM-account storage for the combined account. Hidden preferences use `UniqueId` again: the existing EVM ID unioned with `SolanaAssetId` (`${SolanaAddress}_1399811149`). The persisted string-array format is unchanged. Pin/hidden preferences use only the current address-chain IDs. No compatibility conversion is needed: nobody saved Solana preferences on previous builds. Solana addresses retain base58 casing, while EVM pin normalization stays unchanged. The user-assets store still fetches and values EVM holdings only; its hidden-balance subtotal remains EVM-only, matching the existing EVM wallet-switcher balance source.

Additional review files: `FastBalanceCoinRow.tsx` and tests, `FastFallbackCoinIconImage.tsx` and tests, `RainbowCoinIcon.tsx`, `core/chainId.ts`, `useCoinListEditOptions.ts` and tests, and `state/assets/{types,persistence,createUserAssetsStore,utils}.ts` with the persistence regression test. `SolanaBalanceRow` and its bespoke layout have been removed.

Earlier shared-row validation: 99 tests across 12 files passed, including mixed-network editing, case-preserving persistence, icon fallback, recycler filtering, and EVM navigation. TypeScript, JavaScript type-baseline, and dependency checks passed. Native visual/gesture checks and expanded-sheet/backend request verification were not run.

## Identifier and lowercasing audit

The wallet list and row lookup now use `balance.uniqueId`; backend-facing swap matching still uses `balance.assetId`. Native SOL uses `So11111111111111111111111111111111111111111_1399811149`, and wrapped SOL uses `So11111111111111111111111111111111111111112_1399811149`. The parser rejects duplicate row IDs, including conflicting backend namespaces.

| Location                                                                                                                                                                                  | Finding and treatment                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hooks/useCoinListEditOptions.ts`: `addPinnedCoin`, `removePinnedCoin`                                                                                                                    | **Fixed active path:** preserve IDs ending in `_1399811149`; retain existing EVM lowercase behavior. Solana pin/unpin keeps address casing unchanged.                                                                                                                               |
| `utils/ethereumUtils.ts`: `getAsset`, `getAssetFromAllAssets`, `getAccountAsset`                                                                                                          | Lowercase the whole ID. These remain EVM-only lookups and are not used by the Solana row subscription. They must become chain-aware before reuse for Solana expanded sheets. `getAddressAndChainIdFromUniqueId` preserves casing but still advertises EVM-only address/chain types. |
| `state/assets/utils.ts`: `getFilteredUserAssetIds`; `state/assets/createUserAssetsStore.ts`: query normalization; `__swaps__/screens/Swap/resources/search/searchV2.ts`: address matching | Lowercase query/address comparisons or cache keys. Names/symbols can remain case-insensitive, but Solana address comparisons/cache keys must preserve case before these search paths ingest Solana. Current Solana balances and hardcoded swap choices bypass them.                 |
| `entities/assetId.ts`; `state/liveTokens` lookup; recycler row/filtering; hidden preference serialization                                                                                 | `getUniqueId` already preserves address casing and now accepts the numeric Solana ID. Row and live-text lookups are exact-key lookups. Hidden preferences preserve the complete ID; no new lowercase conversion was found on these paths.                                           |
| NFT helpers/stores and paired EVM wallet comparisons in Solana selection/signing                                                                                                          | Existing lowercase calls refer to NFT IDs or the paired EVM address, not Solana mints/public keys. Left unchanged.                                                                                                                                                                  |

This is an audit of ID creation, balance rows, preferences, and likely future EVM lookup/search reuse. It is not a claim that every legacy EVM path supports Solana merely because its numeric ID fits the shared `UniqueId` type. Expanded sheets, normal token search, EVM RPC/signers and network registry adoption remain separate work.

The identifier regressions cover native/wrapped SOL separation, duplicate row-ID rejection, and unchanged EVM pin normalization. Compatibility-only tests were removed; the existing ID-constructor test now lives in `src/entities/assetId.test.ts`. Native checks remain pending.

After removing unused compatibility conversion: 102 focused tests across 13 files, TypeScript, and dependency checks passed. Native testing was not repeated.

## Image proxy verification

On November 24, 2026, fresh balances returned SOL and BONK icon URLs hosted by `token-media.defined.fi`. Both signed 120px requests returned HTTP 200 (`image/png`) through `img.p.rainbow.me`. The legacy `rainbow.imgix.net` host returned HTTP 410 (`deleted_source`) for both. Icons follow the existing `image_cdn_enabled` remote-config selection; failed requests show the existing fallback, never a direct-origin retry. USDC was not present in the queried balance response.
