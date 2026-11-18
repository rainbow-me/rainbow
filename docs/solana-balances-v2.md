# Solana balances on the wallet screen

Branch: `jin/solana-balances-v2`, based on `jin/solana-internal-mvp` at `2ade52707`.

## Scope

Show Solana holdings alongside EVM tokens for the selected account, using its existing enabled Solana address. The existing EVM balance fetcher, keychain, wallet store, and asset actions retain their paths. The new read-only rows do not open the EVM asset sheet or participate in pin/hide editing. The wallet header adds known Solana valuations. Missing valuations display as formatted zero, matching the existing EVM rows.

This milestone uses the existing Solana flag and requires a non-store build, an enabled mnemonic subaccount, a ready/non-damaged wallet, and mainnet mode. Disabling the flag, changing the account/currency, or removing its mapping immediately excludes incompatible data. No new environment variables or private-key access are needed.

## Backend contract

- `POST ${PLATFORM_BASE_URL}/v2/balances/GetBalances`, authenticated using the existing platform API key. The existing v1 client is unchanged.
- Send one CAIP-10 Solana mainnet account and the selected display currency. Keep the stored wallet address raw; preserve its case. No EVM accounts are requested, avoiding duplicate EVM balances.
- Parse only consumed fields: `metadata.success/currency`, `result.balances`, `result.failedQueries`, `errors`, and each balance's `accountId`, `quantity`, `value`, and asset identity/decimals/labels/price.
- Quantities are integer base units. Failed queries mean unknown, not empty; a successful full response with no balances means empty. Do not use incremental `sinceTimestamp` in this milestone.
- Kamil expects the experimental asset shape to change. Keep the wire schema in `core/balances.ts` and translate into the small wallet-row model there.

References: [Kamil's contract warning](https://rainbowhaus.slack.com/archives/C0B550KTXJT/p1793714597491979), [November 12 availability](https://rainbowhaus.slack.com/archives/C0B550KTXJT/p1794502281012629), [current gateway balance schema](https://github.com/rainbow-me/protobuf-registry/blob/main/schemas/gateways/v2/external/balance/balance.proto).

## Live response and fallbacks

November 17: an authenticated read against the existing configured origin, `https://platform.p.rainbow.me`, returned HTTP 200 for the MVP test account. It returned 3,676,013 lamports and 179,207 USDC base units (0.003676013 SOL and 0.179207 USDC). Both assets lacked names and prices; SOL also omitted decimals.

SOL uses its known 9 decimals. USDC and BONK have basic name/symbol fallbacks by mint. Other missing labels use a shortened mint. Unknown token decimals are displayed explicitly as base units instead of guessing. A zero `value` without a price remains unavailable internally, but displays as formatted zero (for example, `$0.00`), matching existing EVM presentation. There is no missing-price notice. Only available valuations contribute to the total. Unknown prices are not inferred from token symbols or stablecoin pegs.

## Lifecycle and integration points

1. `data/fetchSolanaBalances.ts` owns the isolated v2 request; `core/balances.ts` validates identities, numeric values and currency and normalizes the response.
2. `data/solanaBalancesStore.ts` uses the existing public account mapping and a query store keyed by raw Solana address and currency. It retains same-account data on a failed refresh, rejects stale data from another account/currency, and polls while subscribed every 30 seconds. The cache is memory-only.
3. `useWalletSectionsData` / `buildWalletSections` insert separate Solana rows before the small-balances divider, including when there are no EVM assets. Keeping these rows above small balances is an explicitly approved internal-testing exception; use normal placement before rollout. Reuse EVM patterns elsewhere unless a Solana-specific difference is explicitly agreed. `ui/SolanaBalanceRow.tsx` owns their read-only rendering and status message.
4. `useLiveWalletBalance` adds known Solana valuations to the existing total. Pull-to-refresh calls the new query; a confirmed MVP execution also triggers a refresh. Existing EVM swap/signing preparation still uses its current sources.
5. Wallet switches, disabled flags, testnet mode, missing mappings, failed requests and currency switches have explicit gating/validation. Expanded sheets, arbitrary asset actions, and wallet-switcher summary totals are deferred.

## Verification

Focused tests exercise the live response shape, numeric precision, missing metadata, failed/empty responses, identity/currency checks, account changes during requests, flag-off/store-build gating, HTTP request shape, and wallet-list composition. Run `yarn test src/features/solana/core/balances.test.ts src/features/solana/data/fetchSolanaBalances.test.ts src/features/solana/data/solanaBalancesStore.test.ts src/helpers/buildWalletSections.solana.test.ts`.

Verified November 17: 130 tests across 13 suites pass, including the existing Solana MVP and EVM keychain tests. TypeScript and changed-file ESLint pass (three existing default-export warnings); dependency rules and cycle baselines pass. Metro 8093 serves the new modules. After the user scrolled the dedicated Rainbow Solana MVP simulator, visual inspection confirmed 0.003676013 SOL and 0.179207 USDC beside EVM tokens, without layout overlap. The initial “Price unavailable” wording was subsequently replaced with the existing formatted-zero pattern at the user’s request. The live backend supplies no prices for these holdings, so priced-total behavior is covered by tests, not this live response. Release/native device validation and a funded swap are not part of this read-only milestone.

## November 18: prices and metadata

[Kamil’s update](https://rainbowhaus.slack.com/archives/C0B550KTXJT/p1795021859261239) confirms the v2 endpoint now enriches Solana assets using Codex. A live authenticated response returned names, symbols, decimals, `iconUrl`, `price.value`, `price.relativeChange24h`, and nonzero balance valuations for SOL and BONK. Existing parsing already consumes names, decimals and valuations; this change passes icons and 24-hour price changes through to wallet rows.

Rows reuse the existing FasterImage library/configuration and EVM percentage formatting/color conventions. Codex icon URLs load directly: the original URL returned HTTP 200 in verification, while the existing image proxy returned HTTP 410. The letter fallback remains for absent or failed icons; EVM image handling is unchanged. Missing metadata retains the existing fallback; prices are never inferred from token symbols. No new network badges or token-detail actions are added. Rows remain above Small Balances for internal testing. The wallet total automatically includes the returned valuations through the existing balances integration.

Backend limitations: only Codex-flagged spam is filtered; there is no additional Solana ingestion/spam verification yet. Icon source URLs point to Codex’s `token-media.defined.fi`, not Cloudinary. The app does not treat missing `verified` metadata as spam or add an independent filter.

Metadata verification: 20 focused tests pass, including direct icon loading and missing/failed-icon fallback. TypeScript and changed-file ESLint pass. The live endpoint returns priced SOL/BONK balances, and the Codex BONK icon returns HTTP 200. Visual inspection of the lower wallet rows remains pending because simulator scroll automation did not move the list.
