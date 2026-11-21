# 5. Use the normal swap screen for Solana

Start at `src/__swaps__/screens/Swap/Swap.tsx` (2 minutes): the selected, enabled Solana route chooses SolanaSwapFlow; the existing EVM screen remains its own path.

Depends on paired wallet identity, balances, SDK execution and the shared presentation views. The final behavior matches the preserved working stack: Base ETH plus SOL/USDC/BONK inputs; SOL/USDC/BONK outputs; source-wallet fees and sponsored fee display; refresh after execution. It retains the current internal-MVP limitations rather than adding routes or new presentation.

## Reading order (20–30 minutes)

1. Swap entry, TokenToBuyList/TokenToSellList, selection store and options: verify feature/account gates and reset selection across wallets.
2. SolanaSwapFlow: trace amount changes, quote cancellation/expiry, review locking, exact submission and pending-status recovery. Read the flow tests beside it.
3. SolanaSwapControls/TokenRow: verify shared presentation and EVM controls, token/mint information, fee state, and original network assets. Read token-row tests.
4. Developer menu: Enable Solana, balance refresh, execution checks and SOL → Base USDC remain. The three duplicate developer swaps stay removed.
5. Run `docs/solana-swap-test-plan.md` and record receipts in its CSV. No funded swaps or simulator visual validation were performed during this reorganization.

The current preview SDK, hardcoded asset options, separate controller and review detail block are retained MVP choices. This stack does not claim that a feature flag alone proves production safety.

## Changed-file inventory

- `docs/solana-swap-test-plan.md`
- `docs/solana-swap-test-results.csv`
- `src/__swaps__/screens/Swap/Swap.tsx`
- `src/__swaps__/screens/Swap/components/TokenList/TokenToBuyList.tsx`
- `src/__swaps__/screens/Swap/components/TokenList/TokenToSellList.tsx`
- `src/features/solana/data/swapSelection.test.ts`
- `src/features/solana/data/swapSelection.ts`
- `src/features/solana/ui/SolanaMvpMenu.tsx`
- `src/features/solana/ui/SolanaSwapControls.tsx`
- `src/features/solana/ui/SolanaSwapFlow.test.tsx`
- `src/features/solana/ui/SolanaSwapFlow.tsx`
- `src/features/solana/ui/SolanaSwapOptions.tsx`
- `src/features/solana/ui/SolanaSwapTokenRow.test.tsx`
- `src/features/solana/ui/SolanaSwapTokenRow.tsx`

This guide and its listed 14 implementation/configuration/test files define this layer.

## Current-develop compatibility

The swap-screen conflict was resolved by preserving develop’s memoization, SwapRouteParamsObserver and existing provider/render tree. Solana selection wraps the EVM screen, and cleanup remains at the outer screen lifetime. The token-list patches apply on top of current token search rather than reverting it.

## Automated verification

The complete stack passes 356 focused tests across 28 files (wallet, Solana, EVM swaps, network badges and wallet sections), full TypeScript, dependency rules and the JavaScript type baseline (1,373 existing errors, no regressions). Native visuals, authentication and funded settlement have not been rerun on this new stack.

Store builds use the same Solana gate as wallet access and balances. No Solana-specific `IS_STORE_INSTALL` exclusion remains; the existing global configuration policy still makes store builds rely on remote `solana_enabled`.
