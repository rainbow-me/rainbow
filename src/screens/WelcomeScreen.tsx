import MaskedView from '@react-native-masked-view/masked-view';
import analytics from '@segment/analytics-react-native';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useState } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
// @ts-expect-error
import { IS_TESTING } from 'react-native-dotenv';
import Reanimated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
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

const ContentWrapper = styled(Reanimated.View)({
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

const springConfig = {
  bounciness: 7.30332,
  speed: 0.6021408,
  toValue: 1,
  useNativeDriver: true,
};

const animationColors = [
  'rgb(255,73,74)',
  'rgb(255,170,0)',
  'rgb(0,163,217)',
  'rgb(0,163,217)',
  'rgb(115,92,255)',
  'rgb(255,73,74)',
];

export default function WelcomeScreen() {
  const { colors } = useTheme();
  // @ts-expect-error Navigation types
  const { replace, navigate, dangerouslyGetState } = useNavigation();
  const [userData, setUserData] = useState(null);
  const hideSplashScreen = useHideSplashScreen();

  const contentAnimation = useSharedValue(1);
  const colorAnimation = useSharedValue(0);
  const calculatedColor = useDerivedValue(
    () =>
      interpolateColor(
        colorAnimation.value,
        [0, 1, 2, 3, 4, 5],
        animationColors
      ),
    [colorAnimation]
  );
  const createWalletButtonAnimation = useSharedValue(1);

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
        ];

        const initialDuration = 120;

        contentAnimation.value = withSequence(
          withTiming(1.2, {
            duration: initialDuration,
            easing: Easing.bezier(0.165, 0.84, 0.44, 1),
          }),
          withSpring(1, {
            damping: 7,
            overshootClamping: false,
            stiffness: 250,
          })
        );

        // We need to disable looping animations
        // There's no way to disable sync yet
        // See https://stackoverflow.com/questions/47391019/animated-button-block-the-detox
        if (IS_TESTING !== 'true') {
          createWalletButtonAnimation.value = withDelay(
            initialDuration,
            withTiming(1.02, { duration: 1000 }, () => {
              createWalletButtonAnimation.value = withRepeat(
                withTiming(0.98, {
                  duration: 1000,
                }),
                -1,
                true
              );
            })
          );
          colorAnimation.value = withRepeat(
            withTiming(5, {
              duration: 2500,
              easing: Easing.linear,
            }),
            -1
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
      contentAnimation.value = 1;
    };
  }, [
    colorAnimation,
    contentAnimation,
    createWalletButtonAnimation,
    hideSplashScreen,
  ]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: createWalletButtonAnimation.value }],
    zIndex: 10,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: contentAnimation.value,
      },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    backgroundColor: calculatedColor.value,
  }));

  const onCreateWallet = useCallback(async () => {
    analytics.track('Tapped "Get a new wallet"');
    const operation = dangerouslyGetState().index === 1 ? navigate : replace;
    operation(Routes.SWIPE_LAYOUT, {
      params: { emptyWallet: true },
      screen: Routes.WALLET_SCREEN,
    });
  }, [dangerouslyGetState, navigate, replace]);

  const createWalletButtonProps = useMemoOne(() => {
    return {
      emoji: 'castle',
      height: 54 + (ios ? 0 : 6),
      text: lang.t('wallet.new.get_new_wallet'),
      textColor: colors.white,
    };
  }, []);

  const createWalletButtonAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: colors.dark,
    borderColor: calculatedColor.value,
    borderWidth: ios ? 0 : 3,
    width: 230 + (ios ? 0 : 6),
  }));

  const createWalletButtonAnimatedShadowStyle = useAnimatedStyle(() => ({
    backgroundColor: calculatedColor.value,
    shadowColor: calculatedColor.value,
  }));

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
  }, []);

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
          <RainbowButton
            onPress={onCreateWallet}
            testID="new-wallet-button"
            {...createWalletButtonProps}
            shadowStyle={createWalletButtonAnimatedShadowStyle}
            style={createWalletButtonAnimatedStyle}
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
