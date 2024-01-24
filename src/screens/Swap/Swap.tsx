/* eslint-disable no-nested-ternary */
import { BlurView } from '@react-native-community/blur';
import c from 'chroma-js';
import React, { ReactNode, useMemo } from 'react';
import {
  StyleSheet,
  Text as RNText,
  ScrollView,
  TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing,
  SharedValue,
  interpolate,
  interpolateColor,
  runOnUI,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ScreenCornerRadius } from 'react-native-screen-corner-radius';
import { Address } from 'viem';

import { ButtonPressAnimation } from '@/components/animations';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { Page } from '@/components/layout';
import { Input } from '@/components/inputs';
import { Navbar, navbarHeight } from '@/components/navbar/Navbar';
import {
  Bleed,
  Box,
  ColorModeProvider,
  Column,
  Columns,
  IconContainer,
  Inline,
  Inset,
  Separator,
  Stack,
  Text,
  globalColors,
  useForegroundColor,
} from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { TextWeight } from '@/design-system/components/Text/Text';
import { TextSize } from '@/design-system/typography/typeHierarchy';
import {
  useAccountAccentColor,
  useAccountProfile,
  useDimensions,
} from '@/hooks';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { Network } from '@/networks/types';
import { useTheme } from '@/theme';
import { deviceUtils, safeAreaInsetValues } from '@/utils';

import { SwapCoinIcon } from './components/FastSwapCoinIcon';
import { SwapActionButton } from './components/SwapActionButton';

const BASE_INPUT_HEIGHT = 104;
const BASE_INPUT_WIDTH = deviceUtils.dimensions.width - 24;
const EXPANDED_INPUT_HEIGHT =
  deviceUtils.dimensions.height -
  safeAreaInsetValues.top -
  77 -
  BASE_INPUT_HEIGHT -
  12 -
  Math.max(safeAreaInsetValues.bottom, 12);
const FOCUSED_INPUT_HEIGHT = BASE_INPUT_HEIGHT + 378;

const THICK_BORDER_WIDTH = 4 / 3;
const INPUT_PADDING = 20 - THICK_BORDER_WIDTH;
const INPUT_INNER_WIDTH = BASE_INPUT_WIDTH - THICK_BORDER_WIDTH * 2;

// TODO: Replace with actual keyboard height
const KEYBOARD_HEIGHT = 209;

const fadeConfig = {
  duration: 200,
  easing: Easing.bezier(0.22, 1, 0.36, 1),
};

const springConfig = {
  damping: 100,
  mass: 1.2,
  stiffness: 750,
};

export function SwapScreen() {
  const { accountSymbol, accountColor, accountImage } = useAccountProfile();
  const { navigate } = useNavigation();
  const theme = useTheme();

  const separatorSecondary = useForegroundColor('separatorSecondary');
  const separatorTertiary = useForegroundColor('separatorTertiary');

  const inputProgress = useSharedValue(0);
  const outputProgress = useSharedValue(0);

  const [topColor, setTopColor] = React.useState('#677483');
  const [bottomColor, setBottomColor] = React.useState('#2775CA');
  const [solidColorCoinIcons, setSolidColorCoinIcons] = React.useState(false);

  const [isInputFocused, setIsInputFocused] = React.useState(false);
  const [isOutputFocused, setIsOutputFocused] = React.useState(false);

  const onChangeWallet = React.useCallback(() => {
    navigate(Routes.CHANGE_WALLET_SHEET);
  }, [navigate]);

  const keyboardStyle = useAnimatedStyle(() => {
    const progress = Math.min(inputProgress.value + outputProgress.value, 1);

    return {
      opacity: withTiming(1 - progress, fadeConfig),
      transform: [
        {
          translateY: withSpring(
            progress * (EXPANDED_INPUT_HEIGHT - BASE_INPUT_HEIGHT),
            springConfig
          ),
        },
        { scale: withSpring(0.925 + (1 - progress) * 0.075, springConfig) },
      ],
    };
  });

  const inputStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(
        interpolate(inputProgress.value, [0, 1], [1, 0], 'clamp'),
        fadeConfig
      ),
      pointerEvents: inputProgress.value === 0 ? 'auto' : 'none',
    };
  });

  const inputTokenListStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(
        interpolate(inputProgress.value, [0, 1], [0, 1], 'clamp'),
        fadeConfig
      ),
      pointerEvents: inputProgress.value === 0 ? 'none' : 'auto',
    };
  });

  const outputStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(
        interpolate(outputProgress.value, [0, 1], [1, 0], 'clamp'),
        fadeConfig
      ),
      pointerEvents: outputProgress.value === 0 ? 'auto' : 'none',
    };
  });

  const outputTokenListStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(
        interpolate(outputProgress.value, [0, 1], [0, 1], 'clamp'),
        fadeConfig
      ),
      pointerEvents: outputProgress.value === 0 ? 'none' : 'auto',
    };
  });

  const handleInputPress = () => {
    'worklet';
    if (inputProgress.value === 0) {
      inputProgress.value = 1;
      outputProgress.value = 0;
    } else {
      inputProgress.value = 0;
    }
  };

  const handleFocusInputSearch = () => {
    'worklet';
    if (inputProgress.value !== 2) {
      inputProgress.value = 2;
    }
  };

  const handleFocusOutputSearch = () => {
    'worklet';
    if (outputProgress.value !== 2) {
      outputProgress.value = 2;
    }
  };

  const handleOutputPress = () => {
    'worklet';
    if (outputProgress.value === 0) {
      outputProgress.value = 1;
      inputProgress.value = 0;
    } else {
      outputProgress.value = 0;
    }
  };

  const handleExitSearch = () => {
    'worklet';
    if (inputProgress.value === 1) {
      inputProgress.value = 0;
    }
    if (outputProgress.value === 1) {
      outputProgress.value = 0;
    }
    if (inputProgress.value === 2) {
      inputProgress.value = 1;
    }
    if (outputProgress.value === 2) {
      outputProgress.value = 1;
    }
  };

  const focusedSearchStyle = useAnimatedStyle(() => {
    return {
      opacity:
        inputProgress.value === 2 || outputProgress.value === 2
          ? withTiming(0, fadeConfig)
          : withTiming(1, fadeConfig),
      pointerEvents:
        inputProgress.value === 2 || outputProgress.value === 2
          ? 'none'
          : 'auto',
    };
  });

  const flipButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withSpring(
            interpolate(
              inputProgress.value,
              [0, 1, 2],
              [0, 0, EXPANDED_INPUT_HEIGHT - FOCUSED_INPUT_HEIGHT],
              'clamp'
            ),
            springConfig
          ),
        },
      ],
    };
  });

  const hideWhenInputsExpanded = useAnimatedStyle(() => {
    return {
      opacity:
        inputProgress.value > 0 || outputProgress.value > 0
          ? withTiming(0, fadeConfig)
          : withTiming(1, fadeConfig),
      pointerEvents:
        inputProgress.value > 0 || outputProgress.value > 0 ? 'none' : 'auto',
    };
  });

  return (
    <ColorModeProvider value="dark">
      <Box
        as={Page}
        style={styles.rootViewBackground}
        testID="feed-screen"
        width="full"
      >
        <SwapBackground bottomColor={bottomColor} topColor={topColor}>
          <Box
            alignItems="center"
            height="full"
            paddingTop={{ custom: 29 }}
            width="full"
          >
            <SwapInput
              color={topColor}
              otherInputProgress={outputProgress}
              progress={inputProgress}
            >
              <Box as={Animated.View} style={inputStyle}>
                <Stack space="16px">
                  <Inline alignHorizontal="justify" alignVertical="center">
                    <Inline alignVertical="center" space="10px">
                      {solidColorCoinIcons ? (
                        <Box
                          borderRadius={18}
                          height={{ custom: 36 }}
                          style={{ backgroundColor: topColor, opacity: 0.4 }}
                          width={{ custom: 36 }}
                        />
                      ) : (
                        <SwapCoinIcon
                          address="eth"
                          large
                          network={Network.mainnet}
                          symbol="ETH"
                          theme={theme}
                        />
                      )}
                      <Text
                        color={{
                          custom: topColor === '#677483' ? '#9CA4AD' : topColor,
                        }}
                        size="30pt"
                        weight="bold"
                      >
                        1.75
                      </Text>
                    </Inline>
                    <SwapActionButton
                      color={topColor}
                      disableShadow
                      hugContent
                      label="ETH"
                      onPress={runOnUI(handleInputPress)}
                      rightIcon="􀆏"
                      small
                    />
                  </Inline>
                  <Inline alignHorizontal="justify" alignVertical="center">
                    <Text color="labelTertiary" size="17pt" weight="bold">
                      $2,842.08
                    </Text>
                    <BalanceBadge label="7 ETH" />
                  </Inline>
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
                  isFocused={isInputFocused}
                  setIsFocused={setIsInputFocused}
                />
              </Box>
            </SwapInput>
            <Box
              as={Animated.View}
              style={[
                {
                  shadowColor: globalColors.grey100,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  zIndex: 10,
                },
                flipButtonStyle,
                focusedSearchStyle,
              ]}
            >
              <Bleed vertical={{ custom: 8 }}>
                <FlipButton />
              </Bleed>
            </Box>
            <SwapInput
              bottomInput
              color={bottomColor}
              otherInputProgress={inputProgress}
              progress={outputProgress}
            >
              <Box as={Animated.View} style={outputStyle}>
                <Stack space="16px">
                  <Inline alignHorizontal="justify" alignVertical="center">
                    <Inline alignVertical="center" space="10px">
                      {solidColorCoinIcons ? (
                        <Box
                          borderRadius={18}
                          height={{ custom: 36 }}
                          style={{ backgroundColor: bottomColor, opacity: 0.4 }}
                          width={{ custom: 36 }}
                        />
                      ) : (
                        <SwapCoinIcon
                          address="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
                          large
                          network={Network.mainnet}
                          symbol="USDC"
                          theme={theme}
                        />
                      )}
                      <Text
                        color={{
                          custom:
                            bottomColor === '#677483' ? '#9CA4AD' : bottomColor,
                        }}
                        size="30pt"
                        weight="bold"
                      >
                        2,842.04
                      </Text>
                    </Inline>
                    <SwapActionButton
                      color={bottomColor}
                      disableShadow
                      hugContent
                      label="USDC"
                      onPress={runOnUI(handleOutputPress)}
                      rightIcon="􀆏"
                      small
                    />
                  </Inline>
                  <Inline alignHorizontal="justify" alignVertical="center">
                    <Text color="labelTertiary" size="17pt" weight="bold">
                      $2,842.04
                    </Text>
                    <BalanceBadge label="No Balance" />
                  </Inline>
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
                  isFocused={isOutputFocused}
                  output
                  setIsFocused={setIsOutputFocused}
                />
              </Box>
            </SwapInput>
            <ButtonPressAnimation scaleTo={0.925} style={{ marginTop: 8 }}>
              <Box
                as={Animated.View}
                alignItems="center"
                justifyContent="center"
                padding="12px"
                style={hideWhenInputsExpanded}
              >
                <Inline
                  alignHorizontal="center"
                  alignVertical="center"
                  space="6px"
                >
                  <IconContainer opacity={0.6} size={14}>
                    <Text
                      align="center"
                      color="labelQuaternary"
                      size="icon 11px"
                      weight="heavy"
                    >
                      􀄭
                    </Text>
                  </IconContainer>
                  <Text
                    align="center"
                    color="labelQuaternary"
                    size="13pt"
                    style={{ opacity: 0.6 }}
                    weight="heavy"
                  >
                    1 ETH = 1,624.04 USDC
                  </Text>
                </Inline>
              </Box>
            </ButtonPressAnimation>
            <Box
              alignItems="flex-end"
              as={Animated.View}
              bottom="0px"
              justifyContent="center"
              position="absolute"
              style={[
                { flex: 1, flexDirection: 'column', gap: 32, zIndex: -10 },
                keyboardStyle,
              ]}
              width="full"
            >
              <Box style={{ flex: 1 }} width="full">
                <KeyboardControlPanel />
                <NumberPad />
              </Box>
              <Box paddingHorizontal="20px" width="full">
                <SwapActionButton color={bottomColor} icon="􀕹" label="Review" />
              </Box>
            </Box>
          </Box>
        </SwapBackground>
        <Box
          as={Animated.View}
          pointerEvents="box-none"
          position="absolute"
          style={focusedSearchStyle}
          top="0px"
          width="full"
        >
          <Box
            borderRadius={5}
            height={{ custom: 5 }}
            marginBottom={{ custom: 4 }}
            style={{
              alignSelf: 'center',
              backgroundColor: globalColors.white50,
            }}
            top={{ custom: safeAreaInsetValues.top + 6 }}
            width={{ custom: 36 }}
          />
          <Navbar
            hasStatusBarInset
            leftComponent={
              <ButtonPressAnimation onPress={onChangeWallet} scaleTo={0.8}>
                {accountImage ? (
                  <ImageAvatar
                    image={accountImage}
                    marginRight={10}
                    size="header"
                  />
                ) : (
                  <ContactAvatar
                    color={accountColor}
                    marginRight={10}
                    size="small"
                    value={accountSymbol}
                  />
                )}
              </ButtonPressAnimation>
            }
            rightComponent={
              <ButtonPressAnimation
                onLongPress={() => {
                  setBottomColor('#FF9900');
                  setTopColor('#677483');
                  if (solidColorCoinIcons) {
                    setSolidColorCoinIcons(false);
                  }
                }}
                onPress={() => {
                  const randomBottomColor = c.random().hex();
                  const randomTopColor = c.random().hex();

                  const bottomColorContrast = c.contrast(
                    randomBottomColor,
                    globalColors.grey100
                  );
                  const topColorContrast = c.contrast(
                    randomTopColor,
                    globalColors.grey100
                  );

                  if (bottomColorContrast < 3) {
                    c(randomBottomColor).brighten(2).saturate(0.1).hex();
                  } else if (bottomColorContrast >= 2.5) {
                    setBottomColor(randomBottomColor);
                  }

                  if (topColorContrast < 3) {
                    c(randomTopColor).brighten(2).saturate(0.1).hex();
                  } else if (topColorContrast >= 2.5) {
                    setTopColor(randomTopColor);
                  }

                  if (!solidColorCoinIcons) {
                    setSolidColorCoinIcons(true);
                  }
                }}
                scaleTo={0.8}
              >
                <Box
                  style={[
                    styles.headerButton,
                    {
                      backgroundColor: separatorSecondary,
                      borderColor: separatorTertiary,
                    },
                  ]}
                >
                  <IconContainer opacity={0.8} size={34}>
                    <Bleed space="12px">
                      <RNText style={styles.headerTextShadow}>
                        <Text
                          align="center"
                          color="label"
                          size="icon 17px"
                          style={{ lineHeight: 33 }}
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
              <Inset bottom={{ custom: 5.5 }}>
                <Bleed space="12px">
                  <RNText style={styles.headerTextShadow}>
                    <Text
                      align="center"
                      color="label"
                      size="20pt"
                      weight="heavy"
                    >
                      {i18n.t(i18n.l.swap.modal_types.swap)}
                    </Text>
                  </RNText>
                </Bleed>
              </Inset>
            }
          />
        </Box>
      </Box>
      <Box
        height={{ custom: 0 }}
        pointerEvents="none"
        position="absolute"
        style={{ opacity: 0, zIndex: -100 }}
      >
        <ScrollView scrollEnabled={false} />
      </Box>
    </ColorModeProvider>
  );
}

const SwapBackground = ({
  bottomColor = '#677483',
  children,
  topColor = '#677483',
}: {
  bottomColor?: string;
  children: ReactNode;
  topColor?: string;
}) => {
  const { height: deviceHeight, width: deviceWidth } = useDimensions();

  const bottomColorDarkened = useMemo(
    () => c.mix(bottomColor, globalColors.grey100, 0.9875 /* 0.985 */).hex(),
    [bottomColor]
  );
  const topColorDarkened = useMemo(
    () => c.mix(topColor, globalColors.grey100, 0.9875 /* 0.985 */).hex(),
    [topColor]
  );

  return (
    <Box
      alignItems="center"
      as={LinearGradient}
      borderRadius={ScreenCornerRadius}
      colors={[topColorDarkened, bottomColorDarkened]}
      end={{ x: 0.5, y: 1 }}
      height={{ custom: deviceHeight }}
      justifyContent="center"
      paddingBottom={{ custom: safeAreaInsetValues.bottom + 20 }}
      paddingTop={{ custom: safeAreaInsetValues.top + (navbarHeight - 12) }}
      start={{ x: 0.5, y: 0 }}
      style={{ backgroundColor: topColor }}
      width={{ custom: deviceWidth }}
    >
      {children}
    </Box>
  );
};

const alpha = (color: string, opacity: number): string => {
  return c(color).alpha(opacity).css();
};

export const SwapInput = ({
  children,
  color = '#677483',
  bottomInput,
  otherInputProgress,
  progress,
}: {
  children?: ReactNode;
  color?: string;
  bottomInput?: boolean;
  otherInputProgress: SharedValue<number>;
  progress: SharedValue<number>;
}) => {
  const colorValue = useSharedValue(color);

  const bgColor = alpha(color, 0.08);
  const strokeColor = alpha(color, 0.06);
  const highlightedStrokeColor = alpha(color, 0.1);

  const inputStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        progress.value,
        [BASE_INPUT_HEIGHT, FOCUSED_INPUT_HEIGHT],
        [bgColor, bgColor]
      ),
      borderColor: interpolateColor(
        progress.value,
        [0, 1],
        [strokeColor, highlightedStrokeColor]
      ),
      height: withSpring(
        interpolate(
          progress.value,
          [0, 1, 2],
          [BASE_INPUT_HEIGHT, EXPANDED_INPUT_HEIGHT, FOCUSED_INPUT_HEIGHT],
          'clamp'
        ),
        springConfig
      ),
      transform: [
        {
          translateY: bottomInput
            ? withSpring(
                interpolate(
                  otherInputProgress.value,
                  [0, 1, 2],
                  [0, 0, EXPANDED_INPUT_HEIGHT - FOCUSED_INPUT_HEIGHT],
                  'clamp'
                ),
                springConfig
              )
            : 0,
        },
      ],
    };
  });

  useAnimatedReaction(
    () => ({
      color,
    }),
    ({ color }, previous) => {
      if (previous && color !== previous.color) {
        colorValue.value = color;
      }
    }
  );

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity:
        otherInputProgress.value === 2
          ? withTiming(0, fadeConfig)
          : withTiming(1, fadeConfig),
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
  });

  return (
    <Box
      as={Animated.View}
      style={containerStyle}
      width={{ custom: BASE_INPUT_WIDTH }}
    >
      <Box as={Animated.View} style={[inputStyle, styles.staticInputStyles]}>
        {children}
      </Box>
    </Box>
  );
};

const BalanceBadge = ({
  color,
  label,
  weight,
}: {
  color?: TextColor;
  label: string;
  weight?: TextWeight;
}) => {
  return (
    <Bleed vertical={{ custom: 5.5 }}>
      <Box
        alignItems="center"
        borderRadius={8.5}
        height={{ custom: 20 }}
        justifyContent="center"
        paddingHorizontal={{ custom: 5 }}
        style={{
          borderColor: 'rgba(245, 248, 255, 0.03)',
          borderWidth: THICK_BORDER_WIDTH,
        }}
      >
        <Text
          align="center"
          color={color || 'labelQuaternary'}
          size="13pt"
          style={{ opacity: label === 'No Balance' ? 0.6 : undefined }}
          weight={weight || 'bold'}
        >
          {label}
        </Text>
      </Box>
    </Bleed>
  );
};

const FlipButton = () => {
  return (
    <ButtonPressAnimation scaleTo={0.8}>
      <Box
        alignItems="center"
        as={BlurView}
        blurAmount={10}
        justifyContent="center"
        style={[
          styles.flipButton,
          {
            borderColor: 'rgba(245, 248, 255, 0.03)',
          },
        ]}
      >
        <IconContainer size={24} opacity={0.6}>
          <Box alignItems="center" justifyContent="center">
            <Bleed bottom={{ custom: 0.5 }}>
              <Text
                align="center"
                color="labelTertiary"
                size="icon 13px"
                weight="heavy"
              >
                􀆈
              </Text>
            </Bleed>
          </Box>
        </IconContainer>
      </Box>
    </ButtonPressAnimation>
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
  const { width: deviceWidth } = useDimensions();
  const { colors } = useTheme();

  const blue = useForegroundColor('blue');
  const red = useForegroundColor('red');

  const accentColor = useMemo(() => {
    if (c.contrast(accountColor, '#191A1C') < 2.125) {
      const brightenedColor = c(accountColor).brighten(1).saturate(0.5).css();
      return brightenedColor;
    } else {
      return accountColor;
    }
  }, [accountColor]);

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
          paddingBottom: isFocused
            ? EXPANDED_INPUT_HEIGHT - FOCUSED_INPUT_HEIGHT + 20
            : 20,
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
                    <Box
                      alignItems="center"
                      justifyContent="center"
                      width={{ custom: 16 }}
                    >
                      <Bleed space="16px">
                        <RNText
                          style={[
                            styles.textIconGlow,
                            {
                              textShadowColor: colors.alpha(blue, 0.28),
                            },
                          ]}
                        >
                          <Text
                            align="center"
                            color="blue"
                            size="icon 13px"
                            weight="heavy"
                          >
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
              ) : (
                <Inline alignVertical="center" space="6px">
                  <Bleed vertical="4px">
                    <Box
                      alignItems="center"
                      justifyContent="center"
                      width={{ custom: 18 }}
                    >
                      <Bleed space="16px">
                        <RNText
                          style={[
                            styles.textIconGlow,
                            {
                              textShadowColor: colors.alpha(accentColor, 0.2),
                            },
                          ]}
                        >
                          <Text
                            align="center"
                            color={{ custom: accentColor }}
                            size="icon 13px"
                            weight="black"
                          >
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
                <Bleed space="10px">
                  <Box padding="10px">
                    <Inline alignVertical="center" space="6px" wrap={false}>
                      <Text
                        align="right"
                        color="labelSecondary"
                        size="15pt"
                        weight="heavy"
                      >
                        All Networks
                      </Text>
                      <Text
                        align="center"
                        color="labelTertiary"
                        size="icon 13px"
                        weight="bold"
                      >
                        􀆏
                      </Text>
                    </Inline>
                  </Box>
                </Bleed>
              </ButtonPressAnimation>
            </Inline>
            <CoinRow
              address="eth"
              balance="7"
              name="Ethereum"
              nativeBalance="$18,320"
              output={output}
              symbol="ETH"
            />
            <CoinRow
              address="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
              balance="2,640"
              name="USD Coin"
              nativeBalance="$2,640"
              output={output}
              symbol="USDC"
            />
            <CoinRow
              address="0x6b175474e89094c44da98b954eedeac495271d0f"
              balance="2,800.02"
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
                  <Box
                    alignItems="center"
                    justifyContent="center"
                    marginBottom={{ custom: -0.5 }}
                    width={{ custom: 16 }}
                  >
                    <Bleed space="16px">
                      <RNText
                        style={[
                          styles.textIconGlow,
                          {
                            textShadowColor: colors.alpha(red, 0.28),
                          },
                        ]}
                      >
                        <Text
                          align="center"
                          color="red"
                          size="icon 13px"
                          weight="heavy"
                        >
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
            )}
            <CoinRow
              address="0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9"
              balance="428.25"
              isTrending={output}
              name="Aave"
              nativeBalance="$1,400"
              output={output}
              symbol="AAVE"
            />
            <CoinRow
              address="0x2260fac5e5542a773aa44fbcfedf7c193bc2c599"
              balance="0.042819"
              isTrending={output}
              name="Wrapped Bitcoin"
              nativeBalance="$1,025"
              output={output}
              symbol="WBTC"
            />
            <CoinRow
              address="0xc00e94cb662c3520282e6f5717214004a7f26888"
              balance="72.2806"
              isTrending={output}
              name="Compound"
              nativeBalance="$350.04"
              output={output}
              symbol="COMP"
            />
            <CoinRow
              address="0x1f9840a85d5af5bf1d1762f925bdaddc4201f984"
              balance="62.82"
              isTrending={output}
              name="Uniswap"
              nativeBalance="$289.52"
              output={output}
              symbol="UNI"
            />
            <CoinRow
              address="0x514910771af9ca656af840dff83e8264ecf986ca"
              balance="27.259"
              isTrending={output}
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
  const { colors } = useTheme();

  const inputRef = React.useRef<TextInput>(null);
  const [query, setQuery] = React.useState('');

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
                      borderColor: 'rgba(245, 248, 255, 0.03)',
                      borderWidth: THICK_BORDER_WIDTH,
                    }}
                    width={{ custom: 36 }}
                  >
                    <Text
                      align="center"
                      color="labelQuaternary"
                      size="icon 17px"
                      weight="bold"
                    >
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
                  placeholder={
                    output ? 'Find a token to buy' : 'Search your tokens'
                  }
                  placeholderTextColor={colors.alpha(labelQuaternary, 0.3)}
                  ref={inputRef}
                  selectionColor={color}
                  spellCheck={false}
                  style={{
                    color: label,
                    fontSize: 17,
                    fontWeight: 'bold',
                    height: 36,
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
                backgroundColor: colors.alpha(color, 0.12),
                borderColor: colors.alpha(color, 0.06),
                borderWidth: THICK_BORDER_WIDTH,
              }}
            >
              <Text
                align="center"
                color={{ custom: color }}
                size="17pt"
                weight="heavy"
              >
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
      <Bleed vertical="10px">
        <Box
          alignItems="center"
          flexDirection="row"
          justifyContent="space-between"
          paddingVertical="10px"
          width="full"
        >
          <Inline alignVertical="center" space="10px">
            <SwapCoinIcon
              address={address}
              large
              network={Network.mainnet}
              symbol={symbol}
              theme={theme}
            />
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
                    <Text
                      align="center"
                      color={percentChange.color}
                      size="12pt"
                      weight="bold"
                    >
                      {percentChange.prefix}
                    </Text>
                    <Text
                      color={percentChange.color}
                      size="13pt"
                      weight="semibold"
                    >
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
      </Bleed>
    </ButtonPressAnimation>
  );
};

const BalancePill = ({ balance }: { balance: string }) => {
  return (
    <Box
      alignItems="center"
      borderRadius={14}
      height={{ custom: 28 }}
      justifyContent="center"
      paddingHorizontal={{ custom: 8 - THICK_BORDER_WIDTH }}
      style={{
        backgroundColor: 'transparent',
        borderColor: 'rgba(245, 248, 255, 0.03)',
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

const KeyboardControlPanel = () => {
  const { width: deviceWidth } = useDimensions();
  const theme = useTheme();

  const separatorTertiary = useForegroundColor('separatorTertiary');

  return (
    <Box>
      <Box paddingHorizontal="6px" width="full">
        <Separator color="separatorTertiary" thickness={1} />
      </Box>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20 }}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{
          height: 66,
          paddingVertical: 6,
          width: deviceWidth,
        }}
      >
        <Inline
          alignVertical="center"
          separator={
            <Box
              height="full"
              style={{ backgroundColor: separatorTertiary }}
              width={{ custom: 1 }}
            />
          }
          space="16px"
          wrap={false}
        >
          <ControlPanelItem
            iconComponent={
              <SwapCoinIcon
                address="eth"
                disableShadow
                network={Network.mainnet}
                small
                symbol="ETH"
                theme={theme}
              />
            }
            isMenu={false}
            label="$8.82"
            title="Network Fee"
          />
          <ControlPanelItem label="Off" title="Flashbots" />
          <ControlPanelItem
            accessoryComponent={
              <BalanceBadge color="labelTertiary" label="1%" weight="heavy" />
            }
            label="Auto"
            title="Slippage"
          />
          <ControlPanelItem label="Auto" title="Approvals" />
        </Inline>
      </ScrollView>
    </Box>
  );
};

const ControlPanelItem = ({
  accessoryComponent,
  iconComponent,
  isMenu = true,
  label,
  onPress,
  title,
}: {
  accessoryComponent?: React.ReactNode;
  iconComponent?: React.ReactNode;
  isMenu?: boolean;
  label: string;
  onPress?: () => void;
  title: string;
}) => {
  return (
    <ButtonPressAnimation
      onPress={onPress}
      scaleTo={isMenu ? 0.925 : 1}
      style={{ height: 34 }}
    >
      <Stack space="12px">
        <Text color="labelQuaternary" size="13pt" weight="bold">
          {title}
        </Text>
        <Inline alignVertical="center" space="6px">
          {!!iconComponent && (
            <Bleed vertical="6px">
              <IconContainer size={16}>{iconComponent}</IconContainer>
            </Bleed>
          )}
          <Text color="labelSecondary" size="15pt" weight="heavy">
            {label}
          </Text>
          {isMenu && (
            <IconContainer size={9}>
              <Text color="labelTertiary" size="13pt" weight="bold">
                􀆏
              </Text>
            </IconContainer>
          )}
          {!!accessoryComponent && <>{accessoryComponent}</>}
        </Inline>
      </Stack>
    </ButtonPressAnimation>
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
  const separatorTertiary = useForegroundColor('separatorTertiary');

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.8}>
      <Box
        alignItems="center"
        background={outline ? undefined : 'fillQuaternary'}
        borderRadius={14}
        height={{ custom: 28 }}
        justifyContent="center"
        style={{
          borderColor: outline
            ? 'rgba(245, 248, 255, 0.03)'
            : separatorTertiary,
          borderWidth: THICK_BORDER_WIDTH,
        }}
        width={{ custom: 28 }}
      >
        <IconContainer opacity={0.6} size={28}>
          <Text
            align="center"
            color="labelQuaternary"
            size={size || 'icon 12px'}
            weight={weight || 'heavy'}
          >
            {icon}
          </Text>
        </IconContainer>
      </Box>
    </ButtonPressAnimation>
  );
};

const NumberPad = () => {
  return (
    <Box
      height={{ custom: KEYBOARD_HEIGHT }}
      paddingHorizontal="6px"
      width="full"
    >
      <Box style={{ gap: 6 }} width="full">
        <Separator color="separatorTertiary" thickness={1} />
        <Columns space="6px">
          <NumberPadKey char="1" />
          <NumberPadKey char="2" />
          <NumberPadKey char="3" />
        </Columns>
        <Columns space="6px">
          <NumberPadKey char="4" />
          <NumberPadKey char="5" />
          <NumberPadKey char="6" />
        </Columns>
        <Columns space="6px">
          <NumberPadKey char="7" />
          <NumberPadKey char="8" />
          <NumberPadKey char="9" />
        </Columns>
        <Columns space="6px">
          <NumberPadKey char="." scaleTo={1.5} transparent />
          <NumberPadKey char="0" />
          <NumberPadKey char="􀆛" small transparent />
        </Columns>
      </Box>
    </Box>
  );
};

const NumberPadKey = ({
  char,
  small,
  scaleTo,
  transparent,
}: {
  char: string;
  small?: boolean;
  scaleTo?: number;
  transparent?: boolean;
}) => {
  const separatorSecondary = useForegroundColor('separatorSecondary');

  return (
    <ButtonPressAnimation scaleTo={scaleTo || (transparent ? 1.2 : 0.9)}>
      <Box
        alignItems="center"
        borderRadius={8}
        height={{ custom: 46 }}
        justifyContent="center"
        style={
          transparent
            ? {}
            : {
                backgroundColor: separatorSecondary,
                borderColor: 'rgba(245, 248, 255, 0.015)',
                borderWidth: THICK_BORDER_WIDTH,
              }
        }
      >
        <Text
          align="center"
          color="label"
          size={small ? '22pt' : '26pt'}
          weight="semibold"
        >
          {char}
        </Text>
      </Box>
    </ButtonPressAnimation>
  );
};

const styles = StyleSheet.create({
  backgroundOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
  },
  headerButton: {
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    width: 36,
  },
  flipButton: {
    borderRadius: 14,
    borderWidth: THICK_BORDER_WIDTH,
    height: 28,
    width: 28,
  },
  headerTextShadow: {
    padding: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  rootViewBackground: {
    backgroundColor: 'transparent',
    borderRadius: ScreenCornerRadius,
    flex: 1,
    overflow: 'hidden',
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
