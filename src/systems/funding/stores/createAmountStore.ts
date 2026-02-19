import { equalWorklet, trimTrailingZeros } from '@/framework/core/safeMath';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { GasSettings } from '@/__swaps__/screens/Swap/hooks/useCustomGas';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { sanitizeAmount } from '@/worklets/strings';
import { INITIAL_SLIDER_PROGRESS } from '../constants';
import { AmountState, AmountStoreType } from '../types';
import { amountFromSliderProgress } from '../utils/sliderWorklets';
import { computeMaxSwappableAmount } from './createDepositStore';

// ============ Amount Store Factory ========================================== //

export function createAmountStore(initialAmount = '0'): AmountStoreType {
  return createRainbowStore<AmountState>((set, get) => ({
    amount: initialAmount,

    isZero: () => equalWorklet(get().amount, '0'),

    setAmount: amount =>
      set(state => {
        const realValue = sanitizeAmount(trimTrailingZeros(amount)) || '0';
        if (state.amount === realValue) return state;
        return { amount: realValue };
      }),
  }));
}

// ============ Deposit-Specific Amount Store ================================= //

export function createDepositAmountStore(initialAsset: ExtendedAnimatedAssetWithColors | null): AmountStoreType {
  const initialAmount = computeInitialDepositAmount(initialAsset, undefined, undefined);
  return createAmountStore(initialAmount);
}

// ============ Initial Amount Computation ==================================== //

export function computeInitialDepositAmount(
  asset: ExtendedAnimatedAssetWithColors | null,
  gasSettings: GasSettings | undefined,
  gasLimit: string | null | undefined,
  sliderProgress = INITIAL_SLIDER_PROGRESS
): string {
  const maxSwappableAmount = computeMaxSwappableAmount(asset, gasSettings, gasLimit ?? undefined) || '0';
  const { amount } = amountFromSliderProgress(sliderProgress, maxSwappableAmount, asset?.price?.value ?? 0, asset?.decimals ?? 18);
  return amount;
}
