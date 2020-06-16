import React from 'react';
import { Animated, StatusBar, View } from 'react-native';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { HeaderHeightWithStatusBar } from '../../components/header';
import { AvatarCircle } from '../../components/profile';
import { colors } from '../../styles';
import { deviceUtils } from '../../utils';
import { transformOrigin } from './transformOriginAnimated';

const statusBarHeight = getStatusBarHeight(true);
export const sheetVerticalOffset = statusBarHeight;
export let swapDetailsTransitionPosition = new Animated.Value(0);

const backgroundInterpolator = ({ current: { progress: current } }) => {
  const cardOpacity = current.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return {
    cardStyle: {
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
      shadowColor: colors.black,
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
      shadowColor: colors.dark,
      shadowOffset: { height: 10, width: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 25,
      transform: [{ translateY }],
    },
    overlayStyle: {
      backgroundColor: colors.blueGreyDarker,
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
      shadowColor: colors.dark,
      shadowOffset: { height: 10, width: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 25,
      transform: [{ translateY }],
    },
    overlayStyle: {
      backgroundColor: colors.dark,
      opacity: backgroundOpacity,
    },
  };
};

const changeWalletStyleInterpolator = targetOpacity => ({
  current: { progress: current },
  layouts: { screen },
}) => {
  const backgroundOpacity = current.interpolate({
    inputRange: [-1, 0, 0.975, 2],
    outputRange: [0, 0, targetOpacity, targetOpacity],
  });

  const cardOpacity = current.interpolate({
    inputRange: [0, 1],
    outputRange: [0.01, 1],
  });

  const scale = current.interpolate({
    inputRange: [0, 1],
    outputRange: [0.21, 1],
  });

  return {
    cardStyle: {
      opacity: cardOpacity,
      transform: transformOrigin(
        {
          x: 0,
          y: -(screen.height / 2) + statusBarHeight + 62,
        },
        { scale }
      ),
    },
    overlayStyle: {
      backgroundColor: '#141414',
      opacity: backgroundOpacity,
      shadowColor: colors.black,
      shadowOffset: { height: 10, width: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 25,
    },
  };
};

const sheetStyleInterpolator = ({
  current: { progress: current },
  layouts: { screen },
}) => {
  const backgroundOpacity = current.interpolate({
    inputRange: [-1, 0, 0.975, 2],
    outputRange: [0, 0, 1, 1],
  });

  const translateY = current.interpolate({
    extrapolate: 'clamp',
    inputRange: [0, 1],
    outputRange: [screen.height, 0],
  });

  return {
    cardStyle: {
      shadowColor: colors.black,
      shadowOffset: { height: 10, width: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 25,
      transform: [{ translateY }],
    },
    overlayStyle: {
      backgroundColor: colors.black,
      opacity: backgroundOpacity,
    },
  };
};

const swapDetailInterpolator = ({
  current: { progress: current },
  layouts: { screen },
}) => {
  // kinda hacky... but lets me expose the
  // stack's transitionPosition in an exportable way
  Animated.spring(swapDetailsTransitionPosition, {
    toValue: current,
    useNativeDriver: true,
  }).start();

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
      shadowColor: colors.dark,
      shadowOffset: { height: 10, width: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 25,
      transform: [{ translateY }],
    },
    overlayStyle: {
      backgroundColor: colors.blueGreyDarker,
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

const gestureResponseDistance = {
  vertical: deviceUtils.dimensions.height,
};

export const onTransitionStart = props => {
  if (props.closing) {
    StatusBar.setBarStyle('dark-content');
  } else {
    StatusBar.setBarStyle('light-content');
  }
};

export const backgroundPreset = {
  cardStyle: { backgroundColor: 'transparent' },
  cardStyleInterpolator: backgroundInterpolator,
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
          backgroundColor: 'rgb(51, 54, 59)',
          height: deviceUtils.dimensions.height,
          opacity: backgroundOpacity,
          position: 'absolute',
          width: deviceUtils.dimensions.width,
        }}
      >
        <View
          style={{
            alignItems: 'center',
            top: HeaderHeightWithStatusBar,
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
  onTransitionStart,
  transitionSpec: { close: closeSpec, open: emojiOpenSpec },
};

export const exchangePreset = {
  cardOverlayEnabled: true,
  cardShadowEnabled: true,
  cardStyle: { backgroundColor: 'transparent' },
  cardStyleInterpolator: exchangeStyleInterpolator,
  cardTransparent: true,
  gestureDirection: 'vertical',
  gestureResponseDistance,
  onTransitionStart,
  transitionSpec: { close: closeSpec, open: sheetOpenSpec },
};

export const expandedPreset = {
  cardOverlayEnabled: true,
  cardShadowEnabled: true,
  cardStyle: { backgroundColor: 'transparent' },
  cardStyleInterpolator: expandStyleInterpolator(0.7),
  cardTransparent: true,
  gestureDirection: 'vertical',
  gestureResponseDistance,
  onTransitionStart,
  transitionSpec: { close: closeSpec, open: openSpec },
};

export const overlayExpandedPreset = {
  cardOverlayEnabled: true,
  cardShadowEnabled: false,
  cardStyle: { backgroundColor: 'transparent', overflow: 'visible' },
  cardStyleInterpolator: expandStyleInterpolator(0.6),
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

export const expandedPresetReverse = {
  cardOverlayEnabled: true,
  cardShadowEnabled: true,
  cardStyle: { backgroundColor: 'transparent' },
  cardStyleInterpolator: changeWalletStyleInterpolator(0.7),
  cardTransparent: true,
  gestureDirection: 'vertical-inverted',
  gestureResponseDistance,
  onTransitionStart,
  transitionSpec: { close: closeSpec, open: openSpec },
};

export const sheetPreset = {
  cardOverlayEnabled: true,
  cardShadowEnabled: true,
  cardStyle: { backgroundColor: 'transparent' },
  cardStyleInterpolator: sheetStyleInterpolator,
  cardTransparent: true,
  gestureDirection: 'vertical',
  gestureResponseDistance,
  onTransitionStart,
  transitionSpec: { close: closeSpec, open: sheetOpenSpec },
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
