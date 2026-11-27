# 5. Use the normal swap screen for Solana

[PR #7963](https://github.com/rainbow-me/rainbow/pull/7963), based on PR #7962. Start at `src/__swaps__/screens/Swap/Swap.tsx`: an enabled Solana selection chooses SolanaSwapFlow; EVM retains its existing screen and provider tree.

Inputs are Base ETH and owned Solana tokens returned by search. Outputs are searchable Solana tokens. SOL, USDC and BONK remain the empty-query defaults; they are no longer a trading allowlist. Developer Settings retains enablement, balances/status and the exclusive SOL → Base USDC test route.

## Reading order (20–30 minutes)

1. `features/token-search/data/tokenSearch.ts` and `features/solana/core/tokenSearch.ts`: shared endpoint CAIP-2 parameters, mainnet mint parsing, decimals, native SOL versus WSOL, verification and duplicate filtering. Existing EVM parameters remain unchanged.
2. `features/solana/data/solanaTokenSearchStore.ts`, `ui/useSolanaSwapOptions.ts` and `ui/SolanaSwapOptions.tsx`: feature/account gating, separate input/output queries and held-token input filtering. EVM input search lowercases text, so Solana retains its own original input query.
3. `features/solana/ui/SolanaSwapTokenPicker.tsx`, `SolanaSwapTokenRow.tsx` and `SolanaSwapControls.tsx`: reuse the shared search field, coin row, amount controls and proxied icon component. Solana-enabled Paste accepts 44 characters; the existing EVM default remains 42.
4. `features/solana/core/swap.ts`, `data/swapSelection.ts`, `data/swapTypes.ts` and `data/mvpTrades.ts`: selected asset descriptors carry exact mint/decimals through amounts, balances, quote validation and existing SDK execution. Check source-wallet fees, required provider sponsorship and exact reviewed output identity.
5. `features/solana/ui/SolanaSwapFlow.tsx` and adjacent tests: selection, stale-quote cancellation, review/signing, pending-status recovery and balance refresh. Follow the [manual test matrix](../solana-swap-test-plan.md) for native and settlement checks.

Paths above are relative to `src/`. Shared search-field changes are in `src/components/token-search/{SearchInput,SearchInputButton}.tsx` and the swap adapter `src/__swaps__/screens/Swap/components/SearchInput.tsx`. Tests sit beside changed modules, including clipboard-length and arbitrary-token SDK execution coverage.

## Backend contract

[Kamil’s search update](https://rainbowhaus.slack.com/archives/C0B550KTXJT/p1795780678285899) specifies `chainIds=solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp`, with mixed EVM/Solana CAIP-2 filters supported by the same endpoint. Live read-only requests confirmed name/symbol results, mixed-chain responses and Solana metadata. Empty queries returned no results, so the default list stays local.

The Solana UI makes a Solana-filtered request through the shared client; EVM keeps its existing request/parser. Native SOL uses `/native:So11111111111111111111111111111111111111111`; SPL tokens use `/token:<mint>`. WSOL is a separate token. Mint casing is preserved. Unverified tokens may appear; scam/high-risk results are excluded. Search discovery does not guarantee a provider quote, liquidity or token-program support.

## Verification and limits

The search update passes 253 tests across 21 files, including existing EVM search coverage, arbitrary token selection/amounts, quote identity and mocked SDK buy/sell execution. Full TypeScript and dependency checks pass. Live endpoint requests were read-only. Native layout/keyboard/gestures, physical-device authentication and funded swaps have not been rerun for this update.

The preview SDK, public RPC, Cloudflare service configuration, separate Solana controller and existing review block remain MVP constraints. Token favorites and expanded sheets are not added here. The feature flag does not by itself prove production safety; shared presentation also affects EVM.

Store builds use remote `solana_enabled`; internal builds also honor the existing local override. No remote configuration values changed. Existing internal accounts using old Base64 key records must be re-enabled before signing; current storage uses Base58 without a legacy migration.
