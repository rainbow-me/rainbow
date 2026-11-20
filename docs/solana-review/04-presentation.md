# 4. Reuse swap presentation without changing EVM behavior

Start at `CoinRow.tsx` (2 minutes): the existing EVM adapter still owns its store/hooks and now passes its presentation into `CoinRowView`.

This layer exposes shared views and narrower presentation props; it adds no Solana screen imports, token selection or route switching. Existing EVM callers keep their defaults. Review separately because shared rendering is used even with the Solana flag off.

## Reading order (20–30 minutes)

1. CoinRow and GasButton: follow the existing EVM adapters into the extracted views and check identical values/actions/sponsorship inputs.
2. SwapAssetFields and input/output cards: compare before/after layout, balances, amount text and token-selection handlers.
3. SwapNumberPad, SwapSlider, SwapNavbar and SwapWarning: verify the EVM wrappers pass the same state/actions and maintain worklet boundaries.
4. SwapActionButton, text fallback, SwapInput and useSwapInputStyles: check narrowed prop contracts and handler forwarding. The only existing EVM hold-progress caller, SwapBottomPanel, passes `internalSelectedOutputAsset`, the same value previously read inside HoldProgress.

Manual EVM checks: input/output selection, keypad and slider, Max, quote loading, Review/hold-to-swap alignment, paid/free fees and cancellation. Run with Solana disabled and compare light/dark modes. These visual checks remain required before marking this draft ready.

## Changed-file inventory

- `src/__swaps__/screens/Swap/components/CoinRow.tsx`
- `src/__swaps__/screens/Swap/components/GasButton.tsx`
- `src/__swaps__/screens/Swap/components/SwapActionButton.tsx`
- `src/__swaps__/screens/Swap/components/SwapAssetFields.tsx`
- `src/__swaps__/screens/Swap/components/SwapCoinIconTextFallback.tsx`
- `src/__swaps__/screens/Swap/components/SwapInput.tsx`
- `src/__swaps__/screens/Swap/components/SwapInputAsset.tsx`
- `src/__swaps__/screens/Swap/components/SwapNavbar.tsx`
- `src/__swaps__/screens/Swap/components/SwapNumberPad.tsx`
- `src/__swaps__/screens/Swap/components/SwapOutputAsset.tsx`
- `src/__swaps__/screens/Swap/components/SwapSlider.tsx`
- `src/__swaps__/screens/Swap/components/SwapWarning.tsx`
- `src/__swaps__/screens/Swap/hooks/useSwapInputStyles.ts`

This guide and its listed 13 implementation/configuration/test files define this layer.

## Automated verification

All 149 existing EVM swap tests pass both before and after extraction. Full TypeScript and dependency checks pass. These checks do not establish visual/worklet behavior on a native device; the manual EVM checks above remain pending.
