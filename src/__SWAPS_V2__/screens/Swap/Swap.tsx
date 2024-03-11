/* eslint-disable no-nested-ternary */
import { BlurView } from '@react-native-community/blur';
import MaskedView from '@react-native-masked-view/masked-view';
import c from 'chroma-js';
import React, { ReactNode, useMemo } from 'react';
import { StyleSheet, Text as RNText, ScrollView, TextInput, ViewStyle, StatusBar, Pressable } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  AnimateStyle,
  SharedValue,
  interpolate,
  interpolateColor,
  runOnUI,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ScreenCornerRadius } from 'react-native-screen-corner-radius';
import { Address } from 'viem';

import SwapSpinner from '@/assets/swapSpinner.png';
import { ButtonPressAnimation } from '@/components/animations';
import { AnimatedSpinner, spinnerExitConfig } from '@/components/animations/AnimatedSpinner';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { Page } from '@/components/layout';
import { Input } from '@/components/inputs';
import { Navbar, navbarHeight } from '@/components/navbar/Navbar';
import { SheetGestureBlocker } from '@/components/sheet/SheetGestureBlocker';
import {
  AnimatedText,
  Bleed,
  Box,
  Column,
  Columns,
  HitSlop,
  IconContainer,
  Inline,
  Inset,
  Separator,
  Stack,
  Text,
  TextIcon,
  globalColors,
  useColorMode,
  useForegroundColor,
} from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { TextWeight } from '@/design-system/components/Text/Text';
import { TextSize } from '@/design-system/typography/typeHierarchy';
import { useAccountAccentColor, useAccountProfile, useDimensions } from '@/hooks';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { Network } from '@/networks/types';
import { colors } from '@/styles';
import { useTheme } from '@/theme';
import { safeAreaInsetValues } from '@/utils';

import { GestureHandlerButton } from './components/GestureHandlerButton';
import { SwapActionButton } from './components/SwapActionButton';
import { SwapCoinIcon } from './components/SwapCoinIcon';
import { SwapNumberPad } from './components/SwapNumberPad';
import { SwapSlider } from './components/SwapSlider';
import {
  BASE_INPUT_HEIGHT,
  BASE_INPUT_WIDTH,
  ETH_COLOR,
  ETH_COLOR_DARK,
  ETH_COLOR_DARK_ACCENT,
  EXPANDED_INPUT_HEIGHT,
  FOCUSED_INPUT_HEIGHT,
  INITIAL_SLIDER_POSITION,
  INPUT_INNER_WIDTH,
  INPUT_PADDING,
  LIGHT_SEPARATOR_COLOR,
  SEPARATOR_COLOR,
  SLIDER_COLLAPSED_HEIGHT,
  SLIDER_HEIGHT,
  SLIDER_WIDTH,
  THICK_BORDER_WIDTH,
  fadeConfig,
  springConfig,
} from './constants';
import {
  DAI_ADDRESS,
  ETH_ADDRESS,
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
  USDC_ADDRESS,
} from './dummyValues';
import { useAnimatedSwapStyles, useSwapInputsController, useSwapNavigation, useSwapTextStyles } from './hooks/swapHooks';
import { inputKeys } from './types';
import { getHighContrastColor, getTintedBackgroundColor, opacity } from './utils';
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
                        <AnimatedText size="30pt" style={inputAmountTextStyle} text={formattedInputAmount} weight="bold" />
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
                        <AnimatedText size="30pt" style={outputAmountTextStyle} text={formattedOutputAmount} weight="bold" />
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

// TODO: Should move the components below to their own files, but some of the
// wrappers and code in SwapScreen above should be moved out to components, so
// leaving it all here for now

const SwapBackground = ({
  bottomColor,
  children,
  topColor,
}: {
  bottomColor: string | undefined;
  children: ReactNode;
  topColor: string | undefined;
}) => {
  const { height: deviceHeight, width: deviceWidth } = useDimensions();
  const { isDarkMode } = useColorMode();

  const fallbackColor = isDarkMode ? ETH_COLOR_DARK : ETH_COLOR;

  const bottomColorDarkened = useMemo(
    () => getTintedBackgroundColor(bottomColor || fallbackColor, isDarkMode),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bottomColor, isDarkMode]
  );
  const topColorDarkened = useMemo(
    () => getTintedBackgroundColor(topColor || fallbackColor, isDarkMode),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDarkMode, topColor]
  );

  return (
    <Box
      alignItems="center"
      as={LinearGradient}
      borderRadius={IS_ANDROID ? 20 : ScreenCornerRadius}
      colors={[topColorDarkened, bottomColorDarkened]}
      end={{ x: 0.5, y: 1 }}
      height={{ custom: deviceHeight + (IS_ANDROID ? 24 : 0) }}
      justifyContent="center"
      paddingTop={{ custom: safeAreaInsetValues.top + (navbarHeight - 12) }}
      start={{ x: 0.5, y: 0 }}
      style={{ backgroundColor: topColor }}
      width={{ custom: deviceWidth }}
    >
      {children}
    </Box>
  );
};

const useSwapInputStyles = ({
  bottomInput,
  color,
  otherInputProgress,
  progress,
}: {
  bottomInput: boolean | undefined;
  color: string;
  otherInputProgress: Animated.SharedValue<number>;
  progress: Animated.SharedValue<number>;
}) => {
  const { isDarkMode } = useColorMode();

  const { bgColor, expandedBgColor, strokeColor, expandedStrokeColor, mixedShadowColor } = useMemo(() => {
    const bgColor = isDarkMode ? opacity(color, 0.08) : opacity(globalColors.white100, 0.8);
    const expandedBgColor = isDarkMode ? bgColor : opacity(globalColors.white100, 0.8);
    const strokeColor = isDarkMode ? opacity(color === ETH_COLOR_DARK ? ETH_COLOR_DARK_ACCENT : color, 0.06) : globalColors.white100;
    const expandedStrokeColor = isDarkMode ? opacity(color, 0.1) : globalColors.white100;
    const mixedShadowColor = isDarkMode ? 'transparent' : c.mix(color, globalColors.grey100, 0.84).hex();

    return {
      bgColor,
      expandedBgColor,
      strokeColor,
      expandedStrokeColor,
      mixedShadowColor,
    };
  }, [color, isDarkMode]);

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: otherInputProgress.value === 2 ? withTiming(0, fadeConfig) : withTiming(1, fadeConfig),
      transform: [
        {
          translateY:
            progress.value === 2
              ? bottomInput
                ? withSpring(-191, springConfig)
                : withSpring(-77, springConfig)
              : withSpring(0, springConfig),
        },
      ],
    };
  }, [bottomInput, otherInputProgress, progress]);

  const inputStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(interpolateColor(progress.value, [0, 1], [bgColor, expandedBgColor]), fadeConfig),
      borderColor: withTiming(interpolateColor(progress.value, [0, 1], [strokeColor, expandedStrokeColor]), fadeConfig),
      height: withSpring(
        interpolate(progress.value, [0, 1, 2], [BASE_INPUT_HEIGHT, EXPANDED_INPUT_HEIGHT, FOCUSED_INPUT_HEIGHT], 'clamp'),
        springConfig
      ),
      transform: [
        {
          translateY: bottomInput
            ? withSpring(
                interpolate(otherInputProgress.value, [0, 1, 2], [0, 0, EXPANDED_INPUT_HEIGHT - FOCUSED_INPUT_HEIGHT], 'clamp'),
                springConfig
              )
            : 0,
        },
      ],
    };
  }, [bottomInput, otherInputProgress, progress, bgColor, expandedBgColor, strokeColor, expandedStrokeColor]);

  return { containerStyle, inputStyle, mixedShadowColor };
};

const GasButton = ({ accentColor }: { accentColor?: string }) => {
  return (
    <ButtonPressAnimation>
      <Stack space="12px">
        <Inline alignVertical="center" space={{ custom: 5 }}>
          <Inline alignVertical="center" space="4px">
            <TextIcon
              color={accentColor ? { custom: accentColor } : 'red'}
              height={10}
              size="icon 12px"
              textStyle={{ marginTop: -1.5 }}
              width={16}
              weight="bold"
            >
              􀙭
            </TextIcon>
            <Text color="label" size="15pt" weight="heavy">
              Fast
            </Text>
          </Inline>
          <TextIcon color="labelSecondary" height={10} size="icon 13px" weight="bold" width={12}>
            􀆏
          </TextIcon>
        </Inline>
        <Inline alignVertical="center" space="4px">
          <TextIcon color="labelQuaternary" height={10} size="icon 11px" weight="heavy" width={16}>
            􀵟
          </TextIcon>
          <Text color="labelTertiary" size="15pt" weight="bold">
            $12.28
          </Text>
        </Inline>
      </Stack>
    </ButtonPressAnimation>
  );
};

export const SwapInput = ({
  children,
  color,
  bottomInput,
  otherInputProgress,
  progress,
}: {
  children?: ReactNode;
  color: string | undefined;
  bottomInput?: boolean;
  otherInputProgress: SharedValue<number>;
  progress: SharedValue<number>;
}) => {
  const { isDarkMode } = useColorMode();

  const colorWithFallback = useMemo(() => color || (isDarkMode ? ETH_COLOR_DARK : ETH_COLOR), [color, isDarkMode]);

  const { inputStyle, containerStyle, mixedShadowColor } = useSwapInputStyles({
    bottomInput,
    color: colorWithFallback,
    otherInputProgress,
    progress,
  });

  return (
    <Box
      as={Animated.View}
      style={[containerStyle, styles.staticInputContainerStyles, { shadowColor: mixedShadowColor }]}
      width={{ custom: BASE_INPUT_WIDTH }}
    >
      <Box as={Animated.View} style={[inputStyle, styles.staticInputStyles]}>
        {children}
      </Box>
    </Box>
  );
};

const BalanceBadge = ({ color, label, weight }: { color?: TextColor; label: string; weight?: TextWeight }) => {
  const { isDarkMode } = useColorMode();

  return (
    <Bleed vertical={{ custom: 5.5 }}>
      <Box
        alignItems="center"
        borderRadius={8.5}
        height={{ custom: 20 }}
        justifyContent="center"
        paddingHorizontal={{ custom: 5 }}
        style={{
          borderColor: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR,
          borderWidth: THICK_BORDER_WIDTH,
        }}
      >
        <Text
          align="center"
          color={color || 'labelQuaternary'}
          size="13pt"
          style={{
            opacity: label === 'No Balance' ? (isDarkMode ? 0.6 : 0.75) : undefined,
          }}
          weight={weight || 'bold'}
        >
          {label}
        </Text>
      </Box>
    </Bleed>
  );
};

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

const FlipButton = ({
  bottomColor,
  flipButtonStyle,
  focusedSearchStyle,
  isFetching,
}: {
  bottomColor: string;
  flipButtonStyle: AnimateStyle<ViewStyle>;
  focusedSearchStyle: AnimateStyle<ViewStyle>;
  isFetching: boolean;
}) => {
  const { isDarkMode } = useColorMode();

  const fetchingStyle = useAnimatedStyle(() => {
    return {
      borderWidth: isFetching ? withTiming(2, { duration: 300 }) : withTiming(THICK_BORDER_WIDTH, spinnerExitConfig),
    };
  });

  return (
    <Box
      alignItems="center"
      as={Animated.View}
      justifyContent="center"
      style={[flipButtonStyle, focusedSearchStyle, { height: 12, width: 28, zIndex: 10 }]}
    >
      <Box
        style={{
          shadowColor: isDarkMode ? globalColors.grey100 : c.mix(bottomColor, colors.dark, 0.84).hex(),
          shadowOffset: {
            width: 0,
            height: isDarkMode ? 4 : 4,
          },
          elevation: 8,
          shadowOpacity: isDarkMode ? 0.3 : 0.1,
          shadowRadius: isDarkMode ? 6 : 8,
        }}
      >
        <ButtonPressAnimation scaleTo={0.8} style={{ paddingHorizontal: 20, paddingVertical: 8 }}>
          <Box
            alignItems="center"
            as={AnimatedBlurView}
            blurAmount={10}
            blurType={isDarkMode ? undefined : 'light'}
            justifyContent="center"
            style={[
              fetchingStyle,
              styles.flipButton,
              {
                borderColor: isDarkMode ? SEPARATOR_COLOR : opacity(globalColors.white100, 0.5),
              },
            ]}
          >
            <IconContainer size={24} opacity={isDarkMode ? 0.6 : 0.8}>
              <Box alignItems="center" justifyContent="center">
                <Bleed bottom={{ custom: 0.5 }}>
                  <Text align="center" color="labelTertiary" size="icon 13px" weight="heavy">
                    􀆈
                  </Text>
                </Bleed>
              </Box>
            </IconContainer>
          </Box>
        </ButtonPressAnimation>
      </Box>
      <Box pointerEvents="none" position="absolute">
        <AnimatedSpinner color={bottomColor} isLoading={isFetching} scaleInFrom={1} size={32} src={SwapSpinner} />
      </Box>
    </Box>
  );
};

const TokenList = ({
  color,
  handleExitSearch,
  handleFocusSearch,
  isFocused,
  output,
  setIsFocused,
}: {
  color: string;
  handleExitSearch: () => void;
  handleFocusSearch: () => void;
  isFocused: boolean;
  output?: boolean;
  setIsFocused: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { accentColor: accountColor } = useAccountAccentColor();
  const { isDarkMode } = useColorMode();
  const { width: deviceWidth } = useDimensions();
  const theme = useTheme();

  const blue = useForegroundColor('blue');
  const red = useForegroundColor('red');

  const accentColor = useMemo(() => {
    if (c.contrast(accountColor, isDarkMode ? '#191A1C' : globalColors.white100) < (isDarkMode ? 2.125 : 1.5)) {
      const shiftedColor = isDarkMode ? c(accountColor).brighten(1).saturate(0.5).css() : c(accountColor).darken(0.5).saturate(0.5).css();
      return shiftedColor;
    } else {
      return accountColor;
    }
  }, [accountColor, isDarkMode]);

  return (
    <Stack>
      <Stack space="20px">
        <SearchInput
          color={color}
          handleExitSearch={handleExitSearch}
          handleFocusSearch={handleFocusSearch}
          isFocused={isFocused}
          output={output}
          setIsFocused={setIsFocused}
        />
        <Separator color="separatorTertiary" thickness={1} />
      </Stack>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: isFocused ? EXPANDED_INPUT_HEIGHT - FOCUSED_INPUT_HEIGHT + 20 : 20,
          paddingTop: 20,
        }}
        showsVerticalScrollIndicator={false}
        style={{
          alignSelf: 'center',
          height: EXPANDED_INPUT_HEIGHT - 77,
          paddingHorizontal: 20,
          width: deviceWidth - 24,
        }}
      >
        <Stack space={output ? '28px' : '20px'}>
          <Stack space="20px">
            <Inline alignHorizontal="justify" alignVertical="center">
              {output ? (
                <Inline alignVertical="center" space="6px">
                  <Bleed vertical="4px">
                    <Box alignItems="center" justifyContent="center" marginBottom={{ custom: -0.5 }} width={{ custom: 16 }}>
                      <Bleed space={isDarkMode ? '16px' : undefined}>
                        <RNText
                          style={
                            isDarkMode
                              ? [
                                  styles.textIconGlow,
                                  {
                                    textShadowColor: opacity(red, 0.28),
                                  },
                                ]
                              : undefined
                          }
                        >
                          <Text align="center" color="red" size="icon 13px" weight="heavy">
                            􀙬
                          </Text>
                        </RNText>
                      </Bleed>
                    </Box>
                  </Bleed>
                  <Text color="label" size="15pt" weight="heavy">
                    Trending
                  </Text>
                </Inline>
              ) : (
                <Inline alignVertical="center" space="6px">
                  <Bleed vertical="4px">
                    <Box alignItems="center" justifyContent="center" width={{ custom: 18 }}>
                      <Bleed space={isDarkMode ? '16px' : undefined}>
                        <RNText
                          style={
                            isDarkMode
                              ? [
                                  styles.textIconGlow,
                                  {
                                    textShadowColor: opacity(accentColor, 0.2),
                                  },
                                ]
                              : undefined
                          }
                        >
                          <Text align="center" color={{ custom: accentColor }} size="icon 13px" weight="black">
                            􀣽
                          </Text>
                        </RNText>
                      </Bleed>
                    </Box>
                  </Bleed>
                  <Text color="label" size="15pt" weight="heavy">
                    My Tokens
                  </Text>
                </Inline>
              )}
              <ButtonPressAnimation>
                <HitSlop space="10px">
                  <Inline alignVertical="center" space="6px" wrap={false}>
                    {output && <SwapCoinIcon address={ETH_ADDRESS} network={Network.mainnet} small symbol="ETH" theme={theme} />}
                    <Text align="right" color={isDarkMode ? 'labelSecondary' : 'label'} size="15pt" weight="heavy">
                      {output ? 'Ethereum' : 'All Networks'}
                    </Text>
                    <Text align="center" color={isDarkMode ? 'labelTertiary' : 'labelSecondary'} size="icon 13px" weight="bold">
                      􀆏
                    </Text>
                  </Inline>
                </HitSlop>
              </ButtonPressAnimation>
            </Inline>
            <CoinRow
              address={ETH_ADDRESS}
              balance="7"
              isTrending={output}
              name="Ethereum"
              nativeBalance="$18,320"
              output={output}
              symbol="ETH"
            />
            <CoinRow
              address={USDC_ADDRESS}
              balance="2,640"
              isTrending={output}
              name="USD Coin"
              nativeBalance="$2,640"
              output={output}
              symbol="USDC"
            />
            <CoinRow
              address={DAI_ADDRESS}
              balance="2,800.02"
              isTrending={output}
              name="Dai"
              nativeBalance="$2,800"
              output={output}
              symbol="DAI"
            />
          </Stack>
          <Stack space="20px">
            {output && (
              <Inline alignVertical="center" space="6px">
                <Bleed vertical="4px">
                  <Box alignItems="center" justifyContent="center" width={{ custom: 16 }}>
                    <Bleed space={isDarkMode ? '16px' : undefined}>
                      <RNText
                        style={
                          isDarkMode
                            ? [
                                styles.textIconGlow,
                                {
                                  textShadowColor: opacity(blue, 0.28),
                                },
                              ]
                            : undefined
                        }
                      >
                        <Text align="center" color="blue" size="icon 13px" weight="heavy">
                          􀐫
                        </Text>
                      </RNText>
                    </Bleed>
                  </Box>
                </Bleed>
                <Text color="label" size="15pt" weight="heavy">
                  Recent
                </Text>
              </Inline>
            )}
            <CoinRow
              address="0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9"
              balance="428.25"
              name="Aave"
              nativeBalance="$1,400"
              output={output}
              symbol="AAVE"
            />
            <CoinRow
              address="0x2260fac5e5542a773aa44fbcfedf7c193bc2c599"
              balance="0.042819"
              name="Wrapped Bitcoin"
              nativeBalance="$1,025"
              output={output}
              symbol="WBTC"
            />
            <CoinRow
              address="0xc00e94cb662c3520282e6f5717214004a7f26888"
              balance="72.2806"
              name="Compound"
              nativeBalance="$350.04"
              output={output}
              symbol="COMP"
            />
            <CoinRow
              address="0x1f9840a85d5af5bf1d1762f925bdaddc4201f984"
              balance="62.82"
              name="Uniswap"
              nativeBalance="$289.52"
              output={output}
              symbol="UNI"
            />
            <CoinRow
              address="0x514910771af9ca656af840dff83e8264ecf986ca"
              balance="27.259"
              name="Chainlink"
              nativeBalance="$87.50"
              output={output}
              symbol="LINK"
            />
          </Stack>
        </Stack>
      </ScrollView>
    </Stack>
  );
};

const SearchInput = ({
  color,
  handleExitSearch,
  handleFocusSearch,
  isFocused,
  output,
  setIsFocused,
}: {
  color: string;
  handleExitSearch: () => void;
  handleFocusSearch: () => void;
  isFocused?: boolean;
  output?: boolean;
  setIsFocused: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { isDarkMode } = useColorMode();

  const inputRef = React.useRef<TextInput>(null);
  const [query, setQuery] = React.useState('');

  const fillTertiary = useForegroundColor('fillTertiary');
  const label = useForegroundColor('label');
  const labelQuaternary = useForegroundColor('labelQuaternary');

  return (
    <Box width="full">
      <Columns alignHorizontal="justify" alignVertical="center" space="20px">
        <Box>
          <Bleed horizontal="8px" vertical="24px">
            <Box paddingHorizontal="8px" paddingVertical="20px">
              <Columns alignVertical="center" space="10px">
                <Column width="content">
                  <Box
                    alignItems="center"
                    borderRadius={18}
                    height={{ custom: 36 }}
                    justifyContent="center"
                    style={{
                      backgroundColor: isDarkMode ? 'transparent' : opacity(fillTertiary, 0.03),
                      borderColor: isDarkMode ? SEPARATOR_COLOR : opacity(LIGHT_SEPARATOR_COLOR, 0.01),
                      borderWidth: THICK_BORDER_WIDTH,
                    }}
                    width={{ custom: 36 }}
                  >
                    <Text align="center" color="labelQuaternary" size="icon 17px" weight="bold">
                      􀊫
                    </Text>
                  </Box>
                </Column>
                <Input
                  onBlur={() => {
                    handleExitSearch();
                    setIsFocused(false);
                  }}
                  onChange={(value: string) => setQuery(value)}
                  onFocus={() => {
                    handleFocusSearch();
                    setIsFocused(true);
                  }}
                  placeholder={output ? 'Find a token to buy' : 'Search your tokens'}
                  placeholderTextColor={isDarkMode ? opacity(labelQuaternary, 0.3) : labelQuaternary}
                  ref={inputRef}
                  selectionColor={color}
                  spellCheck={false}
                  style={{
                    color: label,
                    fontSize: 17,
                    fontWeight: 'bold',
                    height: 44,
                    zIndex: 10,
                  }}
                  value={query}
                />
              </Columns>
            </Box>
          </Bleed>
        </Box>
        <Column width="content">
          <ButtonPressAnimation
            onPress={() => {
              if (!isFocused) {
                handleExitSearch();
              } else {
                inputRef.current?.blur();
                setIsFocused(false);
              }
            }}
            scaleTo={0.8}
          >
            <Box
              alignItems="center"
              borderRadius={18}
              height={{ custom: 36 }}
              justifyContent="center"
              paddingHorizontal={{ custom: 12 - THICK_BORDER_WIDTH }}
              style={{
                backgroundColor: opacity(color, isDarkMode ? 0.1 : 0.08),
                borderColor: opacity(color, isDarkMode ? 0.06 : 0.01),
                borderWidth: THICK_BORDER_WIDTH,
              }}
            >
              <Text align="center" color={{ custom: color }} size="17pt" weight="heavy">
                {isFocused ? 'Cancel' : 'Close'}
              </Text>
            </Box>
          </ButtonPressAnimation>
        </Column>
      </Columns>
    </Box>
  );
};

const CoinRow = ({
  address,
  balance,
  isTrending,
  name,
  nativeBalance,
  onPress,
  output,
  symbol,
}: {
  address: Address | 'eth';
  balance: string;
  isTrending?: boolean;
  name: string;
  nativeBalance: string;
  onPress?: () => void;
  output?: boolean;
  symbol: string;
}) => {
  const theme = useTheme();

  const percentChange = useMemo(() => {
    if (isTrending) {
      const rawChange = Math.random() * 30;
      const isNegative = Math.random() < 0.2;
      const prefix = isNegative ? '-' : '+';
      const color: TextColor = isNegative ? 'red' : 'green';
      const change = `${rawChange.toFixed(1)}%`;

      return { change, color, prefix };
    }
  }, [isTrending]);

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.95}>
      <HitSlop vertical="10px">
        <Box alignItems="center" flexDirection="row" justifyContent="space-between" width="full">
          <Inline alignVertical="center" space="10px">
            <SwapCoinIcon address={address} large network={Network.mainnet} symbol={symbol} theme={theme} />
            <Stack space="10px">
              <Text color="label" size="17pt" weight="semibold">
                {name}
              </Text>
              <Inline alignVertical="center" space={{ custom: 5 }}>
                <Text color="labelTertiary" size="13pt" weight="semibold">
                  {output ? symbol : `${balance} ${symbol}`}
                </Text>
                {isTrending && percentChange && (
                  <Inline alignVertical="center" space={{ custom: 1 }}>
                    <Text align="center" color={percentChange.color} size="12pt" weight="bold">
                      {percentChange.prefix}
                    </Text>
                    <Text color={percentChange.color} size="13pt" weight="semibold">
                      {percentChange.change}
                    </Text>
                  </Inline>
                )}
              </Inline>
            </Stack>
          </Inline>
          {output ? (
            <Inline space="8px">
              <CoinRowButton icon="􀅳" outline size="icon 14px" />
              <CoinRowButton icon="􀋃" weight="black" />
            </Inline>
          ) : (
            <BalancePill balance={nativeBalance} />
          )}
        </Box>
      </HitSlop>
    </ButtonPressAnimation>
  );
};

const BalancePill = ({ balance }: { balance: string }) => {
  const { isDarkMode } = useColorMode();

  return (
    <Box
      alignItems="center"
      borderRadius={14}
      height={{ custom: 28 }}
      justifyContent="center"
      paddingHorizontal={{ custom: 8 - THICK_BORDER_WIDTH }}
      style={{
        backgroundColor: 'transparent',
        borderColor: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR,
        borderCurve: 'continuous',
        borderWidth: THICK_BORDER_WIDTH,
        overflow: 'hidden',
      }}
    >
      <Text align="center" color="labelTertiary" size="15pt" weight="bold">
        {balance}
      </Text>
    </Box>
  );
};

const ExchangeRateBubble = () => {
  const { isDarkMode } = useColorMode();

  const fillTertiary = useForegroundColor('fillTertiary');

  return (
    <Box
      alignItems="center"
      borderRadius={15}
      height={{ custom: 30 }}
      justifyContent="center"
      paddingHorizontal="10px"
      style={{ borderColor: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR, borderWidth: THICK_BORDER_WIDTH }}
    >
      <Inline alignHorizontal="center" alignVertical="center" space="6px" wrap={false}>
        <Text align="center" color="labelQuaternary" size="13pt" style={{ opacity: isDarkMode ? 0.6 : 0.75 }} weight="heavy">
          1 ETH
        </Text>
        <Box
          borderRadius={10}
          height={{ custom: 20 }}
          paddingTop={{ custom: 0.25 }}
          style={{ backgroundColor: opacity(fillTertiary, 0.04) }}
          width={{ custom: 20 }}
        >
          <TextIcon color="labelQuaternary" containerSize={20} opacity={isDarkMode ? 0.6 : 0.75} size="icon 10px" weight="heavy">
            􀄭
          </TextIcon>
        </Box>
        <Text align="center" color="labelQuaternary" size="13pt" style={{ opacity: isDarkMode ? 0.6 : 0.75 }} weight="heavy">
          1,624.04 USDC
        </Text>
      </Inline>
    </Box>
  );
};

const CoinRowButton = ({
  icon,
  onPress,
  outline,
  size,
  weight,
}: {
  icon: string;
  onPress?: () => void;
  outline?: boolean;
  size?: TextSize;
  weight?: TextWeight;
}) => {
  const { isDarkMode } = useColorMode();
  const fillTertiary = useForegroundColor('fillTertiary');
  const fillQuaternary = useForegroundColor('fillQuaternary');
  const separatorTertiary = useForegroundColor('separatorTertiary');

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.8}>
      <Box
        alignItems="center"
        borderRadius={14}
        height={{ custom: 28 }}
        justifyContent="center"
        style={{
          backgroundColor: outline ? 'transparent' : isDarkMode ? fillQuaternary : opacity(fillTertiary, 0.04),
          borderColor: outline ? (isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR) : separatorTertiary,
          borderWidth: THICK_BORDER_WIDTH,
        }}
        width={{ custom: 28 }}
      >
        <TextIcon
          color="labelQuaternary"
          containerSize={28}
          opacity={isDarkMode ? 0.6 : 0.75}
          size={size || 'icon 12px'}
          weight={weight || 'heavy'}
        >
          {icon}
        </TextIcon>
      </Box>
    </ButtonPressAnimation>
  );
};

const FadeMask = ({
  fadeEdgeInset = 6,
  fadeWidth = 14,
  height,
  side,
}: {
  fadeEdgeInset?: number;
  fadeWidth?: number;
  height?: number;
  side?: 'left' | 'right';
}) => {
  return (
    <Box height={height ? { custom: height } : 'full'} width="full">
      <Columns>
        {!side || side === 'left' ? (
          <>
            <Column width="content">
              <Box height="full" width={{ custom: fadeEdgeInset }} />
            </Column>
            <Column width="content">
              <Box
                as={LinearGradient}
                colors={['transparent', globalColors.grey100]}
                end={{ x: 1, y: 0.5 }}
                height="full"
                start={{ x: 0, y: 0.5 }}
                width={{ custom: fadeWidth }}
              />
            </Column>
          </>
        ) : null}
        <Column>
          <Box background="surfacePrimary" height="full" />
        </Column>
        {!side || side === 'right' ? (
          <>
            <Column width="content">
              <Box
                as={LinearGradient}
                colors={[globalColors.grey100, 'transparent']}
                end={{ x: 1, y: 0.5 }}
                height="full"
                start={{ x: 0, y: 0.5 }}
                width={{ custom: fadeWidth }}
              />
            </Column>
            <Column width="content">
              <Box height="full" width={{ custom: fadeEdgeInset }} />
            </Column>
          </>
        ) : null}
      </Columns>
    </Box>
  );
};

// /---- 📐 Styles 📐 ----/ //
//
// TODO: Should move the remaining unnecessarily inlined styles here
const styles = StyleSheet.create({
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
//
// /---- END styles ----/ //
