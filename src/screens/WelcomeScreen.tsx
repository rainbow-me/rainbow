import MaskedView from '@react-native-community/masked-view';
import analytics from '@segment/analytics-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { IS_TESTING } from 'react-native-dotenv';
import Reanimated, {
  Clock,
  EasingNode as REasing,
  Value as RValue,
  timing,
} from 'react-native-reanimated';
import { useValue } from 'react-native-redash/src/v1';
import { useAndroidBackHandler } from 'react-navigation-backhandler';
import styled from 'styled-components';
import { useMemoOne } from 'use-memo-one';
import RainbowGreyNeon from '../assets/rainbows/greyneon.png';
import RainbowLight from '../assets/rainbows/light.png';
import RainbowLiquid from '../assets/rainbows/liquid.png';
import RainbowNeon from '../assets/rainbows/neon.png';
import RainbowPixel from '../assets/rainbows/pixel.png';
import { ButtonPressAnimation } from '../components/animations';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/icons/svg/RainbowText' was r... Remove this comment to see the full error message
import RainbowText from '../components/icons/svg/RainbowText';
import { RowWithMargins } from '../components/layout';
import { Emoji, Text } from '../components/text';

import {
  fetchUserDataFromCloud,
  isCloudBackupAvailable,
  syncCloud,
} from '../handlers/cloudBackup';
import { cloudPlatform } from '../utils/platform';

// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useHideSplashScreen } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/images' or its cor... Remove this comment to see the full error message
import { ImgixImage } from '@rainbow-me/images';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { shadow } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
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

const ButtonContainer = styled(Reanimated.View)`
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'height' does not exist on type '{ hitSlo... Remove this comment to see the full error message
  border-radius: ${({ height }) => height / 2};
`;

const ButtonContent = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 4,
})`
  align-self: center;
  height: 100%;
  padding-bottom: 4;
`;

const ButtonLabel = styled(Text).attrs(
  ({ textColor: color, theme: { colors } }) => ({
    align: 'center',
    color: color || colors.dark,
    size: 'larger',
    weight: 'bold',
  })
)``;

const ButtonEmoji = styled(Emoji).attrs({
  align: 'center',
  size: 16.25,
})`
  padding-bottom: 1.5px;
`;

const DarkShadow = styled(Reanimated.View)`
  ${({ theme: { colors } }) => shadow.build(0, 10, 30, colors.dark, 1)};
  background-color: ${({ theme: { colors } }) => colors.white};
  border-radius: 30;
  height: 60;
  left: -3;
  opacity: 0.2;
  position: absolute;
  top: -3;
  width: 236;
`;

const Shadow = styled(Reanimated.View)`
  ${({ theme: { colors } }) => shadow.build(0, 10, 30, colors.dark, 0.4)};
  border-radius: 30;
  height: 60;
  left: -3;
  position: absolute;
  top: -3;
  width: 236;
`;

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
}: any) => {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation
      onPress={onPress}
      radiusAndroid={height / 2}
      scaleTo={0.9}
      {...props}
    >
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      {ios && <DarkShadow style={darkShadowStyle} />}
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      {ios && <Shadow style={shadowStyle} />}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ButtonContainer height={height} style={style}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ButtonContent>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ButtonEmoji name={emoji} />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ButtonLabel textColor={textColor}>{text}</ButtonLabel>
        </ButtonContent>
      </ButtonContainer>
    </ButtonPressAnimation>
  );
};

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Container = styled.View`
  ${StyleSheet.absoluteFillObject};
  align-items: center;
  background-color: ${({ theme: { colors } }: any) => colors.white};
  justify-content: center;
`;

const ContentWrapper = styled(Animated.View)`
  align-items: center;
  height: 192;
  justify-content: space-between;
  margin-bottom: 20;
  z-index: 10;
`;

const ButtonWrapper = styled(Animated.View)`
  width: 100%;
`;

const INITIAL_SIZE = 375;

export const useAnimatedValue = (initialValue: any) => {
  const value = useRef();

  if (!value.current) {
    // @ts-expect-error ts-migrate(2322) FIXME: Type 'Value' is not assignable to type 'undefined'... Remove this comment to see the full error message
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
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
    source: ios ? { uri: 'greyneon' } : RainbowGreyNeon,
    x: -116,
    y: -202,
  },
  {
    delay: 20,
    id: 'neon',
    rotate: '394.75deg',
    scale: 0.3333333333,
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
    source: ios ? { uri: 'neon' } : RainbowNeon,
    x: 149,
    y: 380,
  },
  {
    delay: 40,
    id: 'pixel',
    rotate: '360deg',
    scale: 0.6666666667,
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
    source: ios ? { uri: 'pixel' } : RainbowPixel,
    x: 173,
    y: -263,
  },
  {
    delay: 60,
    id: 'light',
    rotate: '-33deg',
    scale: 0.2826666667,
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
    source: ios ? { uri: 'light' } : RainbowLight,
    x: -172,
    y: 180,
  },
  {
    delay: 80,
    id: 'liquid',
    rotate: '75deg',
    scale: 0.42248,
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
    source: ios ? { uri: 'liquid' } : RainbowLiquid,
    x: 40,
    y: 215,
  },
];

const traversedRainbows = rainbows.map(
  (
    {
      delay,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'initialRotate' does not exist on type '{... Remove this comment to see the full error message
      initialRotate = '0deg',
      rotate = '0deg',
      scale = 1,
      source,
      x = 0,
      y = 0,
    },
    index
  ) => {
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
              outputRange: [initialRotate, rotate],
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

const RainbowImage = styled(ImgixImage)`
  height: ${INITIAL_SIZE};
  position: absolute;
  width: ${INITIAL_SIZE};
`;

const RAINBOW_TEXT_HEIGHT = 32;
const RAINBOW_TEXT_WIDTH = 125;

const RainbowTextMask = styled(Reanimated.View)`
  height: ${RAINBOW_TEXT_HEIGHT};
  width: ${RAINBOW_TEXT_WIDTH};
`;

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

const colorRGB = (r: any, g: any, b: any) =>
  color(round(r), round(g), round(b));

const springConfig = {
  bounciness: 7.30332,
  speed: 0.6021408,
  toValue: 1,
  useNativeDriver: true,
};

function colorAnimation(rValue: any, fromShadow: any) {
  const animation = runTiming(rValue.current);
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
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 4.
  return colorRGB(r, g, b, fromShadow);
}

export default function WelcomeScreen() {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const { replace, navigate, dangerouslyGetState } = useNavigation();
  const contentAnimation = useAnimatedValue(1);
  const hideSplashScreen = useHideSplashScreen();
  const createWalletButtonAnimation = useAnimatedValue(1);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        logger.log(`downloading ${cloudPlatform} backup info...`);
        const isAvailable = await isCloudBackupAvailable();
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
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
        Animated.parallel([
          // @ts-expect-error ts-migrate(2322) FIXME: Type 'false | CompositeAnimation' is not assignabl... Remove this comment to see the full error message
          ...traversedRainbows.map(({ value, delay = 0 }) =>
            Animated.spring(value, { ...springConfig, delay })
          ),
          // @ts-expect-error ts-migrate(2322) FIXME: Type 'false | CompositeAnimation' is not assignabl... Remove this comment to see the full error message
          Animated.sequence([
            // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'undefined' is not assignable to ... Remove this comment to see the full error message
            Animated.timing(contentAnimation.current, {
              duration: 120,
              easing: Easing.bezier(0.165, 0.84, 0.44, 1),
              toValue: 1.2,
            }),
            // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'undefined' is not assignable to ... Remove this comment to see the full error message
            Animated.spring(contentAnimation.current, {
              friction: 8,
              tension: 100,
              toValue: 1,
            }),
          ]),
          // We need to disable looping animations
          // There's no way to disable sync yet
          // See https://stackoverflow.com/questions/47391019/animated-button-block-the-detox
          // @ts-expect-error ts-migrate(2322) FIXME: Type 'false | CompositeAnimation' is not assignabl... Remove this comment to see the full error message
          IS_TESTING !== 'true' &&
            Animated.loop(
              Animated.sequence([
                // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'undefined' is not assignable to ... Remove this comment to see the full error message
                Animated.timing(createWalletButtonAnimation.current, {
                  duration: 1000,
                  toValue: 1.02,
                  useNativeDriver: true,
                }),
                // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'undefined' is not assignable to ... Remove this comment to see the full error message
                Animated.timing(createWalletButtonAnimation.current, {
                  duration: 1000,
                  toValue: 0.98,
                  useNativeDriver: true,
                }),
              ])
            ),
        ]).start();
        if (IS_TESTING === 'true') {
          logger.log(
            'Disabled loop animations in WelcomeScreen due to .env var IS_TESTING === "true"'
          );
        }
      }
    };
    initialize();

    return () => {
      // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      createWalletButtonAnimation.current.setValue(1);
      // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      contentAnimation.current.setValue(1);
    };
  }, [contentAnimation, hideSplashScreen, createWalletButtonAnimation]);

  const buttonStyle = useMemoOne(
    () => ({
      transform: [{ scale: createWalletButtonAnimation.current }],
      zIndex: 10,
    }),
    [createWalletButtonAnimation]
  );

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

  const backgroundColor = useMemoOne(() => colorAnimation(rValue, false), []);

  const onCreateWallet = useCallback(async () => {
    analytics.track('Tapped "Get a new wallet"');
    const operation = dangerouslyGetState().index === 1 ? navigate : replace;
    operation(Routes.SWIPE_LAYOUT, {
      params: { emptyWallet: true },
      screen: Routes.WALLET_SCREEN,
    });
  }, [dangerouslyGetState, navigate, replace]);

  const createWalletButtonProps = useMemoOne(() => {
    const color = colorAnimation(rValue, true);
    return {
      emoji: 'castle',
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      height: 54 + (ios ? 0 : 6),
      shadowStyle: {
        backgroundColor: backgroundColor,
        shadowColor: color,
      },
      style: {
        backgroundColor: colors.dark,
        borderColor: backgroundColor,
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
        borderWidth: ios ? 0 : 3,
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
        width: 230 + (ios ? 0 : 6),
      },
      text: 'Get a new wallet',
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
      text: 'I already have one',
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container testID="welcome-screen">
      {traversedRainbows.map(({ source, style, id }) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <RainbowImage
          Component={Animated.Image}
          key={`rainbow${id}`}
          source={source}
          style={style}
        />
      ))}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ContentWrapper style={contentStyle}>
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        {android && IS_TESTING === 'true' ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <RainbowText colors={colors} />
        ) : (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <MaskedView maskElement={<RainbowText colors={colors} />}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <RainbowTextMask style={textStyle} />
          </MaskedView>
        )}
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ButtonWrapper style={buttonStyle}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <RainbowButton
            onPress={onCreateWallet}
            testID="new-wallet-button"
            {...createWalletButtonProps}
          />
        </ButtonWrapper>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ButtonWrapper>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
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
