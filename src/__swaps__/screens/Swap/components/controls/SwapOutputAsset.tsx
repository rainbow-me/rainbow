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
import { TokenList } from '../TokenList';
import {
  BASE_INPUT_WIDTH,
  ETH_COLOR_DARK,
  ETH_COLOR_DARK_ACCENT,
  INPUT_INNER_WIDTH,
  INPUT_PADDING,
  THICK_BORDER_WIDTH,
} from '../../constants';
import { OUTPUT_ADDRESS, OUTPUT_NETWORK, OUTPUT_SYMBOL } from '../../dummyValues';
import { IS_ANDROID } from '@/env';
import { useSwapContext } from '../../providers/swap-provider';
import { ParsedSearchAsset, RainbowAddressAssets } from '@/resources/assets/types';

export function SwapOutputAsset() {
  const { isDarkMode } = useColorMode();
  const theme = useTheme();

  const {
    bottomColor,
    outputProgress,
    inputProgress,
    solidColorCoinIcons,
    focusedInput,
    AnimatedSwapStyles,
    SwapTextStyles,
    SwapInputController,
    SwapNavigation,
    isOutputSearchFocused,
    setIsOutputSearchFocused,
  } = useSwapContext();

  return (
    <SwapInput bottomInput color={bottomColor} otherInputProgress={inputProgress} progress={outputProgress}>
      <Box as={Animated.View} style={AnimatedSwapStyles.outputStyle}>
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
                        backgroundColor: bottomColor,
                      },
                    ]}
                    width={{ custom: 36 }}
                  />
                ) : (
                  <SwapCoinIcon
                    address={OUTPUT_ADDRESS}
                    color={bottomColor}
                    large
                    mainnetAddress={OUTPUT_ADDRESS}
                    network={OUTPUT_NETWORK}
                    symbol={OUTPUT_SYMBOL}
                    theme={theme}
                  />
                )}
              </Box>
            </Column>
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
                  style={SwapTextStyles.outputAmountTextStyle}
                  text={SwapInputController.formattedOutputAmount}
                  weight="bold"
                />
                <Animated.View style={[styles.caretContainer, SwapTextStyles.outputCaretStyle]}>
                  <Box
                    borderRadius={1}
                    style={[styles.caret, { backgroundColor: bottomColor === ETH_COLOR_DARK ? ETH_COLOR_DARK_ACCENT : bottomColor }]}
                  />
                </Animated.View>
              </MaskedView>
            </GestureHandlerV1Button>
            <Column width="content">
              <SwapActionButton
                color={bottomColor}
                disableShadow={isDarkMode}
                hugContent
                label={OUTPUT_SYMBOL}
                onPress={runOnUI(SwapNavigation.handleOutputPress)}
                rightIcon="􀆏"
                small
              />
            </Column>
          </Columns>
          <Columns alignHorizontal="justify" alignVertical="center" space="10px">
            <AnimatedText
              numberOfLines={1}
              size="17pt"
              style={SwapTextStyles.outputNativeValueStyle}
              text={SwapInputController.formattedOutputNativeValue}
              weight="heavy"
            />
            <Column width="content">
              <BalanceBadge label="No Balance" />
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
          color={bottomColor}
          handleExitSearch={runOnUI(SwapNavigation.handleExitSearch)}
          handleFocusSearch={runOnUI(SwapNavigation.handleFocusOutputSearch)}
          isFocused={isOutputSearchFocused}
          output
          setIsFocused={setIsOutputSearchFocused}
          assets={{} as ParsedSearchAsset[]}
          onSelectAsset={() => {}}
          onFilter={() => {}}
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
