/* eslint-disable no-nested-ternary */
import MaskedView from '@react-native-masked-view/masked-view';
import c from 'chroma-js';
import React from 'react';
import { StyleSheet, Text as RNText, StatusBar, Pressable } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import Animated, { runOnUI, useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { ScreenCornerRadius } from 'react-native-screen-corner-radius';

import { ButtonPressAnimation } from '@/components/animations';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { Page } from '@/components/layout';
import { Navbar } from '@/components/navbar/Navbar';
import { SheetGestureBlocker } from '@/components/sheet/SheetGestureBlocker';
import {
  AnimatedText,
  Bleed,
  Box,
  Column,
  Columns,
  IconContainer,
  Inset,
  Separator,
  Stack,
  Text,
  globalColors,
  useColorMode,
  useForegroundColor,
} from '@/design-system';
import { useAccountProfile } from '@/hooks';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useTheme } from '@/theme';
import { safeAreaInsetValues } from '@/utils';

import { GestureHandlerButton } from './components/GestureHandlerButton';
import { SwapActionButton } from './components/SwapActionButton';
import { SwapCoinIcon } from './components/SwapCoinIcon';
import { SwapNumberPad } from './components/SwapNumberPad';
import { SwapSlider } from './components/SwapSlider';
import { GasButton } from './components/GasButton';
import { FadeMask } from './components/FadeMask';
import { SwapBackground } from './components/SwapBackground';
import { SwapInput } from './components/SwapInput';
import { BalanceBadge } from './components/BalanceBadge';
import { FlipButton } from './components/FlipButton';
import { TokenList } from './components/TokenList';
import { ExchangeRateBubble } from './components/ExchangeRateBubble';
import {
  BASE_INPUT_WIDTH,
  ETH_COLOR,
  ETH_COLOR_DARK,
  ETH_COLOR_DARK_ACCENT,
  INITIAL_SLIDER_POSITION,
  INPUT_INNER_WIDTH,
  INPUT_PADDING,
  LIGHT_SEPARATOR_COLOR,
  SEPARATOR_COLOR,
  SLIDER_COLLAPSED_HEIGHT,
  SLIDER_HEIGHT,
  SLIDER_WIDTH,
  THICK_BORDER_WIDTH,
} from './constants';
import {
  INPUT_ADDRESS,
  INPUT_ASSET_BALANCE,
  INPUT_ASSET_USD_PRICE,
  INPUT_NETWORK,
  INPUT_SYMBOL,
  OUTPUT_ADDRESS,
  OUTPUT_ASSET_USD_PRICE,
  OUTPUT_COLOR,
  OUTPUT_NETWORK,
  OUTPUT_SYMBOL,
} from './dummyValues';
import { useAnimatedSwapStyles } from './hooks/useAnimatedSwapStyles';
import { useSwapInputsController } from './hooks/useSwapInputsController';
import { useSwapNavigation } from './hooks/useSwapNavigation';
import { useSwapTextStyles } from './hooks/useSwapTextStyles';

import { inputKeys } from './types';
import { getHighContrastColor, opacity } from './utils';
import { IS_ANDROID, IS_IOS } from '@/env';

/** README
 * This prototype is largely driven by Reanimated and Gesture Handler, which
 * allows the UI to respond instantly when the user types into one of the four
 * swap inputs or drags the slider (these together make up the inputMethods).
 *
 * We use Gesture Handler for buttons and elements (number pad keys, the slider),
 * that when pressed or interacted with, need to modify an Animated value. We do
 * this to bypass the JS thread when responding to user input, which avoids all
 * bridge-related bottlenecks and the resulting UI lag.
 *
 * We rely on Reanimated’s useAnimatedReaction to observe changes to any of the
 * input values (the inputValues), and then respond as needed depending on the
 * entered value and the inputMethod associated with the change.
 * (useAnimatedReaction is like a useEffect, but it runs on the UI thread and can
 * respond instantly to changes in Animated values.)
 *
 * We use worklets to update and format values on the UI thread in real time.
 * Only after a user has modified one of the inputValues or released the slider,
 * will the updated quote parameters be sent to the JS thread, where a new quote
 * is fetched and the response is sent back to the UI thread.
 *
 * Up until that point, all user input and associated UI updates are handled on
 * the UI thread, and values in the UI are updated via Animated shared values
 * that are passed to AnimatedText components (equivalent to the Text component,
 * but capable of directly rendering Animated shared values).
 *
 * The implication of this is that once the UI is initialized, even if the JS
 * thread is fully blocked, it won’t block user input, and it won’t block the UI.
 * The UI will remain responsive up until it needs the result of a quote from the
 * JS thread.
 *
 * This approach has the added benefit of eliminating tons of otherwise necessary
 * re-renders, which further increases the speed of the swap flow.
 *
 * tldr, ⚡️ it’s fast ⚡️
 */

export function SwapScreen() {
  const { accountSymbol, accountColor, accountImage } = useAccountProfile();
  const { isDarkMode } = useColorMode();
  const { navigate, goBack } = useNavigation();
  const theme = useTheme();

  const inputProgress = useSharedValue(0);
  const outputProgress = useSharedValue(0);
  const sliderXPosition = useSharedValue(SLIDER_WIDTH * INITIAL_SLIDER_POSITION);
  const sliderPressProgress = useSharedValue(SLIDER_COLLAPSED_HEIGHT / SLIDER_HEIGHT);
  const focusedInput = useSharedValue<inputKeys>('inputAmount');

  const separatorSecondary = useForegroundColor('separatorSecondary');
  const separatorTertiary = useForegroundColor('separatorTertiary');

  const [topColor, setTopColor] = React.useState(isDarkMode ? ETH_COLOR_DARK : ETH_COLOR);
  const [bottomColor, setBottomColor] = React.useState(OUTPUT_COLOR);
  const [solidColorCoinIcons, setSolidColorCoinIcons] = React.useState(false);

  const [isFetching, setIsFetching] = React.useState(false);
  const [isInputSearchFocused, setIsInputSearchFocused] = React.useState(false);
  const [isOutputSearchFocused, setIsOutputSearchFocused] = React.useState(false);

  const {
    formattedInputAmount,
    formattedInputNativeValue,
    formattedOutputAmount,
    formattedOutputNativeValue,
    inputMethod,
    inputValues,
    isQuoteStale,
    onChangedPercentage,
    percentageToSwap,
  } = useSwapInputsController({
    focusedInput,
    inputAssetBalance: INPUT_ASSET_BALANCE,
    inputAssetUsdPrice: INPUT_ASSET_USD_PRICE,
    outputAssetUsdPrice: OUTPUT_ASSET_USD_PRICE,
    setIsFetching,
    sliderXPosition,
  });

  const {
    flipButtonStyle,
    focusedSearchStyle,
    hideWhenInputsExpanded,
    inputStyle,
    inputTokenListStyle,
    keyboardStyle,
    outputStyle,
    outputTokenListStyle,
  } = useAnimatedSwapStyles({ inputProgress, outputProgress });

  const { inputAmountTextStyle, inputCaretStyle, inputNativeValueStyle, outputAmountTextStyle, outputCaretStyle, outputNativeValueStyle } =
    useSwapTextStyles({
      bottomColor,
      focusedInput,
      inputMethod,
      inputProgress,
      inputValues,
      isQuoteStale,
      outputProgress,
      sliderPressProgress,
      topColor,
    });

  const { handleExitSearch, handleFocusInputSearch, handleFocusOutputSearch, handleInputPress, handleOutputPress } = useSwapNavigation({
    inputProgress,
    outputProgress,
  });

  // TODO: This needs to be refactored and moved
  const confirmButtonIcon = useDerivedValue(() => {
    const isInputZero = Number(inputValues.value.inputAmount) === 0;
    const isOutputZero = Number(inputValues.value.outputAmount) === 0;

    if (inputMethod.value !== 'slider' && (isInputZero || isOutputZero) && !isFetching) {
      return '';
    } else if (inputMethod.value === 'slider' && percentageToSwap.value === 0) {
      return '';
    } else {
      return '􀕹';
    }
  }, [isFetching]);

  const confirmButtonLabel = useDerivedValue(() => {
    const isInputZero = Number(inputValues.value.inputAmount) === 0;
    const isOutputZero = Number(inputValues.value.outputAmount) === 0;

    if (inputMethod.value !== 'slider' && (isInputZero || isOutputZero) && !isFetching) {
      return 'Enter Amount';
    } else if (inputMethod.value === 'slider' && percentageToSwap.value === 0) {
      return 'Enter Amount';
    } else {
      return 'Review';
    }
  }, [isFetching]);

  const confirmButtonIconStyle = useAnimatedStyle(() => {
    const isInputZero = Number(inputValues.value.inputAmount) === 0;
    const isOutputZero = Number(inputValues.value.outputAmount) === 0;

    const sliderCondition = inputMethod.value === 'slider' && percentageToSwap.value === 0;
    const inputCondition = inputMethod.value !== 'slider' && (isInputZero || isOutputZero) && !isFetching;

    const shouldHide = sliderCondition || inputCondition;

    return {
      display: shouldHide ? 'none' : 'flex',
    };
  });
  // END TODO

  const onChangeWallet = React.useCallback(() => {
    navigate(Routes.CHANGE_WALLET_SHEET);
  }, [navigate]);

  return (
    <SheetGestureBlocker disabled={!(isInputSearchFocused || isOutputSearchFocused)}>
      <Box as={Page} style={styles.rootViewBackground} testID="feed-screen" width="full">
        <SwapBackground bottomColor={bottomColor} topColor={topColor}>
          <Box alignItems="center" height="full" paddingTop={{ custom: 29 }} width="full">
            <SwapInput color={topColor} otherInputProgress={outputProgress} progress={inputProgress}>
              <Box as={Animated.View} style={inputStyle}>
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
                            address={INPUT_ADDRESS}
                            large
                            mainnetAddress={INPUT_ADDRESS}
                            network={INPUT_NETWORK}
                            symbol={INPUT_SYMBOL}
                            theme={theme}
                          />
                        )}
                      </Box>
                    </Column>
                    <GestureHandlerButton
                      disableButtonPressWrapper
                      onPressStartWorklet={() => {
                        'worklet';
                        focusedInput.value = 'inputAmount';
                      }}
                    >
                      <MaskedView
                        maskElement={<FadeMask fadeEdgeInset={2} fadeWidth={8} height={36} side="right" />}
                        style={styles.inputTextMask}
                      >
                        <AnimatedText
                          ellipsizeMode="clip"
                          numberOfLines={1}
                          size="30pt"
                          style={inputAmountTextStyle}
                          text={formattedInputAmount}
                          weight="bold"
                        />
                        <Animated.View style={[styles.caretContainer, inputCaretStyle]}>
                          <Box
                            borderRadius={1}
                            style={[styles.caret, { backgroundColor: topColor === ETH_COLOR_DARK ? ETH_COLOR_DARK_ACCENT : topColor }]}
                          />
                        </Animated.View>
                      </MaskedView>
                    </GestureHandlerButton>
                    <Column width="content">
                      <SwapActionButton
                        color={topColor}
                        disableShadow={isDarkMode}
                        hugContent
                        label={INPUT_SYMBOL}
                        onPress={runOnUI(handleInputPress)}
                        rightIcon="􀆏"
                        small
                      />
                    </Column>
                  </Columns>
                  <Columns alignHorizontal="justify" alignVertical="center" space="10px">
                    <AnimatedText
                      numberOfLines={1}
                      size="17pt"
                      style={inputNativeValueStyle}
                      text={formattedInputNativeValue}
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
                style={inputTokenListStyle}
                width={{ custom: INPUT_INNER_WIDTH }}
              >
                <TokenList
                  color={topColor}
                  handleExitSearch={runOnUI(handleExitSearch)}
                  handleFocusSearch={runOnUI(handleFocusInputSearch)}
                  isFocused={isInputSearchFocused}
                  setIsFocused={setIsInputSearchFocused}
                />
              </Box>
            </SwapInput>
            <FlipButton
              bottomColor={bottomColor}
              flipButtonStyle={flipButtonStyle}
              focusedSearchStyle={focusedSearchStyle}
              isFetching={isFetching}
            />
            <SwapInput bottomInput color={bottomColor} otherInputProgress={inputProgress} progress={outputProgress}>
              <Box as={Animated.View} style={outputStyle}>
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
                    <GestureHandlerButton
                      disableButtonPressWrapper
                      onPressStartWorklet={() => {
                        'worklet';
                        focusedInput.value = 'outputAmount';
                      }}
                    >
                      <MaskedView
                        maskElement={<FadeMask fadeEdgeInset={2} fadeWidth={8} height={36} side="right" />}
                        style={styles.inputTextMask}
                      >
                        <AnimatedText
                          ellipsizeMode="clip"
                          numberOfLines={1}
                          size="30pt"
                          style={outputAmountTextStyle}
                          text={formattedOutputAmount}
                          weight="bold"
                        />
                        <Animated.View style={[styles.caretContainer, outputCaretStyle]}>
                          <Box
                            borderRadius={1}
                            style={[
                              styles.caret,
                              { backgroundColor: bottomColor === ETH_COLOR_DARK ? ETH_COLOR_DARK_ACCENT : bottomColor },
                            ]}
                          />
                        </Animated.View>
                      </MaskedView>
                    </GestureHandlerButton>
                    <Column width="content">
                      <SwapActionButton
                        color={bottomColor}
                        disableShadow={isDarkMode}
                        hugContent
                        label={OUTPUT_SYMBOL}
                        onPress={runOnUI(handleOutputPress)}
                        rightIcon="􀆏"
                        small
                      />
                    </Column>
                  </Columns>
                  <Columns alignHorizontal="justify" alignVertical="center" space="10px">
                    <AnimatedText
                      numberOfLines={1}
                      size="17pt"
                      style={outputNativeValueStyle}
                      text={formattedOutputNativeValue}
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
                style={outputTokenListStyle}
                width={{ custom: INPUT_INNER_WIDTH }}
              >
                <TokenList
                  color={bottomColor}
                  handleExitSearch={runOnUI(handleExitSearch)}
                  handleFocusSearch={runOnUI(handleFocusOutputSearch)}
                  isFocused={isOutputSearchFocused}
                  output
                  setIsFocused={setIsOutputSearchFocused}
                />
              </Box>
            </SwapInput>
            <ButtonPressAnimation scaleTo={0.925} style={{ marginTop: 4 }}>
              <Box
                as={Animated.View}
                alignItems="center"
                justifyContent="center"
                paddingHorizontal="24px"
                paddingVertical="12px"
                style={[hideWhenInputsExpanded, { alignSelf: 'center' }]}
              >
                <ExchangeRateBubble />
              </Box>
            </ButtonPressAnimation>
            <Box
              alignItems="flex-end"
              as={Animated.View}
              bottom="0px"
              justifyContent="center"
              position="absolute"
              style={[{ flex: 1, flexDirection: 'column', gap: 16 }, keyboardStyle]}
              width="full"
            >
              <PanGestureHandler>
                <Box alignItems="center" style={{ flex: 1 }} width="full">
                  <SwapSlider
                    bottomColor={bottomColor}
                    coinIcon={
                      solidColorCoinIcons ? (
                        <Box
                          borderRadius={8}
                          height={{ custom: 16 }}
                          style={{ backgroundColor: topColor, opacity: 0.4 }}
                          width={{ custom: 16 }}
                        />
                      ) : (
                        <SwapCoinIcon
                          address={INPUT_ADDRESS}
                          mainnetAddress={INPUT_ADDRESS}
                          network={INPUT_NETWORK}
                          small
                          symbol={INPUT_SYMBOL}
                          theme={theme}
                        />
                      )
                    }
                    height={16}
                    inputMethod={inputMethod}
                    isQuoteStale={isQuoteStale}
                    onChange={onChangedPercentage}
                    pressProgress={sliderPressProgress}
                    snapPoints={[0, 0.25, 0.5, 0.75, 1]}
                    topColor={topColor}
                    width={SLIDER_WIDTH}
                    x={sliderXPosition}
                  />
                  <SwapNumberPad
                    focusedInput={focusedInput}
                    formattedInputValue={formattedInputAmount}
                    formattedOutputValue={formattedOutputAmount}
                    inputMethod={inputMethod}
                    inputValues={inputValues}
                  />
                </Box>
              </PanGestureHandler>
              <Box
                paddingBottom={{
                  custom: IS_ANDROID ? getSoftMenuBarHeight() - 24 : safeAreaInsetValues.bottom + 16,
                }}
                paddingHorizontal="20px"
                paddingTop={{ custom: 16 - THICK_BORDER_WIDTH }}
                style={{
                  backgroundColor: opacity(bottomColor, 0.03),
                  borderTopColor: opacity(bottomColor, 0.04),
                  borderTopWidth: THICK_BORDER_WIDTH,
                }}
                width="full"
              >
                <Columns alignVertical="center" space="12px">
                  <Column width="content">
                    <GasButton />
                  </Column>
                  <Column width="content">
                    <Box height={{ custom: 32 }}>
                      <Separator
                        color={{ custom: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR }}
                        direction="vertical"
                        thickness={1}
                      />
                    </Box>
                  </Column>
                  <SwapActionButton
                    color={bottomColor}
                    icon={confirmButtonIcon}
                    iconStyle={confirmButtonIconStyle}
                    label={confirmButtonLabel}
                    scaleTo={0.9}
                  />
                </Columns>
              </Box>
            </Box>
          </Box>
        </SwapBackground>
        <Box as={Animated.View} pointerEvents="box-none" position="absolute" style={focusedSearchStyle} top={{ custom: 0 }} width="full">
          {IS_ANDROID ? <Pressable onPress={goBack} style={[StyleSheet.absoluteFillObject]} /> : null}
          <Box
            borderRadius={5}
            height={{ custom: 5 }}
            marginBottom={{ custom: 4 }}
            style={{
              alignSelf: 'center',
              backgroundColor: isDarkMode ? globalColors.white50 : 'rgba(9, 17, 31, 0.28)',
            }}
            top={{ custom: safeAreaInsetValues.top + 6 }}
            width={{ custom: 36 }}
          />
          <Navbar
            hasStatusBarInset={IS_IOS}
            leftComponent={
              <ButtonPressAnimation onPress={onChangeWallet} scaleTo={0.8}>
                {accountImage ? (
                  <ImageAvatar image={accountImage} marginRight={10} size="header" />
                ) : (
                  <ContactAvatar color={accountColor} marginRight={10} size="small" value={accountSymbol} />
                )}
              </ButtonPressAnimation>
            }
            rightComponent={
              // TODO: This is temporarily hooked up to shuffle input/output colors
              <ButtonPressAnimation
                onLongPress={() => {
                  setBottomColor(OUTPUT_COLOR);
                  // setTopColor(INPUT_COLOR);
                  setTopColor(isDarkMode ? ETH_COLOR_DARK : ETH_COLOR);

                  if (solidColorCoinIcons) {
                    setSolidColorCoinIcons(false);
                  }
                }}
                onPress={() => {
                  const randomBottomColor = c.random().hex();
                  const randomTopColor = c.random().hex();

                  setBottomColor(getHighContrastColor(randomBottomColor, isDarkMode));
                  setTopColor(getHighContrastColor(randomTopColor, isDarkMode));

                  if (!solidColorCoinIcons) {
                    setSolidColorCoinIcons(true);
                  }
                }}
                scaleTo={0.8}
              >
                <Box
                  alignItems="center"
                  justifyContent="center"
                  style={[
                    styles.headerButton,
                    {
                      backgroundColor: isDarkMode ? separatorSecondary : opacity(separatorSecondary, 0.03),
                      borderColor: isDarkMode ? separatorTertiary : opacity(separatorTertiary, 0.01),
                    },
                  ]}
                >
                  <IconContainer opacity={0.8} size={34}>
                    <Bleed space={isDarkMode ? '12px' : undefined}>
                      <RNText style={isDarkMode ? styles.headerTextShadow : undefined}>
                        <Text
                          align="center"
                          color={isDarkMode ? 'label' : 'labelSecondary'}
                          size="icon 17px"
                          style={{ lineHeight: IS_IOS ? 33 : 17 }}
                          weight="regular"
                        >
                          􀣌
                        </Text>
                      </RNText>
                    </Bleed>
                  </IconContainer>
                </Box>
              </ButtonPressAnimation>
            }
            titleComponent={
              <Inset bottom={{ custom: IS_IOS ? 5.5 : 14 }}>
                <Text align="center" color="label" size="20pt" weight="heavy">
                  {i18n.t(i18n.l.swap.modal_types.swap)}
                </Text>
              </Inset>
            }
          />
        </Box>
      </Box>
    </SheetGestureBlocker>
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
