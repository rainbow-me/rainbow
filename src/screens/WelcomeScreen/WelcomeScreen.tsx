import MaskedView from '@react-native-masked-view/masked-view';
import * as i18n from '@/languages';
import React, { useCallback, useEffect, useRef } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
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
import RainbowText from '../../components/icons/svg/RainbowText';
import { RainbowsBackground } from '../../components/rainbows-background/RainbowsBackground';
import { Text } from '../../components/text';
import { analytics } from '@/analytics';
import { useHardwareBackOnFocus } from '@/hooks/useHardwareBack';
import { useNavigation } from '@/navigation';
import Routes from '@rainbow-me/routes';
import { useTheme } from '@/theme';
import { ensureError, logger, RainbowError } from '@/logger';
import { IS_ANDROID, IS_IOS, IS_TEST } from '@/env';
import { WelcomeScreenRainbowButton } from '@/screens/WelcomeScreen/WelcomeScreenRainbowButton';
import { openInBrowser } from '@/utils/openInBrowser';
import { PerformanceMeasureView } from '@shopify/react-native-performance';
import { hideSplashScreen } from '@/hooks/useHideSplashScreen';
import { walletLoadingStore } from '@/state/walletLoading/walletLoading';
import { WalletLoadingStates } from '@/helpers/walletLoadingStates';
import { initializeWallet } from '@/state/wallets/initializeWallet';
import { Box } from '@/design-system';
import { opacity } from '@/framework/ui/utils/opacity';

const RAINBOW_TEXT_HEIGHT = 32;
const RAINBOW_TEXT_WIDTH = 125;
const ANIMATION_COLORS = ['rgb(255,73,74)', 'rgb(255,170,0)', 'rgb(0,163,217)', 'rgb(0,163,217)', 'rgb(115,92,255)', 'rgb(255,73,74)'];
const PRIMARY_BUTTON_HEIGHT = IS_IOS ? 54 : 60;
const PRIMARY_BUTTON_WIDTH = IS_IOS ? 230 : 236;
const PRIMARY_BUTTON_BORDER_WIDTH = IS_IOS ? 0 : 3;

export function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDarkMode } = useTheme();
  const { replace, navigate } = useNavigation();
  const isCreatingWallet = useRef(false);

  const contentAnimation = useSharedValue(1);
  const colorAnimation = useSharedValue(0);
  const shouldAnimateRainbows = useSharedValue(false);
  const calculatedColor = useDerivedValue(
    () => interpolateColor(colorAnimation.value, [0, 1, 2, 3, 4, 5], ANIMATION_COLORS),
    [colorAnimation]
  );
  const createWalletButtonAnimation = useSharedValue(1);

  const resetAnimations = useCallback(() => {
    cancelAnimation(contentAnimation);
    cancelAnimation(createWalletButtonAnimation);
    cancelAnimation(colorAnimation);
    createWalletButtonAnimation.value = 1;
    contentAnimation.value = 1;
    colorAnimation.value = 0;
    shouldAnimateRainbows.value = false;
  }, [colorAnimation, contentAnimation, createWalletButtonAnimation, shouldAnimateRainbows]);

  const startAnimations = useCallback(() => {
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

    createWalletButtonAnimation.value = withDelay(
      initialDuration,
      withTiming(1.02, { duration: 1000 }, finished => {
        if (!finished) return;
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
  }, [shouldAnimateRainbows, contentAnimation, createWalletButtonAnimation, colorAnimation]);

  useEffect(() => {
    hideSplashScreen();
    startAnimations();
    return resetAnimations;
  }, [startAnimations, resetAnimations]);

  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: createWalletButtonAnimation.value }],
      zIndex: 10,
    };
  }, []);

  const contentStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: contentAnimation.value }],
    };
  }, []);

  const textStyle = useAnimatedStyle(() => ({
    backgroundColor: calculatedColor.value,
  }));

  const primaryButtonBackground = isDarkMode ? colors.blueGreyDarkLight : colors.dark;
  const primaryButtonTextColor = isDarkMode ? colors.dark : colors.white;
  const existingWalletBackground = colors.blueGreyDarkLight;
  const existingWalletTextColor = opacity(colors.blueGreyDark, 0.8);
  const termsTextColor = opacity(colors.blueGreyDark, 0.5);

  const createWalletButtonAnimatedStyle = useAnimatedStyle(
    () => ({
      backgroundColor: primaryButtonBackground,
      borderColor: calculatedColor.value,
      borderWidth: PRIMARY_BUTTON_BORDER_WIDTH,
      width: PRIMARY_BUTTON_WIDTH,
    }),
    [primaryButtonBackground]
  );

  const createWalletButtonAnimatedShadowStyle = useAnimatedStyle(() => ({
    backgroundColor: calculatedColor.value,
    shadowColor: calculatedColor.value,
  }));

  const onCreateWallet = useCallback(async () => {
    if (isCreatingWallet.current) return;
    isCreatingWallet.current = true;
    analytics.track(analytics.event.welcomeNewWallet);
    walletLoadingStore.setState({
      loadingState: WalletLoadingStates.CREATING_WALLET,
    });

    try {
      const walletAddress = await initializeWallet({
        shouldCreateFirstWallet: true,
        shouldRunMigrations: true,
      });

      if (!walletAddress) {
        throw new RainbowError('Error creating wallet address');
      }

      replace(Routes.SWIPE_LAYOUT, {
        screen: Routes.WALLET_SCREEN,
      });
    } catch (e) {
      logger.error(new RainbowError('[WelcomeScreen]: Error creating wallet', e));
      Alert.alert('Error creating wallet', ensureError(e).message);
    } finally {
      walletLoadingStore.setState({
        loadingState: null,
      });
      // eslint-disable-next-line require-atomic-updates
      isCreatingWallet.current = false;
    }
  }, [replace]);

  const handlePressTerms = useCallback(() => {
    openInBrowser('https://rainbow.me/terms-of-use', false);
  }, []);

  const showRestoreSheet = useCallback(() => {
    analytics.track(analytics.event.welcomeAlreadyHave);
    navigate(Routes.ADD_WALLET_NAVIGATOR, {
      isFirstWallet: true,
    });
  }, [navigate]);

  useHardwareBackOnFocus(() => true, !IS_ANDROID);

  return (
    <PerformanceMeasureView interactive={true} screenName="WelcomeScreen">
      <Box style={sx.container} testID="welcome-screen" backgroundColor={colors.white}>
        <RainbowsBackground shouldAnimate={shouldAnimateRainbows} />
        <Animated.View style={[contentStyle, sx.contentContainer]}>
          {IS_ANDROID && IS_TEST ? (
            <RainbowText colors={colors} />
          ) : (
            <MaskedView maskElement={<RainbowText colors={colors} />}>
              <Animated.View style={[textStyle, sx.rainbowTextMask]} />
            </MaskedView>
          )}

          <Animated.View style={buttonStyle}>
            <WelcomeScreenRainbowButton
              emoji="castle"
              height={PRIMARY_BUTTON_HEIGHT}
              onPress={onCreateWallet}
              shadowStyle={createWalletButtonAnimatedShadowStyle}
              style={createWalletButtonAnimatedStyle}
              testID="new-wallet-button"
              text={i18n.t(i18n.l.wallet.new.get_new_wallet)}
              textColor={primaryButtonTextColor}
            />
          </Animated.View>
          <WelcomeScreenRainbowButton
            darkShadowStyle={sx.existingWalletShadow}
            emoji="old_key"
            height={56}
            onPress={showRestoreSheet}
            shadowStyle={sx.existingWalletShadow}
            style={[sx.existingWallet, { backgroundColor: existingWalletBackground }]}
            testID="already-have-wallet-button"
            text={i18n.t(i18n.l.wallet.new.already_have_wallet)}
            textColor={existingWalletTextColor}
          />
        </Animated.View>
        <View style={[sx.termsOfUseContainer, { bottom: insets.bottom / 2 + 32, position: 'absolute' }]}>
          <Text align="center" color={termsTextColor} lineHeight="loose" size="smedium" weight="semibold">
            {i18n.t(i18n.l.wallet.new.terms)}
            <Text
              color={colors.paleBlue}
              lineHeight="loose"
              onPress={handlePressTerms}
              size="smedium"
              suppressHighlighting
              weight="semibold"
            >
              {i18n.t(i18n.l.wallet.new.terms_link)}
            </Text>
          </Text>
        </View>
      </Box>
    </PerformanceMeasureView>
  );
}

const sx = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  existingWallet: {
    width: 248,
  },
  existingWalletShadow: {
    opacity: 0,
  },
  contentContainer: {
    alignItems: 'center',
    height: 192,
    justifyContent: 'space-between',
    marginBottom: 20,
    zIndex: 10,
  },
  termsOfUseContainer: {
    width: 200,
  },
  rainbowTextMask: {
    height: RAINBOW_TEXT_HEIGHT,
    width: RAINBOW_TEXT_WIDTH,
  },
});
