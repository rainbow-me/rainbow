import { useCallback } from 'react';
import { runOnJS, runOnUI, useAnimatedReaction, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { useDebouncedCallback } from 'use-debounce';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { NumberPadField } from '@/features/perps/components/NumberPad/NumberPadKey';
import { SLIDER_MAX } from '@/features/perps/components/Slider/Slider';
import { PerpsDepositGasStoresType } from '@/features/perps/screens/perps-deposit-withdraw-screen/stores/createPerpsDepositGasStore';
import { handleSignificantDecimalsWorklet } from '@/helpers/utilities';
import { useStableValue } from '@/hooks/useStableValue';
import { divWorklet, equalWorklet, greaterThanOrEqualToWorklet, mulWorklet, toFixedWorklet, trimTrailingZeros } from '@/safe-math/SafeMath';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useListen } from '@/state/internal/hooks/useListen';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { addCommasToNumber, parseAssetAndExtend } from '@/__swaps__/utils/swaps';
import { time } from '@/utils/time';
import { sanitizeAmount } from '@/worklets/strings';
import { INITIAL_SLIDER_PROGRESS } from '../shared/constants';
import { PerpsDepositAmountStoreType } from '../stores/createPerpsDepositAmountStore';
import { computeMaxSwappableAmount, PerpsDepositStoreType } from '../stores/createPerpsDepositStore';
import type { InputMethod, InteractionSource } from '../shared/types';
import { amountFromSliderProgress, sliderProgressFromAmount } from '../shared/worklets';

export type MinifiedAsset = Pick<
  ExtendedAnimatedAssetWithColors,
  'balance' | 'highContrastColor' | 'mixedShadowColor' | 'name' | 'symbol' | 'textColor' | 'uniqueId'
> | null;

export function usePerpsDepositController(
  useAmountStore: PerpsDepositAmountStoreType,
  useDepositStore: PerpsDepositStoreType,
  gasStores: PerpsDepositGasStoresType
) {
  const maxSwappableAmount = useStoreSharedValue(gasStores.useMaxSwappableAmount, state => state || '0');
  const minifiedAsset = useStoreSharedValue(useDepositStore, selectMinifiedAsset, areAssetsEqual);
  const assetDecimals = useStoreSharedValue(useDepositStore, state => state.asset?.decimals ?? 18);
  const assetPrice = useStoreSharedValue(useDepositStore, state => state.asset?.price?.value ?? 0);

  const initialState = useStableValue(() => buildInitialState(useDepositStore, useAmountStore, gasStores.useMaxSwappableAmount.getState()));

  const displayedAmount = useSharedValue(initialState.amount);
  const displayedNativeValue = useSharedValue(initialState.nativeValue);
  const fields = useSharedValue<Record<string, NumberPadField>>(initialState.fields);
  const inputMethod = useSharedValue<InputMethod>('inputNativeValue');
  const interactionSource = useSharedValue<InteractionSource>('slider');
  const isSubmitting = useSharedValue(false);
  const sliderProgress = useSharedValue(INITIAL_SLIDER_PROGRESS);

  const primaryFormattedInput = useDerivedValue(() => {
    const isNativeInput = inputMethod.value === 'inputNativeValue';
    const value = isNativeInput ? displayedNativeValue.value : displayedAmount.value;

    if (!value || value === '0') return isNativeInput ? '$0' : '0';

    if (!isNativeInput && inputMethod.value === 'inputNativeValue') {
      const formattedAmount = handleSignificantDecimalsWorklet(value, assetDecimals.value);
      return trimTrailingZeros(formattedAmount);
    }

    const formatted = addCommasToNumber(value, '0');
    return isNativeInput ? `$${formatted}` : formatted;
  });

  const secondaryFormattedInput = useDerivedValue(() => {
    const isNativeInput = inputMethod.value !== 'inputNativeValue';
    const value = isNativeInput ? displayedNativeValue.value : displayedAmount.value;

    if (!value || value === '0') return isNativeInput ? '$0' : '0';

    if (!isNativeInput && inputMethod.value !== 'inputAmount') {
      const formattedAmount = handleSignificantDecimalsWorklet(value, assetDecimals.value);
      return trimTrailingZeros(formattedAmount);
    }

    const formatted = addCommasToNumber(value, '0');
    return isNativeInput ? `$${formatted}` : formatted;
  });

  const debouncedSetAmount = useDebouncedCallback(useAmountStore.getState().setAmount, time.ms(200), {
    leading: false,
    trailing: true,
  });

  const setInputAmounts = useCallback(
    ({
      assetDecimals,
      assetPrice,
      maxSwappableAmount,
      progress,
    }: {
      assetDecimals: number;
      assetPrice: number;
      maxSwappableAmount: string;
      progress: number;
    }) => {
      'worklet';
      const result = amountFromSliderProgress(progress, maxSwappableAmount, assetPrice, assetDecimals);
      const { amount, nativeValue, trueBalance } = result;

      if (displayedAmount.value === amount && displayedNativeValue.value === nativeValue) return;

      displayedAmount.value = amount;
      displayedNativeValue.value = nativeValue;

      fields.modify(prev => {
        prev.inputAmount.value = amount;
        prev.inputNativeValue.value = nativeValue;
        return prev;
      });

      runOnJS(debouncedSetAmount)(trueBalance ?? amount);
    },
    [debouncedSetAmount, displayedAmount, displayedNativeValue, fields]
  );

  useAnimatedReaction(
    () => ({
      interactionSource: interactionSource.value,
      progress: sliderProgress.value,
    }),
    (current, previous) => {
      if (previous === null) return;
      if (current.interactionSource !== 'slider') return;

      const didSliderProgressChange = current.progress !== previous?.progress;
      const shouldVerifyMax = current.progress >= SLIDER_MAX;
      if (!didSliderProgressChange && !shouldVerifyMax) return;

      setInputAmounts({
        assetDecimals: assetDecimals.value,
        assetPrice: assetPrice.value,
        maxSwappableAmount: maxSwappableAmount.value,
        progress: current.progress,
      });
    },
    []
  );

  useListen(
    useDepositStore,
    state => state.asset,
    (current, previous) => {
      if (!previous || current?.uniqueId === previous?.uniqueId) return;
      const assetDecimals = current?.decimals ?? 18;
      const assetPrice = current?.price?.value ?? 0;
      const maxSwappableAmount =
        computeMaxSwappableAmount(
          current,
          gasStores.useGasSettings.getState(),
          gasStores.useGasLimitStore.getState().getData() ?? undefined
        ) || '0';

      runOnUI(() => {
        setInputAmounts({
          assetDecimals: assetDecimals,
          assetPrice: assetPrice,
          maxSwappableAmount,
          progress: sliderProgress.value || INITIAL_SLIDER_PROGRESS,
        });
      })();
    }
  );

  useListen(
    gasStores.useMaxSwappableAmount,
    state => state || '0',
    (current, previous) => {
      if (previous === null || current === previous) return;
      const asset = useDepositStore.getState().asset;
      const assetDecimals = asset?.decimals ?? 18;
      const assetPrice = asset?.price?.value ?? 0;
      runOnUI(() => {
        if (interactionSource.value === 'numberpad') return;
        const shouldVerifyMax = sliderProgress.value >= SLIDER_MAX;
        if (!shouldVerifyMax) return;

        setInputAmounts({
          assetDecimals,
          assetPrice,
          maxSwappableAmount: current,
          progress: SLIDER_MAX,
        });
      })();
    }
  );

  useListen(
    useWalletsStore,
    state => state.accountAddress,
    (current, previous) => {
      if (previous === null || current === previous) return;
      queueMicrotask(() => {
        useDepositStore.getState().setAsset(
          current
            ? parseAssetAndExtend({
                asset: useUserAssetsStore.getState().getHighestValueNativeAsset(),
              })
            : null
        );
      });
    }
  );

  const handleSliderBeginWorklet = useCallback(() => {
    'worklet';
    interactionSource.value = 'slider';
  }, [interactionSource]);

  const handleNumberPadChange = useCallback(
    (fieldId: string, newValue: string | number) => {
      'worklet';
      if (assetDecimals.value === undefined) return;

      interactionSource.value = 'numberpad';

      const nativePrice = assetPrice.value || 0;
      let amount = '0';
      let nativeValue = '0';

      if (fieldId === 'inputAmount') {
        amount = String(newValue);
        const sanitizedInput = sanitizeAmount(amount);
        if (equalWorklet(sanitizedInput, '0')) {
          nativeValue = '0';
        } else {
          nativeValue = sanitizeAmount(toFixedWorklet(mulWorklet(sanitizedInput, nativePrice), 2));
        }
      } else if (fieldId === 'inputNativeValue') {
        nativeValue = String(newValue);
        const sanitizedNative = sanitizeAmount(nativeValue);
        if (nativePrice > 0) {
          const derivedAmount = divWorklet(sanitizedNative, nativePrice);
          if (equalWorklet(derivedAmount, '0')) {
            amount = '0';
          } else {
            const decimals = assetDecimals.value || 18;
            amount = toFixedWorklet(derivedAmount, decimals);
          }
        } else {
          amount = '0';
        }
      }

      displayedAmount.value = amount;
      displayedNativeValue.value = nativeValue;

      fields.modify(prev => {
        prev.inputAmount.value = amount;
        prev.inputNativeValue.value = nativeValue;
        return prev;
      });

      const maxAmount = maxSwappableAmount.value || '0';
      const sanitizedAmount = sanitizeAmount(amount);
      const nextProgress = sliderProgressFromAmount(sanitizedAmount, maxAmount);
      sliderProgress.value = withSpring(nextProgress, SPRING_CONFIGS.snappySpringConfig);

      runOnJS(debouncedSetAmount)(sanitizedAmount);
    },
    [
      assetPrice,
      assetDecimals,
      debouncedSetAmount,
      displayedAmount,
      displayedNativeValue,
      fields,
      interactionSource,
      maxSwappableAmount,
      sliderProgress,
    ]
  );

  const handleInputMethodChangeWorklet = useCallback(() => {
    'worklet';
    inputMethod.value = inputMethod.value === 'inputAmount' ? 'inputNativeValue' : 'inputAmount';
  }, [inputMethod]);

  const handlePressMaxWorklet = useCallback(() => {
    'worklet';
    const maxAmount = maxSwappableAmount.value;
    if (!maxAmount || equalWorklet(maxAmount, 0)) return;

    const currentAmount = displayedAmount.value;
    const isAlreadyMax = equalWorklet(currentAmount, maxAmount);
    const exceedsMax = greaterThanOrEqualToWorklet(currentAmount, maxAmount);

    if (isAlreadyMax) return;
    interactionSource.value = 'slider';

    if (exceedsMax) sliderProgress.value = SLIDER_MAX * 0.99999;
    sliderProgress.value = withSpring(SLIDER_MAX, SPRING_CONFIGS.snappySpringConfig);
  }, [displayedAmount, interactionSource, maxSwappableAmount, sliderProgress]);

  return {
    displayedAmount,
    displayedNativeValue,
    fields,
    handleInputMethodChangeWorklet,
    handleNumberPadChange,
    handlePressMaxWorklet,
    handleSliderBeginWorklet,
    inputMethod,
    interactionSource,
    isSubmitting,
    minifiedAsset,
    primaryFormattedInput,
    secondaryFormattedInput,
    setInputAmounts,
    sliderProgress,
  };
}

function buildInitialState(
  useDepositStore: PerpsDepositStoreType,
  useAmountStore: PerpsDepositAmountStoreType,
  initialMaxSwappableAmount: string | undefined
): {
  amount: string;
  decimals: number;
  fields: Record<string, NumberPadField>;
  nativeValue: string;
} {
  const asset = useDepositStore.getState().asset;
  const balance = initialMaxSwappableAmount ?? asset?.balance.amount ?? '0';
  const nativePrice = asset?.price?.value || 0;
  const decimals = asset?.decimals || 18;

  const { amount, nativeValue } = amountFromSliderProgress(INITIAL_SLIDER_PROGRESS, balance, nativePrice, decimals);

  return {
    amount,
    decimals,
    fields: {
      inputAmount: {
        allowDecimals: true,
        id: 'inputAmount',
        maxDecimals: decimals,
        value: amount,
      },
      inputNativeValue: {
        allowDecimals: true,
        id: 'inputNativeValue',
        maxDecimals: 2,
        value: nativeValue,
      },
    },
    nativeValue,
  };
}

function selectMinifiedAsset(state: { asset: ExtendedAnimatedAssetWithColors | null }): MinifiedAsset {
  const asset = state.asset;
  if (!asset) return null;
  return {
    balance: asset.balance,
    highContrastColor: asset.highContrastColor,
    mixedShadowColor: asset.mixedShadowColor,
    name: asset.name,
    symbol: asset.symbol,
    textColor: asset.textColor,
    uniqueId: asset.uniqueId,
  };
}

function areAssetsEqual(current: MinifiedAsset, previous: MinifiedAsset): boolean {
  if (!current && !previous) return true;
  if (!current || !previous) return false;
  return current.uniqueId === previous.uniqueId && current.balance.amount === previous.balance.amount;
}
