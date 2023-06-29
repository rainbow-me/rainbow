import React from 'react';
import { Animated, StatusBar, View } from 'react-native';
import { HeaderHeightWithStatusBar } from '../components/header';
import { AvatarCircle } from '../components/profile';
import Routes from '@/navigation/routesNames';
import { lightModeThemeColors } from '@/styles';
import { currentColors as colors } from '@/theme';
import { deviceUtils, safeAreaInsetValues } from '@/utils';
import {
  EmojiAvatar,
  ProfileAvatarSize,
} from '@/components/asset-list/RecyclerAssetList2/profile-header/ProfileAvatarRow';
import { HARDWARE_WALLET_TX_NAVIGATOR_SHEET_HEIGHT } from './HardwareWalletTxNavigator';
import { IS_IOS } from '@/env';

const statusBarHeight = IS_IOS
  ? safeAreaInsetValues.top
  : StatusBar.currentHeight;
export const sheetVerticalOffset = statusBarHeight;

export const AVATAR_CIRCLE_TOP_MARGIN = android ? 10 : 4;

const backgroundInterpolator = ({
  current: { progress: current },
  layouts: { screen },
}) => {
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

const emojiStyleInterpolator = ({
  current: { progress: current },
  layouts: { screen },
}) => {
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

export const speedUpAndCancelStyleInterpolator = ({
  current: { progress: current },
  layouts: { screen },
}) => {
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
      shadowColor: colors.themedColors.shadowBlack,
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

const exchangeStyleInterpolator = ({
  current: { progress: current },
  layouts: { screen },
}) => {
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
      shadowColor: colors.themedColors.shadowBlack,
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

const expandStyleInterpolator = targetOpacity => ({
  current: { progress: current },
  layouts: { screen },
}) => {
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
      shadowColor: colors.themedColors.shadow,
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

const savingsStyleInterpolator = ({
  current: { progress: current },
  layouts: { screen },
}) => {
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
      shadowColor: colors.themedColors.shadow,
      shadowOffset: { height: 10, width: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 25,
      transform: [{ translateY }],
    },
    overlayStyle: {
      backgroundColor: colors.themedColors.shadow,
      opacity: backgroundOpacity,
    },
  };
};

const sheetStyleInterpolator = (targetOpacity = 1) => ({
  current: { progress: current },
  layouts: { screen },
}) => {
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
      shadowColor: colors.themedColors.shadowBlack,
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

const swapDetailInterpolator = ({
  current: { progress: current },
  layouts: { screen },
}) => {
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
      shadowColor: colors.themedColors.shadow,
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

const closeSpec = {
  animation: 'spring',
  config: {
    bounciness: 0,
    speed: 14,
  },
};

const emojiOpenSpec = {
  animation: 'spring',
  config: {
    damping: 37.5,
    mass: 1,
    stiffness: 500,
  },
};

const openSpec = {
  animation: 'spring',
  config: {
    bounciness: 6,
    speed: 25,
  },
};

const sheetOpenSpec = {
  animation: 'spring',
  config: {
    bounciness: 0,
    speed: 22,
  },
};

const gestureResponseDistanceFactory = distance => ({
  vertical: distance,
});

const gestureResponseDistance = gestureResponseDistanceFactory(
  deviceUtils.dimensions.height
);
const smallGestureResponseDistance = gestureResponseDistanceFactory(100);

export const backgroundPreset = {
  cardStyle: { backgroundColor: 'transparent' },
  cardStyleInterpolator: backgroundInterpolator,
  gestureResponseDistance,
};

export const emojiPreset = {
  cardOverlay: ({ style }) => {
    const backgroundOpacity = style.opacity.interpolate({
      inputRange: [-1, 0, 0.975, 2],
      outputRange: [0, 0, 1, 1],
    });

    return (
      <Animated.View
        pointerEvents="none"
        style={{
          backgroundColor:
            colors.theme === 'dark'
              ? colors.themedColors.offWhite
              : 'rgb(51, 54, 59)',
          height: deviceUtils.dimensions.height + 50,
          opacity: backgroundOpacity,
          position: 'absolute',
          width: deviceUtils.dimensions.width,
        }}
      >
        <View
          style={{
            alignItems: 'center',
            top: HeaderHeightWithStatusBar + AVATAR_CIRCLE_TOP_MARGIN,
          }}
        >
          <AvatarCircle overlayStyles />
        </View>
      </Animated.View>
    );
  },
  cardOverlayEnabled: true,
  cardShadowEnabled: false,
  cardStyle: { backgroundColor: 'transparent' },
  cardStyleInterpolator: emojiStyleInterpolator,
  cardTransparent: true,
  gestureDirection: 'vertical-inverted',
  gestureEnabled: false,
  gestureResponseDistance,
  transitionSpec: { close: closeSpec, open: emojiOpenSpec },
};

export const emojiPresetWallet = {
  ...emojiPreset,
  cardOverlay: ({ style }) => {
    const backgroundOpacity = style.opacity.interpolate({
      inputRange: [-1, 0, 0.975, 2],
      outputRange: [0, 0, 1, 1],
    });

    return (
      <Animated.View
        pointerEvents="none"
        style={{
          backgroundColor:
            colors.theme === 'dark'
              ? colors.themedColors.offWhite
              : 'rgb(51, 54, 59)',
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
  cardStyle: { marginTop: 24, ...emojiPreset.cardStyle },
};

export const exchangePreset = {
  cardOverlayEnabled: true,
  cardShadowEnabled: true,
  cardStyle: { backgroundColor: 'transparent' },
  cardStyleInterpolator: exchangeStyleInterpolator,
  cardTransparent: true,
  gestureDirection: 'vertical',
  gestureEnabled: true,
  gestureResponseDistance,
  transitionSpec: { close: closeSpec, open: sheetOpenSpec },
};

export const ensPreset = {
  cardOverlayEnabled: true,
  cardShadowEnabled: true,
  cardStyle: { backgroundColor: 'transparent' },
  cardStyleInterpolator: speedUpAndCancelStyleInterpolator,
  cardTransparent: true,
  gestureDirection: 'vertical',
  gestureEnabled: true,
  gestureResponseDistance,
  transitionSpec: { close: closeSpec, open: sheetOpenSpec },
};

export const androidRecievePreset = {
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

export const expandedPreset = {
  cardOverlayEnabled: true,
  cardShadowEnabled: true,
  cardStyle: { backgroundColor: 'transparent', overflow: 'visible' },
  cardStyleInterpolator: expandStyleInterpolator(0.7),
  cardTransparent: true,
  gestureDirection: 'vertical',
  gestureResponseDistance,
  transitionSpec: { close: closeSpec, open: openSpec },
};

export const swapSettingsPreset = {
  cardOverlayEnabled: true,
  cardShadowEnabled: true,
  cardStyle: { backgroundColor: 'transparent', overflow: 'visible' },
  cardStyleInterpolator: expandStyleInterpolator(1),
  cardTransparent: true,
  gestureDirection: 'vertical',
  gestureResponseDistance,
  transitionSpec: { close: closeSpec, open: openSpec },
};

export const overlayExpandedPreset = {
  cardOverlayEnabled: true,
  cardShadowEnabled: false,
  cardStyle: { backgroundColor: 'transparent', overflow: 'visible' },
  cardStyleInterpolator: expandStyleInterpolator(0.7),
  cardTransparent: true,
  gestureDirection: 'vertical',
  gestureResponseDistance,
  transitionSpec: { close: closeSpec, open: openSpec },
};

export const bottomSheetPreset = {
  cardOverlayEnabled: true,
  cardShadowEnabled: true,
  cardStyle: { backgroundColor: 'transparent' },
  cardStyleInterpolator: savingsStyleInterpolator,
  cardTransparent: true,
  gestureDirection: 'vertical',
  gestureResponseDistance,
  transitionSpec: { close: closeSpec, open: sheetOpenSpec },
};

export const sheetPresetWithSmallGestureResponseDistance = navigation => ({
  ...sheetPreset(navigation),
  gestureResponseDistance: smallGestureResponseDistance,
});

export const expandedPresetWithSmallGestureResponseDistance = {
  ...expandedPreset,
  gestureResponseDistance: smallGestureResponseDistance,
};

export const addWalletNavigatorPreset = ({ route }) => ({
  height: route.params?.sheetHeight,
});

export const nftSingleOfferSheetPreset = ({ route }) => ({
  ...bottomSheetPreset,
  height: route?.params.longFormHeight,
});

export const hardwareWalletTxNavigatorPreset = {
  height: HARDWARE_WALLET_TX_NAVIGATOR_SHEET_HEIGHT,
  backdropOpacity: 1,
};

export const sheetPreset = ({ route }) => {
  const shouldUseNonTransparentOverlay =
    route.params?.type === 'token' ||
    route.params?.type === 'unique_token' ||
    route.params?.type === 'unique_token' ||
    route.name === Routes.SEND_SHEET_NAVIGATOR;
  return {
    cardOverlayEnabled: true,
    cardShadowEnabled: true,
    cardStyle: { backgroundColor: 'transparent' },
    cardStyleInterpolator: sheetStyleInterpolator(
      shouldUseNonTransparentOverlay ? 0.7 : 0
    ),
    cardTransparent: true,
    gestureDirection: 'vertical',
    gestureResponseDistance:
      route.params?.type === 'unique_token'
        ? gestureResponseDistanceFactory(150)
        : gestureResponseDistance,
    transitionSpec: { close: closeSpec, open: sheetOpenSpec },
  };
};

export const addCashSheet = () => {
  return {
    cardOverlayEnabled: true,
    cardShadowEnabled: true,
    cardStyle: { backgroundColor: 'transparent' },
    cardStyleInterpolator: sheetStyleInterpolator(1),
    cardTransparent: true,
    gestureDirection: 'vertical',
    gestureResponseDistance: gestureResponseDistance,
    transitionSpec: { close: closeSpec, open: sheetOpenSpec },
  };
};

export const selectUniquePreset = () => {
  return {
    cardOverlayEnabled: true,
    cardShadowEnabled: true,
    cardStyle: { backgroundColor: 'transparent' },
    cardStyleInterpolator: sheetStyleInterpolator(0.7),
    cardTransparent: true,
    gestureDirection: 'vertical',
    gestureResponseDistance: gestureResponseDistanceFactory(300),
    transitionSpec: { close: closeSpec, open: sheetOpenSpec },
  };
};

export const settingsPreset = ({ route }) => ({
  ...sheetPreset({ route }),
  cardStyleInterpolator: sheetStyleInterpolator(0.7),
});

export const exchangeModalPreset = {
  cardStyle: { backgroundColor: 'transparent' },
  cardStyleInterpolator: () => ({
    overlayStyle: {
      backgroundColor: 'transparent',
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
  cardTransparent: true,
  gestureDirection: 'vertical',
  gestureResponseDistance,
  transitionSpec: { close: closeSpec, open: openSpec },
};
