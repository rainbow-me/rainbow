import { useCallback } from 'react';
import { runOnJS, runOnUI, useAnimatedReaction, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { useDebouncedCallback } from 'use-debounce';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { type NumberPadField } from '@/features/perps/components/NumberPad/NumberPadKey';
import { SLIDER_MAX } from '@/features/perps/components/Slider/Slider';
import { handleSignificantDecimalsWorklet } from '@/helpers/utilities';
import { useStableValue } from '@/hooks/useStableValue';
import {
  divWorklet,
  equalWorklet,
  greaterThanOrEqualToWorklet,
  mulWorklet,
  toFixedWorklet,
  trimTrailingZeros,
} from '@/framework/core/safeMath';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useListen } from '@/state/internal/hooks/useListen';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { type ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { addCommasToNumber, parseAssetAndExtend } from '@/__swaps__/utils/swaps';
import { time } from '@/utils/time';
import { sanitizeAmount } from '@/worklets/strings';
import { INITIAL_SLIDER_PROGRESS } from '../constants';
import {
  type AmountStoreType,
  type DepositGasStoresType,
  type DepositStoreType,
  type InputMethod,
  type InteractionSource,
  type MinifiedAsset,
} from '../types';
import { amountFromSliderProgress, sliderProgressFromAmount } from '../utils/sliderWorklets';

// ============ Controller Hook =============================================== //

type ComputeMaxSwappableFn = (
  asset: ExtendedAnimatedAssetWithColors | null,
  gasSettings: import('@/__swaps__/screens/Swap/hooks/useCustomGas').GasSettings | undefined,
  gasLimit: string | undefined
) => string | undefined;

export function useDepositController(
  computeMaxSwappableAmount: ComputeMaxSwappableFn,
  gasStores: DepositGasStoresType,
  useAmountStore: AmountStoreType,
  useDepositStore: DepositStoreType
): DepositControllerReturn {
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
      const decimals = current?.decimals ?? 18;
      const price = current?.price?.value ?? 0;
      const maxSwappable =
        computeMaxSwappableAmount(
          current,
          gasStores.useGasSettings.getState(),
          gasStores.useGasLimitStore.getState().getData() ?? undefined
        ) || '0';

      runOnUI(() => {
        setInputAmounts({
          assetDecimals: decimals,
          assetPrice: price,
          maxSwappableAmount: maxSwappable,
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
      const decimals = asset?.decimals ?? 18;
      const price = asset?.price?.value ?? 0;
      runOnUI(() => {
        if (interactionSource.value === 'numberpad') return;
        const shouldVerifyMax = sliderProgress.value >= SLIDER_MAX;
        if (!shouldVerifyMax) return;

        setInputAmounts({
          assetDecimals: decimals,
          assetPrice: price,
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

// ============ Return Type =================================================== //

export type DepositControllerReturn = {
  displayedAmount: import('react-native-reanimated').SharedValue<string>;
  displayedNativeValue: import('react-native-reanimated').SharedValue<string>;
  fields: import('react-native-reanimated').SharedValue<Record<string, NumberPadField>>;
  handleInputMethodChangeWorklet: () => void;
  handleNumberPadChange: (fieldId: string, newValue: string | number) => void;
  handlePressMaxWorklet: () => void;
  handleSliderBeginWorklet: () => void;
  inputMethod: import('react-native-reanimated').SharedValue<InputMethod>;
  interactionSource: import('react-native-reanimated').SharedValue<InteractionSource>;
  isSubmitting: import('react-native-reanimated').SharedValue<boolean>;
  minifiedAsset: import('react-native-reanimated').DerivedValue<MinifiedAsset>;
  primaryFormattedInput: import('react-native-reanimated').DerivedValue<string>;
  secondaryFormattedInput: import('react-native-reanimated').DerivedValue<string>;
  setInputAmounts: (params: { assetDecimals: number; assetPrice: number; maxSwappableAmount: string; progress: number }) => void;
  sliderProgress: import('react-native-reanimated').SharedValue<number>;
};

// ============ Helper Functions ============================================== //

function buildInitialState(
  useDepositStore: DepositStoreType,
  useAmountStore: AmountStoreType,
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
