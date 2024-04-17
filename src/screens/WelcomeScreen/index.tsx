import MaskedView from '@react-native-masked-view/masked-view';
import lang from 'i18n-js';
import React, { useCallback, useEffect } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAndroidBackHandler } from 'react-navigation-backhandler';
import RainbowText from '../../components/icons/svg/RainbowText';
import { RainbowsBackground } from '../../components/rainbows-background/RainbowsBackground';
import { Text } from '../../components/text';
import { analytics } from '@/analytics';

import { useHideSplashScreen } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@rainbow-me/routes';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { ThemeContextProps, useTheme } from '@/theme';
import logger from 'logger';
import { IS_ANDROID, IS_TEST } from '@/env';
import { WelcomeScreenRainbowButton } from '@/screens/WelcomeScreen/WelcomeScreenRainbowButton';

// @ts-expect-error Our implementation of SC complains
const Container = styled.View({
  ...position.coverAsObject,
  alignItems: 'center',
  backgroundColor: ({ theme: { colors } }: { theme: ThemeContextProps }) => colors.white,
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

const TermsOfUse = styled(View)(({ bottomInset }: any) => ({
  bottom: bottomInset / 2 + 32,
  position: 'absolute',
  width: 200,
}));

const RAINBOW_TEXT_HEIGHT = 32;
const RAINBOW_TEXT_WIDTH = 125;

const RainbowTextMask = styled(Reanimated.View)({
  height: RAINBOW_TEXT_HEIGHT,
  width: RAINBOW_TEXT_WIDTH,
});

const animationColors = ['rgb(255,73,74)', 'rgb(255,170,0)', 'rgb(0,163,217)', 'rgb(0,163,217)', 'rgb(115,92,255)', 'rgb(255,73,74)'];

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDarkMode } = useTheme();
  const { replace, navigate, getState: dangerouslyGetState } = useNavigation();
  const hideSplashScreen = useHideSplashScreen();

  const contentAnimation = useSharedValue(1);
  const colorAnimation = useSharedValue(0);
  const shouldAnimateRainbows = useSharedValue(false);
  const calculatedColor = useDerivedValue(
    () => interpolateColor(colorAnimation.value, [0, 1, 2, 3, 4, 5], animationColors),
    [colorAnimation]
  );
  const createWalletButtonAnimation = useSharedValue(1);

  useEffect(() => {
    const initialize = async () => {
      if (IS_TEST) {
        logger.log('Skipping animations because IS_TEST is true');
        contentAnimation.value = 1;
        createWalletButtonAnimation.value = 1;
        colorAnimation.value = 0;
        return;
      }

      hideSplashScreen();
      shouldAnimateRainbows.value = true;
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
    };

    initialize();

    return () => {
      createWalletButtonAnimation.value = 1;
      contentAnimation.value = 1;
      colorAnimation.value = 0;
    };
  }, [colorAnimation, contentAnimation, createWalletButtonAnimation, hideSplashScreen, shouldAnimateRainbows]);

  const buttonStyle = useAnimatedStyle(() => {
    if (IS_TEST) {
      return { transform: [{ scale: 1 }], zIndex: 10 };
    }
    return {
      transform: [{ scale: createWalletButtonAnimation.value }],
      zIndex: 10,
    };
  }, []);

  const contentStyle = useAnimatedStyle(() => {
    if (IS_TEST) {
      return { transform: [{ scale: 1 }] };
    }
    return {
      transform: [{ scale: contentAnimation.value }],
    };
  }, []);

  const textStyle = useAnimatedStyle(() => ({
    backgroundColor: calculatedColor.value,
  }));

  const createWalletButtonAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: isDarkMode ? colors.blueGreyDarkLight : colors.dark,
    borderColor: calculatedColor.value,
    borderWidth: ios ? 0 : 3,
    width: 230 + (ios ? 0 : 6),
  }));

  const createWalletButtonAnimatedShadowStyle = useAnimatedStyle(() => ({
    backgroundColor: calculatedColor.value,
    shadowColor: calculatedColor.value,
  }));

  const onCreateWallet = useCallback(async () => {
    analytics.track('Tapped "Get a new wallet"');
    const operation = dangerouslyGetState()?.index === 1 ? navigate : replace;
    operation(Routes.SWIPE_LAYOUT, {
      params: { emptyWallet: true },
      screen: Routes.WALLET_SCREEN,
    });
  }, [dangerouslyGetState, navigate, replace]);

  const handlePressTerms = useCallback(() => {
    Linking.openURL('https://rainbow.me/terms-of-use');
  }, []);

  const showRestoreSheet = useCallback(() => {
    analytics.track('Tapped "I already have one"');
    navigate(Routes.ADD_WALLET_NAVIGATOR, {
      isFirstWallet: true,
    });
  }, [navigate]);

  useAndroidBackHandler(() => {
    return true;
  });

  return (
    <Container testID="welcome-screen">
      <RainbowsBackground shouldAnimate={shouldAnimateRainbows} />
      <ContentWrapper style={contentStyle}>
        {IS_ANDROID && IS_TEST ? (
          // @ts-expect-error JS component
          <RainbowText colors={colors} />
        ) : (
          // @ts-expect-error JS component
          <MaskedView maskElement={<RainbowText colors={colors} />}>
            <RainbowTextMask style={textStyle} />
          </MaskedView>
        )}

        <ButtonWrapper style={buttonStyle}>
          <WelcomeScreenRainbowButton
            emoji="castle"
            height={54 + (ios ? 0 : 6)}
            onPress={onCreateWallet}
            shadowStyle={createWalletButtonAnimatedShadowStyle}
            style={createWalletButtonAnimatedStyle}
            testID="new-wallet-button"
            text={lang.t('wallet.new.get_new_wallet')}
            textColor={isDarkMode ? colors.dark : colors.white}
          />
        </ButtonWrapper>
        <ButtonWrapper>
          <WelcomeScreenRainbowButton
            darkShadowStyle={sx.existingWalletShadow}
            emoji="old_key"
            height={56}
            onPress={showRestoreSheet}
            shadowStyle={sx.existingWalletShadow}
            style={[sx.existingWallet, { backgroundColor: colors.blueGreyDarkLight }]}
            testID="already-have-wallet-button"
            text={lang.t('wallet.new.already_have_wallet')}
            textColor={colors.alpha(colors.blueGreyDark, 0.8)}
          />
        </ButtonWrapper>
      </ContentWrapper>
      <TermsOfUse bottomInset={insets.bottom}>
        <Text align="center" color={colors.alpha(colors.blueGreyDark, 0.5)} lineHeight="loose" size="smedium" weight="semibold">
          {lang.t('wallet.new.terms')}
          <Text color={colors.paleBlue} lineHeight="loose" onPress={handlePressTerms} size="smedium" suppressHighlighting weight="semibold">
            {lang.t('wallet.new.terms_link')}
          </Text>
        </Text>
      </TermsOfUse>
    </Container>
  );
}

const sx = StyleSheet.create({
  existingWallet: {
    width: 248,
  },
  existingWalletShadow: {
    opacity: 0,
  },
});
