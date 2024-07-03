import { AnimatedText, Box, Column, Columns, Stack, useColorMode } from '@/design-system';
import MaskedView from '@react-native-masked-view/masked-view';
import React, { useCallback } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import Animated, { runOnJS, useDerivedValue } from 'react-native-reanimated';
import { ScreenCornerRadius } from 'react-native-screen-corner-radius';

import { AnimatedSwapCoinIcon } from '@/__swaps__/screens/Swap/components/AnimatedSwapCoinIcon';
import { BalanceBadge } from '@/__swaps__/screens/Swap/components/BalanceBadge';
import { FadeMask } from '@/__swaps__/screens/Swap/components/FadeMask';
import { GestureHandlerV1Button } from '@/__swaps__/screens/Swap/components/GestureHandlerV1Button';
import { SwapActionButton } from '@/__swaps__/screens/Swap/components/SwapActionButton';
import { SwapInput } from '@/__swaps__/screens/Swap/components/SwapInput';
import { TokenList } from '@/__swaps__/screens/Swap/components/TokenList/TokenList';
import { BASE_INPUT_WIDTH, INPUT_INNER_WIDTH, INPUT_PADDING, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { IS_ANDROID, IS_IOS } from '@/env';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { ChainId } from '@/__swaps__/types/chains';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { ethereumUtils } from '@/utils';

const SELECT_LABEL = i18n.t(i18n.l.swap.select);
const NO_BALANCE_LABEL = i18n.t(i18n.l.swap.no_balance);
const TOKEN_TO_GET_LABEL = i18n.t(i18n.l.swap.token_to_get);

function SwapOutputActionButton() {
  const { isDarkMode } = useColorMode();
  const { SwapNavigation, internalSelectedOutputAsset } = useSwapContext();

  const label = useDerivedValue(() => {
    const asset = internalSelectedOutputAsset.value;
    return asset?.symbol ?? (!asset ? SELECT_LABEL : '');
  });

  return (
    <SwapActionButton
      asset={internalSelectedOutputAsset}
      disableShadow={isDarkMode}
      hugContent
      label={label}
      onPressWorklet={SwapNavigation.handleOutputPress}
      rightIcon={'􀆏'}
      small
    />
  );
}

function SwapOutputAmount() {
  const { navigate } = useNavigation();
  const { focusedInput, SwapTextStyles, SwapInputController, AnimatedSwapStyles, outputQuotesAreDisabled } = useSwapContext();

  const handleTapWhileDisabled = useCallback(() => {
    const { inputAsset, outputAsset } = useSwapsStore.getState();
    const inputTokenSymbol = inputAsset?.symbol;
    const outputTokenSymbol = outputAsset?.symbol;
    const inputNetwork = ethereumUtils.getNetworkFromChainId(inputAsset?.chainId ?? ChainId.mainnet);
    const outputNetwork = ethereumUtils.getNetworkFromChainId(outputAsset?.chainId ?? ChainId.mainnet);
    const isCrosschainSwap = inputAsset?.chainId !== outputAsset?.chainId;
    const isBridgeSwap = inputTokenSymbol === outputTokenSymbol;

    navigate(Routes.EXPLAIN_SHEET, {
      inputToken: inputTokenSymbol,
      fromNetwork: inputNetwork,
      toNetwork: outputNetwork,
      isCrosschainSwap,
      isBridgeSwap,
      outputToken: outputTokenSymbol,
      type: 'output_disabled',
    });
  }, [navigate]);

  return (
    <GestureHandlerV1Button
      disableButtonPressWrapper
      onPressStartWorklet={() => {
        'worklet';
        if (outputQuotesAreDisabled.value) {
          runOnJS(handleTapWhileDisabled)();
        } else {
          focusedInput.value = 'outputAmount';
        }
      }}
    >
      <MaskedView maskElement={<FadeMask fadeEdgeInset={2} fadeWidth={8} height={36} side="right" />} style={styles.inputTextMask}>
        <AnimatedText ellipsizeMode="clip" numberOfLines={1} size="30pt" style={SwapTextStyles.outputAmountTextStyle} weight="bold">
          {SwapInputController.formattedOutputAmount}
        </AnimatedText>
        <Animated.View style={[styles.caretContainer, SwapTextStyles.outputCaretStyle]}>
          <Box as={Animated.View} borderRadius={1} style={[styles.caret, AnimatedSwapStyles.assetToBuyCaretStyle]} />
        </Animated.View>
      </MaskedView>
    </GestureHandlerV1Button>
  );
}

function SwapOutputIcon() {
  return (
    <Box paddingRight="10px">
      <AnimatedSwapCoinIcon assetType="output" large />
    </Box>
  );
}

function OutputAssetBalanceBadge() {
  const { internalSelectedOutputAsset } = useSwapContext();

  const label = useDerivedValue(() => {
    const asset = internalSelectedOutputAsset.value;
    const hasBalance = Number(asset?.balance.amount) > 0 && asset?.balance.display;
    const balance = (hasBalance && asset?.balance.display) || NO_BALANCE_LABEL;

    return asset ? balance : TOKEN_TO_GET_LABEL;
  });

  return <BalanceBadge label={label} />;
}

export function SwapOutputAsset() {
  const {
    outputProgress,
    inputProgress,
    AnimatedSwapStyles,
    SwapTextStyles,
    SwapInputController,
    internalSelectedOutputAsset,
    SwapNavigation,
  } = useSwapContext();

  return (
    <SwapInput asset={internalSelectedOutputAsset} bottomInput otherInputProgress={inputProgress} progress={outputProgress}>
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
            <AnimatedText numberOfLines={1} size="17pt" style={SwapTextStyles.outputNativeValueStyle} weight="heavy">
              {SwapInputController.formattedOutputNativeValue}
            </AnimatedText>
            <Column width="content">
              <OutputAssetBalanceBadge />
            </Column>
          </Columns>
        </Stack>
      </Box>
      <Box
        as={Animated.View}
        height="full"
        paddingTop={{ custom: INPUT_PADDING }}
        paddingBottom={{ custom: 14.5 }}
        position="absolute"
        style={AnimatedSwapStyles.outputTokenListStyle}
        width={{ custom: INPUT_INNER_WIDTH }}
      >
        <TokenList
          handleExitSearchWorklet={SwapNavigation.handleExitSearch}
          handleFocusSearchWorklet={SwapNavigation.handleFocusOutputSearch}
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
  staticInputContainerStyles: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 9,
  },
  staticInputStyles: {
    borderCurve: 'continuous',
    borderRadius: 30,
    borderWidth: IS_IOS ? THICK_BORDER_WIDTH : 0,
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
