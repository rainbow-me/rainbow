import React from 'react';
import { Animated, StatusBar, View } from 'react-native';
import { StackNavigationOptions, TransitionPreset } from '@react-navigation/stack';

import { IS_ANDROID, IS_IOS } from '@/env';
import { lightModeThemeColors } from '@/styles';
import { currentColors as colors } from '@/theme';
import { deviceUtils, safeAreaInsetValues } from '@/utils';
import { HARDWARE_WALLET_TX_NAVIGATOR_SHEET_HEIGHT } from '@/navigation/HardwareWalletTxNavigator';
import { HeaderHeightWithStatusBar } from '@/components/header';
import AvatarCircle from '@/components/profile/AvatarCircle';
import Routes from '@/navigation/routesNames';
import { EmojiAvatar, ProfileAvatarSize } from '@/components/asset-list/RecyclerAssetList2/profile-header/ProfileAvatarRow';
import { BottomSheetNavigationOptions } from './bottom-sheet/types';
import { initialWindowMetrics } from 'react-native-safe-area-context';

const statusBarHeight = IS_IOS ? safeAreaInsetValues.top : StatusBar.currentHeight;
export const sheetVerticalOffset = statusBarHeight;

export const AVATAR_CIRCLE_TOP_MARGIN = android ? 10 : 4;

const backgroundInterpolator = ({ current: { progress: current }, layouts: { screen } }: any) => {
  const cardOpacity = current.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const translateY = current.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [screen.height, 0, 0],
  });

  return {
    cardStyle: {
      transform: [{ translateY }],
    },
    overlayStyle: {
      opacity: cardOpacity,
    },
  };
};

const emojiStyleInterpolator = ({ current: { progress: current }, layouts: { screen } }: any) => {
  const backgroundOpacity = current.interpolate({
    inputRange: [-1, 0, 0.975, 2],
    outputRange: [0, 0, 1, 1],
  });

  const translateY = current.interpolate({
    inputRange: [0, 1],
    outputRange: [screen.height, 0],
  });

  return {
    cardStyle: {
      transform: [{ translateY }],
    },
    overlayStyle: {
      opacity: backgroundOpacity,
    },
  };
};

export const speedUpAndCancelStyleInterpolator = ({ current: { progress: current }, layouts: { screen } }: any) => {
  const backgroundOpacity = current.interpolate({
    inputRange: [-1, 0, 0.925, 2],
    outputRange: [0, 0, 0.6, 1],
  });

  const translateY = current.interpolate({
    inputRange: [-1, 0, 1, 2],
    outputRange: [screen.height, screen.height, 0, 0],
  });

  return {
    cardStyle: {
      shadowColor: colors.themedColors?.shadowBlack,
      shadowOffset: { height: 10, width: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 25,
      transform: [{ translateY }],
    },
    overlayStyle: {
      opacity: backgroundOpacity,
    },
  };
};

const exchangeStyleInterpolator = ({ current: { progress: current }, layouts: { screen } }: any) => {
  const backgroundOpacity = current.interpolate({
    inputRange: [-1, 0, 0.925, 2],
    outputRange: [0, 0, 1, 1],
  });

  const translateY = current.interpolate({
    inputRange: [-1, 0, 1, 2],
    outputRange: [screen.height, screen.height, 0, 0],
  });

  return {
    cardStyle: {
      shadowColor: colors.themedColors?.shadowBlack,
      shadowOffset: { height: 10, width: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 25,
      transform: [{ translateY }],
    },
    overlayStyle: {
      opacity: backgroundOpacity,
    },
  };
};

export const expandStyleInterpolator =
  (targetOpacity: number) =>
  ({ current: { progress: current }, layouts: { screen } }: any) => {
    const backgroundOpacity = current.interpolate({
      inputRange: [-1, 0, 0.975, 2],
      outputRange: [0, 0, targetOpacity, targetOpacity],
    });

    const translateY = current.interpolate({
      inputRange: [0, 1, 2],
      outputRange: [screen.height, 0, -screen.height / 3],
    });

    return {
      cardStyle: {
        shadowColor: colors.themedColors?.shadow,
        shadowOffset: { height: 10, width: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 25,
        transform: [{ translateY }],
      },
      overlayStyle: {
        backgroundColor: lightModeThemeColors.blueGreyDarker,
        opacity: backgroundOpacity,
      },
    };
  };

const savingsStyleInterpolator = ({ current: { progress: current }, layouts: { screen } }: any) => {
  const backgroundOpacity = current.interpolate({
    inputRange: [-1, 0, 0.975, 2],
    outputRange: [0, 0, 0.4, 0.4],
  });

  const translateY = current.interpolate({
    extrapolate: 'clamp',
    inputRange: [0, 1],
    outputRange: [screen.height, 0],
  });

  return {
    cardStyle: {
      shadowColor: colors.themedColors?.shadow,
      shadowOffset: { height: 10, width: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 25,
      transform: [{ translateY }],
    },
    overlayStyle: {
      backgroundColor: colors.themedColors?.shadow,
      opacity: backgroundOpacity,
    },
  };
};

const sheetStyleInterpolator =
  (targetOpacity = 1) =>
  ({ current: { progress: current }, layouts: { screen } }: any) => {
    const backgroundOpacity = current.interpolate({
      inputRange: [-1, 0, 0.975, 2],
      outputRange: [0, 0, targetOpacity, targetOpacity],
    });

    const translateY = current.interpolate({
      extrapolate: 'clamp',
      inputRange: [0, 1],
      outputRange: [screen.height, 0],
    });

    return {
      cardStyle: {
        shadowColor: colors.themedColors?.shadowBlack,
        shadowOffset: { height: 10, width: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 25,
        transform: [{ translateY }],
      },
      overlayStyle: {
        backgroundColor: lightModeThemeColors.shadowBlack,
        opacity: backgroundOpacity,
      },
    };
  };

const swapDetailInterpolator = ({ current: { progress: current }, layouts: { screen } }: any) => {
  const backgroundOpacity = current.interpolate({
    inputRange: [-1, 0, 0.975, 2],
    outputRange: [0, 0, 0.6, 0.6],
  });

  const translateY = current.interpolate({
    inputRange: [0, 1],
    outputRange: [screen.height, 0],
  });

  return {
    cardStyle: {
      shadowColor: colors.themedColors?.shadow,
      shadowOffset: { height: 10, width: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 25,
      transform: [{ translateY }],
    },
    overlayStyle: {
      backgroundColor: lightModeThemeColors.blueGreyDarker,
      opacity: backgroundOpacity,
      overflow: 'hidden',
    },
  };
};

const closeSpec: TransitionPreset['transitionSpec']['close'] = {
  animation: 'spring',
  config: {
    bounciness: 0,
    speed: 14,
  },
};

const emojiOpenSpec: TransitionPreset['transitionSpec']['open'] = {
  animation: 'spring',
  config: {
    damping: 37.5,
    mass: 1,
    stiffness: 500,
  },
};

const openSpec: TransitionPreset['transitionSpec']['open'] = {
  animation: 'spring',
  config: {
    bounciness: 6,
    speed: 25,
  },
};

const sheetOpenSpec: TransitionPreset['transitionSpec']['open'] = {
  animation: 'spring',
  config: {
    bounciness: 0,
    speed: 22,
  },
};

/**
 * @see https://reactnavigation.org/docs/upgrading-from-5.x/#the-gestureresponsedistance-option-is-now-a-number-instead-of-an-object
 */
const gestureResponseDistanceFactory = (distance: number) => distance;

const gestureResponseDistance = gestureResponseDistanceFactory(deviceUtils.dimensions.height);
const smallGestureResponseDistance = gestureResponseDistanceFactory(100);

export const backgroundPreset = {
  cardStyle: { backgroundColor: 'transparent' },
  cardStyleInterpolator: backgroundInterpolator,
  gestureResponseDistance,
};

export const emojiPreset: StackNavigationOptions = {
  cardOverlay: ({ style }: any) => {
    const backgroundOpacity = style.opacity.interpolate({
      inputRange: [-1, 0, 0.975, 2],
      outputRange: [0, 0, 1, 1],
    });

    return (
      <Animated.View
        pointerEvents="none"
        style={{
          backgroundColor: colors.theme === 'dark' ? colors.themedColors?.offWhite : 'rgb(51, 54, 59)',
          height: deviceUtils.dimensions.height + 50,
          opacity: backgroundOpacity,
          position: 'absolute',
          width: deviceUtils.dimensions.width,
        }}
      >
        <View
          style={{
            alignItems: 'center',
            top: HeaderHeightWithStatusBar + AVATAR_CIRCLE_TOP_MARGIN + 50,
          }}
        >
          {/* @ts-ignore */}
          <AvatarCircle overlayStyles />
        </View>
      </Animated.View>
    );
  },
  cardOverlayEnabled: true,
  cardShadowEnabled: false,
  cardStyle: { backgroundColor: 'transparent' },
  cardStyleInterpolator: emojiStyleInterpolator,
  gestureDirection: 'vertical-inverted',
  gestureEnabled: false,
  gestureResponseDistance,
  transitionSpec: { close: closeSpec, open: emojiOpenSpec },
};

export const emojiPresetWallet: StackNavigationOptions = {
  ...emojiPreset,
  cardOverlay: ({ style }: any) => {
    const backgroundOpacity = style.opacity.interpolate({
      inputRange: [-1, 0, 0.975, 2],
      outputRange: [0, 0, 1, 1],
    });

    return (
      <Animated.View
        pointerEvents="none"
        style={{
          backgroundColor: colors.theme === 'dark' ? colors.themedColors?.offWhite : 'rgb(51, 54, 59)',
          height: deviceUtils.dimensions.height + 50,
          opacity: backgroundOpacity,
          position: 'absolute',
          width: deviceUtils.dimensions.width,
        }}
      >
        <View
          style={{
            alignItems: 'center',
            top: HeaderHeightWithStatusBar - 16,
          }}
        >
          <EmojiAvatar size={ProfileAvatarSize} />
        </View>
      </Animated.View>
    );
  },
  cardStyle: {
    marginTop: 24,
    ...(typeof emojiPreset.cardStyle === 'object' ? emojiPreset.cardStyle : {}),
  },
};

export const exchangePreset: StackNavigationOptions = {
  cardOverlayEnabled: true,
  cardShadowEnabled: true,
  cardStyle: { backgroundColor: 'transparent' },
  cardStyleInterpolator: exchangeStyleInterpolator,
  gestureDirection: 'vertical',
  gestureEnabled: true,
  gestureResponseDistance,
  transitionSpec: { close: closeSpec, open: sheetOpenSpec },
};

export const ensPreset: StackNavigationOptions = {
  cardOverlayEnabled: true,
  cardShadowEnabled: true,
  cardStyle: { backgroundColor: 'transparent' },
  cardStyleInterpolator: speedUpAndCancelStyleInterpolator,
  gestureDirection: 'vertical',
  gestureEnabled: true,
  gestureResponseDistance,
  transitionSpec: { close: closeSpec, open: sheetOpenSpec },
};

export const androidRecievePreset: StackNavigationOptions = {
  cardStyle: { backgroundColor: 'transparent' },
  cardStyleInterpolator: expandStyleInterpolator(0.9),
  gestureDirection: 'vertical',
  gestureEnabled: true,
  gestureResponseDistance,
  transitionSpec: { close: closeSpec, open: sheetOpenSpec },
};

export const wcPromptPreset = {
  ...exchangePreset,
  cardStyleInterpolator: expandStyleInterpolator(0.7),
};

export const expandedPreset: StackNavigationOptions = {
  cardOverlayEnabled: true,
  cardShadowEnabled: true,
  cardStyle: { backgroundColor: 'transparent', overflow: 'visible' },
  cardStyleInterpolator: expandStyleInterpolator(0.7),
  gestureDirection: 'vertical',
  gestureResponseDistance,
  transitionSpec: { close: closeSpec, open: openSpec },
  detachPreviousScreen: false,
};

export const swapSettingsPreset: StackNavigationOptions = {
  cardOverlayEnabled: true,
  cardShadowEnabled: true,
  cardStyle: { backgroundColor: 'transparent', overflow: 'visible' },
  cardStyleInterpolator: expandStyleInterpolator(1),
  gestureDirection: 'vertical',
  gestureResponseDistance,
  transitionSpec: { close: closeSpec, open: openSpec },
};

export const overlayExpandedPreset: StackNavigationOptions = {
  cardOverlayEnabled: true,
  cardShadowEnabled: false,
  cardStyle: { backgroundColor: 'transparent', overflow: 'visible' },
  cardStyleInterpolator: expandStyleInterpolator(0.7),
  gestureDirection: 'vertical',
  gestureResponseDistance,
  transitionSpec: { close: closeSpec, open: openSpec },
  detachPreviousScreen: false,
};

export const bottomSheetPreset: StackNavigationOptions & BottomSheetNavigationOptions = {
  cardOverlayEnabled: true,
  cardShadowEnabled: true,
  cardStyle: { backgroundColor: 'transparent' },
  cardStyleInterpolator: savingsStyleInterpolator,
  gestureDirection: 'vertical',
  gestureResponseDistance,
  transitionSpec: { close: closeSpec, open: sheetOpenSpec },
};
export const walletconnectBottomSheetPreset: BottomSheetNavigationOptions = {
  backdropColor: 'black',
  backdropOpacity: 1,
  enableContentPanningGesture: false,
  backdropPressBehavior: 'none',
  height: '100%',
};

export const consoleSheetPreset: BottomSheetNavigationOptions = {
  backdropColor: 'black',
  backdropOpacity: 1,
};

export const swapSheetPreset: BottomSheetNavigationOptions = {
  backdropColor: 'black',
  backdropOpacity: 0.9,
  enableContentPanningGesture: IS_ANDROID,
  backdropPressBehavior: 'none',
  height: '100%',
};

export const expandedPresetWithSmallGestureResponseDistance: StackNavigationOptions & BottomSheetNavigationOptions = {
  ...expandedPreset,
  gestureResponseDistance: smallGestureResponseDistance,
};

export const addWalletNavigatorPreset = ({ route }: any) => ({
  height: route.params?.sheetHeight,
});

export const nftSingleOfferSheetPreset = ({ route }: any) => ({
  ...bottomSheetPreset,
  height: (route?.params.longFormHeight || 0) + (initialWindowMetrics?.insets?.bottom || 0),
});

export const appIconUnlockSheetPreset = ({ route }: any) => ({
  ...bottomSheetPreset,
  height: (route?.params.longFormHeight || 0) + (initialWindowMetrics?.insets?.bottom || 0),
});

export const hardwareWalletTxNavigatorPreset = {
  height: HARDWARE_WALLET_TX_NAVIGATOR_SHEET_HEIGHT,
  backdropOpacity: 1,
};

export const sheetPreset = ({ route }: any): StackNavigationOptions & BottomSheetNavigationOptions => {
  const shouldUseNonTransparentOverlay =
    route.params?.type === 'token' ||
    route.params?.type === 'unique_token' ||
    route.params?.type === 'unique_token' ||
    route.name === Routes.SEND_SHEET_NAVIGATOR;
  return {
    cardOverlayEnabled: true,
    cardShadowEnabled: true,
    cardStyle: { backgroundColor: 'transparent' },
    cardStyleInterpolator: sheetStyleInterpolator(shouldUseNonTransparentOverlay ? 0.7 : 0),
    gestureDirection: 'vertical',
    gestureResponseDistance: route.params?.type === 'unique_token' ? gestureResponseDistanceFactory(150) : gestureResponseDistance,
    transitionSpec: { close: closeSpec, open: sheetOpenSpec },
  };
};

export const addCashSheet: StackNavigationOptions = {
  cardOverlayEnabled: true,
  cardShadowEnabled: true,
  cardStyle: { backgroundColor: 'transparent' },
  cardStyleInterpolator: sheetStyleInterpolator(1),
  gestureDirection: 'vertical',
  gestureResponseDistance: gestureResponseDistance,
  transitionSpec: { close: closeSpec, open: sheetOpenSpec },
};

export const selectUniquePreset = () => {
  return {
    cardOverlayEnabled: true,
    cardShadowEnabled: true,
    cardStyle: { backgroundColor: 'transparent' },
    cardStyleInterpolator: sheetStyleInterpolator(0.7),
    gestureDirection: 'vertical',
    gestureResponseDistance: gestureResponseDistanceFactory(300),
    transitionSpec: { close: closeSpec, open: sheetOpenSpec },
  };
};

export const settingsPreset = ({ route }: any) => ({
  ...sheetPreset({ route }),
  cardStyleInterpolator: sheetStyleInterpolator(0.7),
});

export const exchangeModalPreset = {
  cardStyle: { backgroundColor: 'black' },
  cardStyleInterpolator: () => ({
    overlayStyle: {
      backgroundColor: 'black',
    },
  }),
  gestureEnabled: true,
  gestureResponseDistance,
};

export const swapDetailsPreset = {
  cardOverlayEnabled: true,
  cardShadowEnabled: true,
  cardStyle: { backgroundColor: 'transparent' },
  cardStyleInterpolator: swapDetailInterpolator,
  gestureDirection: 'vertical',
  gestureResponseDistance,
  transitionSpec: { close: closeSpec, open: openSpec },
};
