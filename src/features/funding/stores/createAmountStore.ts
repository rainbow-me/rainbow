import { INITIAL_SLIDER_PROGRESS } from '@/features/perps/screens/perps-deposit-withdraw-screen/shared/constants';
import { amountFromSliderProgress } from '@/features/perps/screens/perps-deposit-withdraw-screen/shared/worklets';
import { equalWorklet, trimTrailingZeros } from '@/safe-math/SafeMath';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { GasSettings } from '@/__swaps__/screens/Swap/hooks/useCustomGas';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { sanitizeAmount } from '@/worklets/strings';
import { computeMaxSwappableAmount } from './createDepositStore';
import { AmountState, AmountStoreType } from '../types';

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
