import React, { useCallback, useEffect, useMemo } from 'react';

import MaskedView from '@react-native-masked-view/masked-view';
import { runOnJS, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { parseUnits } from 'viem';

import { BalanceBadge } from '@/__swaps__/screens/Swap/components/BalanceBadge';
import { FadeMask } from '@/__swaps__/screens/Swap/components/FadeMask';
import { SwapActionButton } from '@/__swaps__/screens/Swap/components/SwapActionButton';
import { SwapAssetFields } from '@/__swaps__/screens/Swap/components/SwapAssetFields';
import { SwapCoinIconTextFallback } from '@/__swaps__/screens/Swap/components/SwapCoinIconTextFallback';
import { SwapInput } from '@/__swaps__/screens/Swap/components/SwapInput';
import { SwapNumberPadView } from '@/__swaps__/screens/Swap/components/SwapNumberPad';
import { SwapSliderView, type SwapSliderState } from '@/__swaps__/screens/Swap/components/SwapSlider';
import { SLIDER_COLLAPSED_HEIGHT, SLIDER_HEIGHT, SLIDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { type InputMethods, type InputValues } from '@/__swaps__/types/swap';
import { GestureHandlerButton } from '@/components/buttons/GestureHandlerButton';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { Box, Text, useColorMode } from '@/design-system';
import { editSwapAmount, SWAP_ASSETS, swapMaxAmount, swapPercentageAmount, type SwapAssetId } from '@/features/solana/core/swap';
import { addCommasToNumber } from '@/framework/ui/utils/addCommasToNumber';
import { handleSignificantDecimals } from '@/helpers/utilities';
import { useUserAssetsStore } from '@/state/assets/userAssets';

const COLORS = {
  'base-eth': { light: '#25292E', dark: '#677483' },
  'sol': { light: '#7057E8', dark: '#A18AFF' },
  'usdc': { light: '#2775CA', dark: '#5496DF' },
  'bonk': { light: '#C26515', dark: '#EAA259' },
};
export function appearance(id: SwapAssetId | null) {
  'worklet';
  const color = COLORS[id ?? 'base-eth'];
  return {
    color,
    highContrastColor: color,
    mixedShadowColor: color,
    textColor: { light: '#FFFFFF', dark: '#FFFFFF' },
    symbol: id ? SWAP_ASSETS[id].symbol : '',
  };
}

export function SolanaSwapIcon({ assetId, size = 36 }: { assetId: SwapAssetId | null; size?: number }) {
  const asset = useDerivedValue(() => appearance(assetId));
  const eth = useUserAssetsStore(state => state.getNativeAssetForChain(8453));
  if (assetId === 'base-eth')
    return <RainbowCoinIcon chainId={8453} icon={eth?.icon_url} symbol="ETH" size={size} chainSize={16} showBadge={size > 16} />;
  return <SwapCoinIconTextFallback asset={asset} height={size} width={size} style={{ borderRadius: size / 2, overflow: 'hidden' }} />;
}

export function SolanaSwapCard({
  assetId,
  amount,
  balance,
  nativeValue,
  onSelect,
  onMax,
  bottomInput,
}: {
  assetId: SwapAssetId | null;
  amount: string;
  balance: string;
  nativeValue: string;
  onSelect: () => void;
  onMax?: () => void;
  bottomInput?: boolean;
}) {
  const asset = useDerivedValue(() => appearance(assetId));
  const progress = useSharedValue(0);
  const label = useDerivedValue(() => balance);
  const displayAmount =
    bottomInput && assetId ? handleSignificantDecimals(amount, SWAP_ASSETS[assetId].decimals) : addCommasToNumber(amount, '0');
  const { isDarkMode } = useColorMode();
  const badge = <BalanceBadge label={label} />;
  return (
    <SwapInput asset={asset} progress={progress} otherInputProgress={progress} bottomInput={bottomInput}>
      <SwapAssetFields
        icon={
          <Box paddingRight="10px">
            <SolanaSwapIcon assetId={assetId} />
          </Box>
        }
        amount={
          <MaskedView
            maskElement={<FadeMask fadeEdgeInset={2} fadeWidth={8} height={36} side="right" />}
            style={{ alignItems: 'center', flexDirection: 'row', height: 36, pointerEvents: 'box-only' }}
          >
            <Text color="label" size="30pt" weight="bold" numberOfLines={1} ellipsizeMode="clip">
              {displayAmount}
            </Text>
          </MaskedView>
        }
        action={
          <SwapActionButton
            asset={asset}
            disableShadow={isDarkMode}
            hugContent
            label={assetId ? SWAP_ASSETS[assetId].symbol : 'Select'}
            onPressJS={onSelect}
            rightIcon="􀆏"
            small
          />
        }
        nativeValue={
          <Text color="labelTertiary" size="17pt" weight="heavy">
            {nativeValue}
          </Text>
        }
        balance={
          onMax ? (
            <GestureHandlerButton hitSlop={6} onPressJS={onMax}>
              {badge}
            </GestureHandlerButton>
          ) : (
            badge
          )
        }
      />
    </SwapInput>
  );
}

const SLIDER_SNAP_POINTS = [0, 0.25, 0.5, 0.75, 1];

export const SolanaSwapAmountControls = React.memo(function SolanaSwapAmountControls({
  input,
  amount,
  balance,
  fetching,
  onChange,
  onInteraction,
}: {
  input: SwapAssetId;
  amount: string;
  balance: bigint;
  fetching: boolean;
  onChange: (amount: string) => void;
  onInteraction: (active: boolean) => void;
}) {
  const inputMethod = useSharedValue<InputMethods>('inputAmount');
  const inputValues = useSharedValue<InputValues>({
    inputAmount: amount,
    outputAmount: '0',
    inputNativeValue: '0',
    outputNativeValue: '0',
  });
  const sliderXPosition = useSharedValue(0);
  const sliderPressProgress = useSharedValue(SLIDER_COLLAPSED_HEIGHT / SLIDER_HEIGHT);
  const isFetching = useSharedValue(fetching);
  const isQuoteStale = useSharedValue(0);
  const max = swapMaxAmount(input, balance);
  const inputAsset = useDerivedValue(() => ({ ...appearance(input), maxSwappableAmount: max }));
  const canDelete = useDerivedValue(() => String(inputValues.value.inputAmount) !== '0');
  useEffect(() => {
    inputValues.value = { ...inputValues.value, inputAmount: amount };
    const units = parseUnits(amount, SWAP_ASSETS[input].decimals);
    const maximum = parseUnits(max, SWAP_ASSETS[input].decimals);
    sliderXPosition.value = maximum > 0n ? Math.min(1, Number((units * 10000n) / maximum) / 10000) * SLIDER_WIDTH : 0;
  }, [amount, input, max, inputValues, sliderXPosition]);
  useEffect(() => {
    isFetching.value = fetching;
    isQuoteStale.value = fetching ? 1 : 0;
  }, [fetching, isFetching, isQuoteStale]);
  const percentageChanged = useCallback(
    (percentage: number) => {
      onInteraction(false);
      onChange(swapPercentageAmount(input, balance, percentage));
    },
    [input, balance, onChange, onInteraction]
  );
  const maxWorklet = useCallback(() => {
    'worklet';
    runOnJS(percentageChanged)(1);
  }, [percentageChanged]);
  const quoteFetchingInterval = useMemo(
    () => ({
      stop: () => {
        'worklet';
        runOnJS(onInteraction)(true);
      },
      start: () => {
        'worklet';
        runOnJS(onInteraction)(false);
      },
    }),
    [onInteraction]
  );
  const state: SwapSliderState = {
    AnimatedSwapStyles: { hideWhileReviewingOrConfiguringGas: { opacity: 1, pointerEvents: 'auto' } },
    SwapInputController: {
      inputMethod,
      inputValues,
      onChangedPercentage: percentageChanged,
      setValueToMaxSwappableAmount: maxWorklet,
      quoteFetchingInterval,
    },
    internalSelectedInputAsset: inputAsset,
    internalSelectedOutputAsset: inputAsset,
    isFetching,
    isQuoteStale,
    sliderPressProgress,
    sliderXPosition,
    swapInfo: { value: { isBridging: false } },
  };
  const decimals = SWAP_ASSETS[input].decimals;
  const edit = (key: number | '.' | 'backspace') => {
    'worklet';
    const current = String(inputValues.value.inputAmount);
    const next = editSwapAmount(current, key, decimals);
    if (next === current) return;
    inputMethod.value = 'inputAmount';
    inputValues.value = { ...inputValues.value, inputAmount: next };
    runOnJS(onChange)(next);
  };
  return (
    <Box width="full" testID="solana-swap-amount-controls">
      <SwapSliderView snapPoints={SLIDER_SNAP_POINTS} state={state} icon={<SolanaSwapIcon assetId={input} size={16} />} />
      <SwapNumberPadView
        canDelete={canDelete}
        addNumber={number => {
          'worklet';
          if (number !== undefined) edit(number);
        }}
        addDecimalPoint={() => {
          'worklet';
          edit('.');
        }}
        deleteLastCharacter={() => {
          'worklet';
          edit('backspace');
        }}
      />
    </Box>
  );
});
