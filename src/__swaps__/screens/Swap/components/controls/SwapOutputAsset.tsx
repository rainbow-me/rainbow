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
import { isSameAssetWorklet } from '@/__swaps__/utils/assets';
import { useAssetsToSell } from '@/__swaps__/screens/Swap/hooks/useAssetsToSell';
import { ethereumUtils } from '@/utils';
import { useSwapAssets } from '@/state/swaps/assets';
import { addCommasToNumber, extractColorValueForColors, opacity, valueBasedDecimalFormatter } from '@/__swaps__/utils/swaps';
import { TokenColors } from '@/graphql/__generated__/metadata';
import { ChainId } from '@/__swaps__/types/chains';

function SwapOutputActionButton() {
  const { isDarkMode } = useColorMode();
  const { SwapNavigation } = useSwapContext();

  const assetToBuyColors = useSwapAssets(state => state.assetToBuy?.colors);
  const assetToBuySymbol = useSwapAssets(state => state.assetToBuy?.symbol);

  const assetToBuyColor = useMemo(() => {
    return extractColorValueForColors({
      colors: assetToBuyColors as TokenColors,
      isDarkMode,
    });
  }, [assetToBuyColors, isDarkMode]);

  return (
    <SwapActionButton
      color={assetToBuyColor}
      disableShadow={isDarkMode}
      hugContent
      label={assetToBuySymbol}
      onPress={runOnUI(SwapNavigation.handleOutputPress)}
      rightIcon={'􀆏'}
      small
    />
  );
}

function SwapOutputAmount() {
  const { isDarkMode } = useColorMode();
  const { focusedInput, SwapTextStyles, SwapInputController, AnimatedSwapStyles } = useSwapContext();

  const outputAssetNativePrice = useSwapAssets(state => state.assetToBuyPrice) ?? '0';
  const outputAssetStablecoin = useSwapAssets(state => state.assetToBuy?.type === 'stablecoin');
  const assetToBuyColors = useSwapAssets(state => state.assetToBuy?.colors);

  const labelSecondary = useForegroundColor('labelSecondary');
  const zeroAmountColor = opacity(labelSecondary, 0.2);

  const bottomColor = useMemo(() => {
    return extractColorValueForColors({
      colors: assetToBuyColors as TokenColors,
      isDarkMode,
    });
  }, [assetToBuyColors, isDarkMode]);

  const formattedOutputAmount = useDerivedValue(() => {
    if (SwapInputController.inputMethod.value === 'slider' && SwapInputController.percentageToSwap.value === 0) return '0';

    if (
      SwapInputController.inputMethod.value === 'outputAmount' ||
      typeof SwapInputController.inputValues.value.outputAmount === 'string'
    ) {
      if (Number(SwapInputController.inputValues.value.outputAmount) === 0) return '0';

      return addCommasToNumber(SwapInputController.inputValues.value.outputAmount);
    }

    if (Number(SwapInputController.inputValues.value.outputAmount) === 0 || !Number(outputAssetNativePrice)) return '0';

    return valueBasedDecimalFormatter(
      SwapInputController.inputValues.value.outputAmount,
      Number(outputAssetNativePrice),
      'down',
      -1,
      outputAssetStablecoin,
      false
    );
  });

  const isOutputStale = useDerivedValue(() => {
    const isAdjustingInputValue =
      SwapInputController.inputMethod.value === 'inputAmount' ||
      SwapInputController.inputMethod.value === 'inputNativeValue' ||
      SwapInputController.inputMethod.value === 'slider';
    return SwapInputController.isQuoteStale.value === 1 && isAdjustingInputValue ? 1 : 0;
  });

  const pulsingOpacity = useDerivedValue(() => {
    return SwapInputController.isQuoteStale.value === 1
      ? withRepeat(withSequence(withTiming(0.5, pulsingConfig), withTiming(1, pulsingConfig)), -1, true)
      : withSpring(1, sliderConfig);
  }, []);

  const outputAmountTextStyle = useAnimatedStyle(() => {
    const isInputZero =
      Number(SwapInputController.inputValues.value.inputAmount) === 0 ||
      (SwapInputController.inputMethod.value === 'slider' && Number(SwapInputController.inputValues.value.inputAmount) === 0);
    const isOutputZero =
      (SwapInputController.inputValues.value.outputAmount === 0 && SwapInputController.inputMethod.value !== 'slider') ||
      (SwapInputController.inputMethod.value === 'slider' && Number(SwapInputController.inputValues.value.outputAmount) === 0);

    // eslint-disable-next-line no-nested-ternary
    const zeroOrAssetColor = isOutputZero ? zeroAmountColor : bottomColor === ETH_COLOR_DARK ? ETH_COLOR_DARK_ACCENT : bottomColor;
    const opacity = isOutputStale.value !== 1 || (isInputZero && isOutputZero) ? withSpring(1, sliderConfig) : pulsingOpacity.value;

    return {
      color: withTiming(interpolateColor(isOutputStale.value, [0, 1], [zeroOrAssetColor, zeroAmountColor]), slowFadeConfig),
      flexGrow: 0,
      flexShrink: 1,
      opacity,
    };
  }, [bottomColor, isDarkMode]);

  const assetToBuyCaretStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: bottomColor,
    };
  });

  return (
    <GestureHandlerV1Button
      disableButtonPressWrapper
      onPressStartWorklet={() => {
        'worklet';
        focusedInput.value = 'outputAmount';
      }}
    >
      <MaskedView maskElement={<FadeMask fadeEdgeInset={2} fadeWidth={8} height={36} side="right" />} style={styles.inputTextMask}>
        <AnimatedText
          ellipsizeMode="clip"
          numberOfLines={1}
          size="30pt"
          style={outputAmountTextStyle}
          text={formattedOutputAmount}
          weight="bold"
        />
        <Animated.View style={[styles.caretContainer, SwapTextStyles.outputCaretStyle]}>
          <Box as={Animated.View} borderRadius={1} style={[styles.caret, assetToBuyCaretStyle]} />
        </Animated.View>
      </MaskedView>
    </GestureHandlerV1Button>
  );
}

function SwapOutputNativeAmount() {
  const { SwapTextStyles, SwapInputController } = useSwapContext();

  const formattedOutputNativeValue = useDerivedValue(() => {
    if (
      (SwapInputController.inputMethod.value === 'slider' && SwapInputController.percentageToSwap.value === 0) ||
      Number(SwapInputController.inputValues.value.outputNativeValue) === 0 ||
      Number.isNaN(SwapInputController.inputValues.value.outputNativeValue)
    )
      return '$0.00';

    const nativeValue = `$${SwapInputController.inputValues.value.outputNativeValue.toLocaleString('en-US', {
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
      text={formattedOutputNativeValue}
      weight="heavy"
    />
  );
}

function SwapOutputIcon() {
  const { isDarkMode } = useColorMode();

  const assetToBuyIconUrl = useSwapAssets(state => state.assetToBuy?.icon_url);
  const assetToBuyChainId = useSwapAssets(state => state.assetToBuy?.chainId);
  const assetToBuySymbol = useSwapAssets(state => state.assetToBuy?.symbol);
  const assetToBuyAddress = useSwapAssets(state => state.assetToBuy?.address);
  const assetToBuyMainnetAddress = useSwapAssets(state => state.assetToBuy?.mainnetAddress);

  const assetToBuyColors = useSwapAssets(state => state.assetToBuy?.colors);

  const assetToBuyColor = useMemo(() => {
    return extractColorValueForColors({
      colors: assetToBuyColors as TokenColors,
      isDarkMode,
    });
  }, [assetToBuyColors, isDarkMode]);

  return (
    <Box paddingRight="10px">
      <SwapCoinIcon
        color={assetToBuyColor}
        iconUrl={assetToBuyIconUrl}
        address={assetToBuyAddress ?? ''}
        large
        mainnetAddress={assetToBuyMainnetAddress}
        network={ethereumUtils.getNetworkFromChainId(assetToBuyChainId ?? ChainId.mainnet)}
        symbol={assetToBuySymbol ?? ''}
      />
    </Box>
  );
}

function OutputAssetBalanceBadge() {
  const assetToBuy = useSwapAssets(state => state.assetToBuy);
  const userAssets = useAssetsToSell();

  const label = useDerivedValue(() => {
    if (!assetToBuy) return 'No balance';
    const userAsset = userAssets.find(userAsset => isSameAssetWorklet(userAsset, assetToBuy));
    return userAsset?.balance.display ?? 'No balance';
  });

  return <BalanceBadge label={label} />;
}

export function SwapOutputAsset() {
  const { isDarkMode } = useColorMode();

  const { outputProgress, inputProgress, AnimatedSwapStyles, SwapNavigation } = useSwapContext();

  const assetToBuyColors = useSwapAssets(state => state.assetToBuy?.colors);

  const color = useMemo(() => {
    return extractColorValueForColors({
      colors: assetToBuyColors as TokenColors,
      isDarkMode,
    });
  }, [assetToBuyColors, isDarkMode]);

  return (
    <SwapInput bottomInput color={color} otherInputProgress={inputProgress} progress={outputProgress}>
      <Box as={Animated.View} style={AnimatedSwapStyles.outputStyle}>
        <Stack space="16px">
          <Columns alignHorizontal="justify" alignVertical="center">
            <Column width="content">
              <SwapOutputIcon />
            </Column>
            <SwapOutputAmount />
            <Column width="content">
              <SwapOutputActionButton />
            </Column>
          </Columns>
          <Columns alignHorizontal="justify" alignVertical="center" space="10px">
            <SwapOutputNativeAmount />
            <Column width="content">
              <OutputAssetBalanceBadge />
            </Column>
          </Columns>
        </Stack>
      </Box>
      <Box
        as={Animated.View}
        height="full"
        padding={{ custom: INPUT_PADDING }}
        paddingBottom={{ custom: 14.5 }}
        position="absolute"
        style={AnimatedSwapStyles.outputTokenListStyle}
        width={{ custom: INPUT_INNER_WIDTH }}
      >
        <TokenList
          color={color}
          handleExitSearch={runOnUI(SwapNavigation.handleExitSearch)}
          handleFocusSearch={runOnUI(SwapNavigation.handleFocusOutputSearch)}
          output
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
