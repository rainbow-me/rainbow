import MaskedView from '@react-native-masked-view/masked-view';
import React, { useMemo } from 'react';
import { StyleSheet, StatusBar } from 'react-native';
import Animated, {
  interpolateColor,
  runOnUI,
  useAnimatedStyle,
  useDerivedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ScreenCornerRadius } from 'react-native-screen-corner-radius';

import { AnimatedText, Box, Column, Columns, Stack, useColorMode, useForegroundColor } from '@/design-system';

import { GestureHandlerV1Button } from '@/__swaps__/screens/Swap/components/GestureHandlerV1Button';
import { SwapActionButton } from '@/__swaps__/screens/Swap/components/SwapActionButton';
import { SwapCoinIcon } from '@/__swaps__/screens/Swap/components/SwapCoinIcon';
import { FadeMask } from '@/__swaps__/screens/Swap/components/FadeMask';
import { SwapInput } from '@/__swaps__/screens/Swap/components/SwapInput';
import { BalanceBadge } from '@/__swaps__/screens/Swap/components/BalanceBadge';
import { TokenList } from '@/__swaps__/screens/Swap/components/TokenList/TokenList';
import {
  BASE_INPUT_WIDTH,
  ETH_COLOR_DARK,
  ETH_COLOR_DARK_ACCENT,
  INPUT_INNER_WIDTH,
  INPUT_PADDING,
  THICK_BORDER_WIDTH,
  pulsingConfig,
  sliderConfig,
  slowFadeConfig,
} from '@/__swaps__/screens/Swap/constants';
import { IS_ANDROID } from '@/env';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { useAssetsToSell } from '@/__swaps__/screens/Swap/hooks/useAssetsToSell';
import { isSameAssetWorklet } from '@/__swaps__/utils/assets';
import { ethereumUtils } from '@/utils';
import { useSwapAssets } from '@/state/swaps/assets';
import { ChainId } from '@/__swaps__/types/chains';
import {
  addCommasToNumber,
  countDecimalPlaces,
  extractColorValueForColors,
  findNiceIncrement,
  niceIncrementFormatter,
  valueBasedDecimalFormatter,
  opacity,
} from '@/__swaps__/utils/swaps';
import { TokenColors } from '@/graphql/__generated__/metadata';

function SwapInputActionButton() {
  const { isDarkMode } = useColorMode();
  const { SwapNavigation } = useSwapContext();

  const assetToSellColors = useSwapAssets(state => state.assetToSell?.colors);
  const assetToSellSymbol = useSwapAssets(state => state.assetToSell?.symbol);

  const assetToSellColor = useMemo(() => {
    return extractColorValueForColors({
      colors: assetToSellColors as TokenColors,
      isDarkMode,
    });
  }, [assetToSellColors, isDarkMode]);

  return (
    <SwapActionButton
      color={assetToSellColor}
      disableShadow={isDarkMode}
      hugContent
      label={assetToSellSymbol}
      onPress={runOnUI(SwapNavigation.handleInputPress)}
      rightIcon={'􀆏'}
      small
    />
  );
}

function SwapInputAmount() {
  const { isDarkMode } = useColorMode();
  const { focusedInput, sliderXPosition, SwapTextStyles, SwapInputController } = useSwapContext();

  const inputAssetBalance = useSwapAssets(state => state.assetToSell?.balance.amount);
  const inputAssetNativePrice = useSwapAssets(state => state.assetToSellPrice);
  const inputAssetStablecoin = useSwapAssets(state => state.assetToSell?.type === 'stablecoin');

  const assetToSellColors = useSwapAssets(state => state.assetToSell?.colors);

  const topColor = useMemo(() => {
    return extractColorValueForColors({
      colors: assetToSellColors as TokenColors,
      isDarkMode,
    });
  }, [assetToSellColors, isDarkMode]);

  const niceIncrement = useMemo(() => findNiceIncrement(Number(inputAssetBalance)), [inputAssetBalance]);
  const incrementDecimalPlaces = useMemo(() => countDecimalPlaces(niceIncrement), [niceIncrement]);

  const formattedInputAmount = useDerivedValue(() => {
    if (SwapInputController.inputMethod.value === 'slider' && SwapInputController.percentageToSwap.value === 0) return '0';
    if (SwapInputController.inputMethod.value === 'inputAmount' || typeof SwapInputController.inputValues.value.inputAmount === 'string') {
      if (Number(SwapInputController.inputValues.value.inputAmount) === 0) return '0';

      return addCommasToNumber(SwapInputController.inputValues.value.inputAmount);
    }

    if (SwapInputController.inputMethod.value === 'outputAmount') {
      if (!Number(inputAssetBalance) || Number(SwapInputController.inputValues.value.inputAmount) === 0) return '0';

      return valueBasedDecimalFormatter(
        SwapInputController.inputValues.value.inputAmount,
        Number(inputAssetBalance),
        'up',
        -1,
        inputAssetStablecoin,
        false
      );
    }

    if (!Number(inputAssetBalance) || !Number(inputAssetNativePrice)) return '0';

    return niceIncrementFormatter(
      incrementDecimalPlaces,
      Number(inputAssetBalance),
      Number(inputAssetNativePrice),
      niceIncrement,
      SwapInputController.percentageToSwap.value,
      sliderXPosition.value
    );
  });

  const labelSecondary = useForegroundColor('labelSecondary');
  const zeroAmountColor = opacity(labelSecondary, 0.2);

  const isInputStale = useDerivedValue(() => {
    const isAdjustingOutputValue =
      SwapInputController.inputMethod.value === 'outputAmount' || SwapInputController.inputMethod.value === 'outputNativeValue';
    return SwapInputController.isQuoteStale.value === 1 && isAdjustingOutputValue ? 1 : 0;
  });

  const pulsingOpacity = useDerivedValue(() => {
    return SwapInputController.isQuoteStale.value === 1
      ? withRepeat(withSequence(withTiming(0.5, pulsingConfig), withTiming(1, pulsingConfig)), -1, true)
      : withSpring(1, sliderConfig);
  }, []);

  const inputAmountTextStyle = useAnimatedStyle(() => {
    const isInputZero =
      (SwapInputController.inputValues.value.inputAmount === 0 && SwapInputController.inputMethod.value !== 'slider') ||
      (SwapInputController.inputMethod.value === 'slider' && Number(SwapInputController.inputValues.value.inputAmount) === 0);
    const isOutputZero = Number(SwapInputController.inputValues.value.outputAmount) === 0;

    // eslint-disable-next-line no-nested-ternary
    const zeroOrAssetColor = isInputZero ? zeroAmountColor : topColor === ETH_COLOR_DARK ? ETH_COLOR_DARK_ACCENT : topColor;
    const opacity = isInputStale.value !== 1 || (isInputZero && isOutputZero) ? withSpring(1, sliderConfig) : pulsingOpacity.value;

    return {
      color: withTiming(interpolateColor(isInputStale.value, [0, 1], [zeroOrAssetColor, zeroAmountColor]), slowFadeConfig),
      flexGrow: 0,
      flexShrink: 1,
      opacity,
    };
  }, [isDarkMode, topColor]);

  const assetToSellCaretStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: topColor,
    };
  });

  return (
    <GestureHandlerV1Button
      disableButtonPressWrapper
      onPressStartWorklet={() => {
        'worklet';
        focusedInput.value = 'inputAmount';
      }}
    >
      <MaskedView maskElement={<FadeMask fadeEdgeInset={2} fadeWidth={8} height={36} side="right" />} style={styles.inputTextMask}>
        <AnimatedText
          ellipsizeMode="clip"
          numberOfLines={1}
          size="30pt"
          style={inputAmountTextStyle}
          text={formattedInputAmount}
          weight="bold"
        />
        <Animated.View style={[styles.caretContainer, SwapTextStyles.inputCaretStyle]}>
          <Box as={Animated.View} borderRadius={1} style={[styles.caret, assetToSellCaretStyle]} />
        </Animated.View>
      </MaskedView>
    </GestureHandlerV1Button>
  );
}

function SwapInputNativeAmount() {
  const { SwapTextStyles, SwapInputController } = useSwapContext();

  const formattedInputNativeValue = useDerivedValue(() => {
    if (
      (SwapInputController.inputMethod.value === 'slider' && SwapInputController.percentageToSwap.value === 0) ||
      Number(SwapInputController.inputValues.value.inputNativeValue) === 0 ||
      Number.isNaN(SwapInputController.inputValues.value.inputNativeValue)
    )
      return '$0.00';

    const nativeValue = `$${SwapInputController.inputValues.value.inputNativeValue.toLocaleString('en-US', {
      useGrouping: true,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    return nativeValue || '$0.00';
  });

  return (
    <AnimatedText
      numberOfLines={1}
      size="17pt"
      style={SwapTextStyles.inputNativeValueStyle}
      text={formattedInputNativeValue}
      weight="heavy"
    />
  );
}

function SwapInputIcon() {
  const { isDarkMode } = useColorMode();

  const assetToSellIconUrl = useSwapAssets(state => state.assetToSell?.icon_url);
  const assetToSellChainId = useSwapAssets(state => state.assetToSell?.chainId);
  const assetToSellSymbol = useSwapAssets(state => state.assetToSell?.symbol);
  const assetToSellAddress = useSwapAssets(state => state.assetToSell?.address);
  const assetToSellMainnetAddress = useSwapAssets(state => state.assetToSell?.mainnetAddress);

  const assetToSellColors = useSwapAssets(state => state.assetToSell?.colors);

  const assetToSellColor = useMemo(() => {
    return extractColorValueForColors({
      colors: assetToSellColors as TokenColors,
      isDarkMode,
    });
  }, [assetToSellColors, isDarkMode]);

  return (
    <Box paddingRight="10px">
      <SwapCoinIcon
        color={assetToSellColor}
        iconUrl={assetToSellIconUrl}
        address={assetToSellAddress ?? ''}
        large
        mainnetAddress={assetToSellMainnetAddress ?? ''}
        network={ethereumUtils.getNetworkFromChainId(assetToSellChainId ?? ChainId.mainnet)}
        symbol={assetToSellSymbol ?? ''}
      />
    </Box>
  );
}

function InputAssetBalanceBadge() {
  const assetToSell = useSwapAssets(state => state.assetToSell);
  const userAssets = useAssetsToSell();

  const label = useDerivedValue(() => {
    if (!assetToSell) return 'No balance';
    const userAsset = userAssets.find(userAsset => isSameAssetWorklet(userAsset, assetToSell));
    return userAsset?.balance.display ?? 'No balance';
  });

  return <BalanceBadge label={label} />;
}

export function SwapInputAsset() {
  const { isDarkMode } = useColorMode();
  const { outputProgress, inputProgress, AnimatedSwapStyles, SwapNavigation } = useSwapContext();

  const assetToSellColors = useSwapAssets(state => state.assetToSell?.colors);

  const color = useMemo(() => {
    return extractColorValueForColors({
      colors: assetToSellColors as TokenColors,
      isDarkMode,
    });
  }, [assetToSellColors, isDarkMode]);

  return (
    <SwapInput color={color} otherInputProgress={outputProgress} progress={inputProgress}>
      <Box as={Animated.View} style={AnimatedSwapStyles.inputStyle}>
        <Stack space="16px">
          <Columns alignHorizontal="justify" alignVertical="center">
            <Column width="content">
              <SwapInputIcon />
            </Column>
            <SwapInputAmount />
            <Column width="content">
              <SwapInputActionButton />
            </Column>
          </Columns>
          <Columns alignHorizontal="justify" alignVertical="center" space="10px">
            <SwapInputNativeAmount />
            <Column width="content">
              <InputAssetBalanceBadge />
            </Column>
          </Columns>
        </Stack>
      </Box>
      <Box
        as={Animated.View}
        padding={{ custom: INPUT_PADDING }}
        paddingBottom={{ custom: 14.5 }}
        position="absolute"
        style={AnimatedSwapStyles.inputTokenListStyle}
        width={{ custom: INPUT_INNER_WIDTH }}
      >
        <TokenList
          color={color}
          handleExitSearch={runOnUI(SwapNavigation.handleExitSearch)}
          handleFocusSearch={runOnUI(SwapNavigation.handleFocusInputSearch)}
        />
      </Box>
    </SwapInput>
  );
}

export const styles = StyleSheet.create({
  backgroundOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
  },
  caret: {
    height: 32,
    width: 2,
  },
  caretContainer: {
    flexGrow: 100,
    flexShrink: 0,
  },
  flipButton: {
    borderRadius: 15,
    height: 30,
    width: 30,
  },
  headerButton: {
    borderRadius: 18,
    borderWidth: THICK_BORDER_WIDTH,
    height: 36,
    width: 36,
  },
  headerTextShadow: {
    padding: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  inputTextMask: { alignItems: 'center', flexDirection: 'row', height: 36, pointerEvents: 'box-only' },
  rootViewBackground: {
    backgroundColor: 'transparent',
    borderRadius: IS_ANDROID ? 20 : ScreenCornerRadius,
    flex: 1,
    overflow: 'hidden',
    marginTop: StatusBar.currentHeight ?? 0,
  },
  solidColorCoinIcon: {
    opacity: 0.4,
  },
  staticInputContainerStyles: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 9,
  },
  staticInputStyles: {
    borderCurve: 'continuous',
    borderRadius: 30,
    borderWidth: THICK_BORDER_WIDTH,
    overflow: 'hidden',
    padding: INPUT_PADDING,
    width: BASE_INPUT_WIDTH,
  },
  textIconGlow: {
    padding: 16,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
