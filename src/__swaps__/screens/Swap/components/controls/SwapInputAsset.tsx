import MaskedView from '@react-native-masked-view/masked-view';
import React from 'react';
import { StyleSheet, StatusBar } from 'react-native';
import Animated, { runOnUI } from 'react-native-reanimated';
import { ScreenCornerRadius } from 'react-native-screen-corner-radius';

import { AnimatedText, Box, Column, Columns, Stack, useColorMode } from '@/design-system';
import { useTheme } from '@/theme';

import { GestureHandlerV1Button } from '../GestureHandlerV1Button';
import { SwapActionButton } from '../SwapActionButton';
import { SwapCoinIcon } from '../SwapCoinIcon';
import { FadeMask } from '../FadeMask';
import { SwapInput } from '../SwapInput';
import { BalanceBadge } from '../BalanceBadge';
import { TokenList } from '../TokenList/TokenList';
import {
  BASE_INPUT_WIDTH,
  ETH_COLOR_DARK,
  ETH_COLOR_DARK_ACCENT,
  INPUT_INNER_WIDTH,
  INPUT_PADDING,
  THICK_BORDER_WIDTH,
} from '../../constants';
import { INPUT_ADDRESS, INPUT_ASSET_BALANCE, INPUT_NETWORK, INPUT_SYMBOL } from '../../dummyValues';
import { IS_ANDROID } from '@/env';
import { useSwapContext } from '../../providers/swap-provider';
import { useSwapAssetStore } from '../../state/assets';
import { ethereumUtils } from '@/utils';

export function SwapInputAsset() {
  const { isDarkMode } = useColorMode();
  const theme = useTheme();

  const {
    topColor,
    outputProgress,
    inputProgress,
    solidColorCoinIcons,
    focusedInput,
    AnimatedSwapStyles,
    SwapTextStyles,
    SwapInputController,
    SwapNavigation,
    isInputSearchFocused,
    setIsInputSearchFocused,
  } = useSwapContext();

  const { assetToSell } = useSwapAssetStore();

  return (
    <SwapInput color={topColor} otherInputProgress={outputProgress} progress={inputProgress}>
      <Box as={Animated.View} style={AnimatedSwapStyles.inputStyle}>
        <Stack space="16px">
          <Columns alignHorizontal="justify" alignVertical="center">
            <Column width="content">
              <Box paddingRight="10px">
                {solidColorCoinIcons ? (
                  <Box
                    borderRadius={18}
                    height={{ custom: 36 }}
                    style={[
                      styles.solidColorCoinIcon,
                      {
                        backgroundColor: topColor,
                      },
                    ]}
                    width={{ custom: 36 }}
                  />
                ) : (
                  <SwapCoinIcon
                    address={assetToSell!.address}
                    large
                    mainnetAddress={assetToSell!.mainnetAddress}
                    network={ethereumUtils.getNetworkFromChainId(assetToSell!.chainId)}
                    symbol={assetToSell!.symbol}
                    theme={theme}
                  />
                )}
              </Box>
            </Column>
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
                  style={SwapTextStyles.inputAmountTextStyle}
                  text={SwapInputController.formattedInputAmount}
                  weight="bold"
                />
                <Animated.View style={[styles.caretContainer, SwapTextStyles.inputCaretStyle]}>
                  <Box
                    borderRadius={1}
                    style={[styles.caret, { backgroundColor: topColor === ETH_COLOR_DARK ? ETH_COLOR_DARK_ACCENT : topColor }]}
                  />
                </Animated.View>
              </MaskedView>
            </GestureHandlerV1Button>
            <Column width="content">
              <SwapActionButton
                color={topColor}
                disableShadow={isDarkMode}
                hugContent
                label={INPUT_SYMBOL}
                onPress={runOnUI(SwapNavigation.handleInputPress)}
                rightIcon="􀆏"
                small
              />
            </Column>
          </Columns>
          <Columns alignHorizontal="justify" alignVertical="center" space="10px">
            <AnimatedText
              numberOfLines={1}
              size="17pt"
              style={SwapTextStyles.inputNativeValueStyle}
              text={SwapInputController.formattedInputNativeValue}
              weight="heavy"
            />
            <Column width="content">
              <BalanceBadge
                label={`${INPUT_ASSET_BALANCE.toLocaleString('en-US', {
                  useGrouping: true,
                  maximumFractionDigits: 6,
                })} ${INPUT_SYMBOL}`}
              />
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
          color={topColor}
          handleExitSearch={runOnUI(SwapNavigation.handleExitSearch)}
          handleFocusSearch={runOnUI(SwapNavigation.handleFocusInputSearch)}
          isFocused={isInputSearchFocused}
          setIsFocused={setIsInputSearchFocused}
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
