import MaskedView from '@react-native-masked-view/masked-view';
import analytics from '@segment/analytics-react-native';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';
// @ts-expect-error
import { IS_TESTING } from 'react-native-dotenv';
import Reanimated, {
  Clock,
  EasingNode as REasing,
  Value as RValue,
  timing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useValue } from 'react-native-redash/src/v1';
import { useAndroidBackHandler } from 'react-navigation-backhandler';
import { useMemoOne } from 'use-memo-one';
import RainbowGreyNeon from '../assets/rainbows/greyneon.png';
import RainbowLight from '../assets/rainbows/light.png';
import RainbowLiquid from '../assets/rainbows/liquid.png';
import RainbowNeon from '../assets/rainbows/neon.png';
import RainbowPixel from '../assets/rainbows/pixel.png';
import { ButtonPressAnimation } from '../components/animations';
import { BaseButtonAnimationProps } from '../components/animations/ButtonPressAnimation/types';
import RainbowText from '../components/icons/svg/RainbowText';
import { RowWithMargins } from '../components/layout';
import { Emoji, Text } from '../components/text';

import {
  fetchUserDataFromCloud,
  isCloudBackupAvailable,
  syncCloud,
} from '../handlers/cloudBackup';
import { cloudPlatform } from '../utils/platform';

import { ThemeContextProps, useTheme } from '@rainbow-me/context';
import { useHideSplashScreen } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';
import { position, shadow } from '@rainbow-me/styles';
import logger from 'logger';

const {
  and,
  block,
  clockRunning,
  color,
  not,
  set,
  cond,
  interpolateNode: interpolate,
  round,
  startClock,
} = Reanimated;

const ButtonContainer = styled(Reanimated.View)({
  borderRadius: ({ height }: { height: number }) => height / 2,
});

const ButtonContent = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 4,
})({
  alignSelf: 'center',
  height: '100%',
  paddingBottom: 4,
});

const ButtonLabel = styled(Text).attrs(
  ({
    textColor: color,
    theme: { colors },
  }: {
    textColor: string;
    theme: ThemeContextProps;
  }) => ({
    align: 'center',
    color: color || colors.dark,
    size: 'larger',
    weight: 'bold',
  })
)({});

const ButtonEmoji = styled(Emoji).attrs({
  align: 'center',
  size: 16.25,
})({
  paddingBottom: 1.5,
});

const DarkShadow = styled(Reanimated.View)(
  ({ theme: { colors } }: { theme: ThemeContextProps }) => ({
    ...shadow.buildAsObject(0, 10, 30, colors.dark, 1),
    backgroundColor: colors.white,
    borderRadius: 30,
    height: 60,
    left: -3,
    opacity: 0.2,
    position: 'absolute',
    top: -3,
    width: 236,
  })
);

const Shadow = styled(Reanimated.View)(
  ({ theme: { colors } }: { theme: ThemeContextProps }) => ({
    ...shadow.buildAsObject(0, 10, 30, colors.dark, 0.4),
    borderRadius: 30,
    height: 60,
    left: -3,
    position: 'absolute',
    top: -3,
    width: 236,
  })
);

interface RainbowButtonProps extends BaseButtonAnimationProps {
  height: number;
  textColor: string;
  text: string;
  emoji: string;
  shadowStyle?: StyleProp<ViewStyle>;
  darkShadowStyle?: StyleProp<ViewStyle>;
}

const RainbowButton = ({
  darkShadowStyle,
  emoji,
  height,
  onPress,
  shadowStyle,
  style,
  textColor,
  text,
  ...props
}: RainbowButtonProps) => {
  return (
    <ButtonPressAnimation
      onPress={onPress}
      radiusAndroid={height / 2}
      scaleTo={0.9}
      {...props}
    >
      {ios && <DarkShadow style={darkShadowStyle} />}
      {ios && <Shadow style={shadowStyle} />}
      <ButtonContainer height={height} style={style}>
        <ButtonContent>
          <ButtonEmoji name={emoji} />
          <ButtonLabel textColor={textColor}>{text}</ButtonLabel>
        </ButtonContent>
      </ButtonContainer>
    </ButtonPressAnimation>
  );
};

// @ts-expect-error Our implementation of SC complains
const Container = styled.View({
  ...position.coverAsObject,
  alignItems: 'center',
  backgroundColor: ({ theme: { colors } }: { theme: ThemeContextProps }) =>
    colors.white,
  justifyContent: 'center',
});

const ContentWrapper = styled(Animated.View)({
  alignItems: 'center',
  height: 192,
  justifyContent: 'space-between',
  marginBottom: 20,
  zIndex: 10,
});

const ButtonWrapper = styled(Reanimated.View)({
  width: '100%',
});

const INITIAL_SIZE = 375;

const useAnimatedValue = (initialValue: any) => {
  const value = useRef<Animated.Value>();

  if (!value.current) {
    value.current = new Animated.Value(initialValue);
  }

  return value;
};

const rainbows = [
  {
    delay: 0,
    id: 'grey',
    rotate: '150deg',
    scale: 0.5066666667,
    source: ios ? { uri: 'greyneon' } : RainbowGreyNeon,
    x: -116,
    y: -202,
  },
  {
    delay: 20,
    id: 'neon',
    rotate: '394.75deg',
    scale: 0.3333333333,
    source: ios ? { uri: 'neon' } : RainbowNeon,
    x: 149,
    y: 380,
  },
  {
    delay: 40,
    id: 'pixel',
    rotate: '360deg',
    scale: 0.6666666667,
    source: ios ? { uri: 'pixel' } : RainbowPixel,
    x: 173,
    y: -263,
  },
  {
    delay: 60,
    id: 'light',
    rotate: '-33deg',
    scale: 0.2826666667,
    source: ios ? { uri: 'light' } : RainbowLight,
    x: -172,
    y: 180,
  },
  {
    delay: 80,
    id: 'liquid',
    rotate: '75deg',
    scale: 0.42248,
    source: ios ? { uri: 'liquid' } : RainbowLiquid,
    x: 40,
    y: 215,
  },
];

const traversedRainbows = rainbows.map(
  ({ delay, rotate = '0deg', scale = 1, source, x = 0, y = 0 }, index) => {
    const animatedValue = new Animated.Value(0);
    return {
      delay,
      id: index,
      source,
      style: {
        opacity: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        }),
        transform: [
          {
            translateX: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, x],
            }),
          },
          {
            translateY: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, y],
            }),
          },
          {
            rotate: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', rotate],
            }),
          },
          {
            scale: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, scale],
            }),
          },
        ],
      },
      value: animatedValue,
    };
  }
);

const RainbowImage = styled(ImgixImage)({
  height: INITIAL_SIZE,
  position: 'absolute',
  width: INITIAL_SIZE,
});

const RAINBOW_TEXT_HEIGHT = 32;
const RAINBOW_TEXT_WIDTH = 125;

const RainbowTextMask = styled(Reanimated.View)({
  height: RAINBOW_TEXT_HEIGHT,
  width: RAINBOW_TEXT_WIDTH,
});

function runTiming(value: any) {
  const clock = new Clock();
  const state = {
    finished: new RValue(0),
    frameTime: new RValue(0),
    position: new RValue(0),
    time: new RValue(0),
  };

  const config = {
    duration: 2500,
    easing: REasing.linear,
    toValue: new RValue(1),
  };

  return block([
    cond(and(not(state.finished), clockRunning(clock)), 0, [
      set(state.finished, 0),
      set(state.time, 0),
      set(state.position, value),
      set(state.frameTime, 0),
      set(config.toValue, 5),
      startClock(clock),
    ]),
    timing(clock, state, config),
    state.position,
  ]);
}

/* eslint-disable sort-keys-fix/sort-keys-fix */
const colorsRGB = [
  { r: 255, g: 73, b: 74 },
  { r: 255, g: 170, b: 0 },
  { r: 0, g: 222, b: 111 },
  { r: 0, g: 163, b: 217 },
  { r: 115, g: 92, b: 255 },
];
/* eslint-enable sort-keys-fix/sort-keys-fix */

const colorRGB = (
  r: Reanimated.Node<number>,
  g: Reanimated.Node<number>,
  b: Reanimated.Node<number>
) => color(round(r), round(g), round(b));

const springConfig = {
  bounciness: 7.30332,
  speed: 0.6021408,
  toValue: 1,
  useNativeDriver: true,
};

function colorAnimation(rValue: Reanimated.Value<any>) {
  const animation = runTiming(rValue);
  const r = interpolate(animation, {
    inputRange: [0, 1, 2, 3, 4, 5],
    outputRange: [...colorsRGB.map(({ r }) => r), colorsRGB[0].r],
  });

  const g = interpolate(animation, {
    inputRange: [0, 1, 2, 3, 4, 5],
    outputRange: [...colorsRGB.map(({ g }) => g), colorsRGB[0].g],
  });

  const b = interpolate(animation, {
    inputRange: [0, 1, 2, 3, 4, 5],
    outputRange: [...colorsRGB.map(({ b }) => b), colorsRGB[0].b],
  });
  return colorRGB(r, g, b);
}

export default function WelcomeScreen() {
  const { colors } = useTheme();
  // @ts-expect-error Navigation types
  const { replace, navigate, dangerouslyGetState } = useNavigation();
  const contentAnimation = useAnimatedValue(1);
  const hideSplashScreen = useHideSplashScreen();
  const createWalletButtonAnimation = useSharedValue(1);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        logger.log(`downloading ${cloudPlatform} backup info...`);
        const isAvailable = await isCloudBackupAvailable();
        if (isAvailable && ios) {
          logger.log('syncing...');
          await syncCloud();
          logger.log('fetching backup info...');
          const data = await fetchUserDataFromCloud();
          setUserData(data);
          logger.log(`Downloaded ${cloudPlatform} backup info`);
        }
      } catch (e) {
        logger.log('error getting userData', e);
      } finally {
        hideSplashScreen();
        const animations = [
          ...traversedRainbows.map(({ value, delay = 0 }) =>
            Animated.spring(value, { ...springConfig, delay })
          ),
          Animated.sequence([
            Animated.timing(contentAnimation.current!, {
              duration: 120,
              easing: Easing.bezier(0.165, 0.84, 0.44, 1),
              toValue: 1.2,
              useNativeDriver: false,
            }),
            Animated.spring(contentAnimation.current!, {
              friction: 8,
              tension: 100,
              toValue: 1,
              useNativeDriver: false,
            }),
          ]),
        ];

        // We need to disable looping animations
        // There's no way to disable sync yet
        // See https://stackoverflow.com/questions/47391019/animated-button-block-the-detox
        if (IS_TESTING !== 'true') {
          createWalletButtonAnimation.value = withTiming(
            1.02,
            { duration: 1000 },
            () => {
              createWalletButtonAnimation.value = withRepeat(
                withTiming(0.98, {
                  duration: 1000,
                }),
                0,
                true
              );
            }
          );
        }

        Animated.parallel(animations).start();
        if (IS_TESTING === 'true') {
          logger.log(
            'Disabled loop animations in WelcomeScreen due to .env var IS_TESTING === "true"'
          );
        }
      }
    };

    initialize();

    return () => {
      createWalletButtonAnimation.value = 1;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      contentAnimation.current!.setValue(1);
    };
  }, [contentAnimation, hideSplashScreen, createWalletButtonAnimation]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: createWalletButtonAnimation.value }],
    zIndex: 10,
  }));

  const contentStyle = useMemoOne(
    () => ({
      transform: [
        {
          scale: contentAnimation.current,
        },
      ],
    }),
    [createWalletButtonAnimation]
  );

  const rValue = useValue(0);

  const backgroundColor = useMemoOne(() => colorAnimation(rValue), []);

  const onCreateWallet = useCallback(async () => {
    analytics.track('Tapped "Get a new wallet"');
    const operation = dangerouslyGetState().index === 1 ? navigate : replace;
    operation(Routes.SWIPE_LAYOUT, {
      params: { emptyWallet: true },
      screen: Routes.WALLET_SCREEN,
    });
  }, [dangerouslyGetState, navigate, replace]);

  const createWalletButtonProps = useMemoOne(() => {
    const color = colorAnimation(rValue);
    return {
      emoji: 'castle',
      height: 54 + (ios ? 0 : 6),
      shadowStyle: {
        backgroundColor: backgroundColor,
        shadowColor: color,
      },
      style: {
        backgroundColor: colors.dark,
        borderColor: backgroundColor,
        borderWidth: ios ? 0 : 3,
        width: 230 + (ios ? 0 : 6),
      },
      text: lang.t('wallet.new.get_new_wallet'),
      textColor: colors.white,
    };
  }, [rValue]);

  const showRestoreSheet = useCallback(() => {
    analytics.track('Tapped "I already have one"');
    navigate(Routes.RESTORE_SHEET, {
      userData,
    });
  }, [navigate, userData]);

  const existingWalletButtonProps = useMemoOne(() => {
    return {
      darkShadowStyle: {
        opacity: 0,
      },
      emoji: 'old_key',
      height: 56,
      shadowStyle: {
        opacity: 0,
      },
      style: {
        backgroundColor: colors.blueGreyDarkLight,
        width: 248,
      },
      text: lang.t('wallet.new.already_have_wallet'),
      textColor: colors.alpha(colors.blueGreyDark, 0.8),
    };
  }, [rValue]);

  const textStyle = useMemoOne(() => {
    return {
      backgroundColor,
    };
  }, [rValue]);

  useAndroidBackHandler(() => {
    return true;
  });

  return (
    <Container testID="welcome-screen">
      {traversedRainbows.map(({ source, style, id }) => (
        <RainbowImage
          Component={Animated.Image}
          key={`rainbow${id}`}
          source={source}
          style={style}
        />
      ))}

      <ContentWrapper style={contentStyle}>
        {android && IS_TESTING === 'true' ? (
          // @ts-expect-error JS component
          <RainbowText colors={colors} />
        ) : (
          // @ts-expect-error JS component
          <MaskedView maskElement={<RainbowText colors={colors} />}>
            <RainbowTextMask style={textStyle} />
          </MaskedView>
        )}

        <ButtonWrapper style={buttonStyle}>
          {/* @ts-expect-error not animated style */}
          <RainbowButton
            onPress={onCreateWallet}
            testID="new-wallet-button"
            {...createWalletButtonProps}
          />
        </ButtonWrapper>
        <ButtonWrapper>
          <RainbowButton
            onPress={showRestoreSheet}
            {...existingWalletButtonProps}
            testID="already-have-wallet-button"
          />
        </ButtonWrapper>
      </ContentWrapper>
    </Container>
  );
}
