import { INITIAL_SLIDER_PROGRESS } from '@/features/perps/screens/perps-deposit-withdraw-screen/shared/constants';
import { amountFromSliderProgress } from '@/features/perps/screens/perps-deposit-withdraw-screen/shared/worklets';
import { computeMaxSwappableAmount } from '@/features/perps/screens/perps-deposit-withdraw-screen/stores/createPerpsDepositStore';
import { equalWorklet, trimTrailingZeros } from '@/safe-math/SafeMath';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { RainbowStore } from '@/state/internal/types';
import { GasSettings } from '@/__swaps__/screens/Swap/hooks/useCustomGas';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { sanitizeAmount } from '@/worklets/strings';

export type PerpsDepositAmountStoreType = RainbowStore<PerpsDepositAmountState>;

export type PerpsDepositAmountState = {
  amount: string;
  isZero: () => boolean;
  setAmount: (amount: string) => void;
};

export function createPerpsDepositAmountStore(initialAsset: ExtendedAnimatedAssetWithColors | null) {
  return createRainbowStore<PerpsDepositAmountState>((set, get) => ({
    amount: getInitialAmount(initialAsset, undefined, undefined),

    isZero: () => equalWorklet(get().amount, '0'),

    setAmount: amount =>
      set(state => {
        const realValue = sanitizeAmount(trimTrailingZeros(amount)) || '0';
        if (state.amount === realValue) return state;
        return { amount: realValue };
      }),
  }));
}

export function getInitialAmount(
  initialAsset: ExtendedAnimatedAssetWithColors | null,
  initialGasSettings: GasSettings | undefined,
  gasLimit: string | null | undefined,
  sliderProgress?: number
) {
  const maxSwappableAmount = computeMaxSwappableAmount(initialAsset, initialGasSettings, gasLimit ?? undefined) || '0';
  const { amount } = amountFromSliderProgress(
    sliderProgress ?? INITIAL_SLIDER_PROGRESS,
    maxSwappableAmount,
    initialAsset?.price?.value ?? 0,
    initialAsset?.decimals ?? 18
  );
  return amount;
}
