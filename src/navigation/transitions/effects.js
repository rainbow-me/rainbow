import { Animated, StatusBar } from 'react-native';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { calculateKeyboardHeight } from '../../helpers/keyboardHeight';
import { colors } from '../../styles';
import { deviceUtils } from '../../utils';

const statusBarHeight = getStatusBarHeight(true);
export const sheetVerticalOffset = statusBarHeight;
export let swapDetailsTransitionPosition = new Animated.Value(0);

const backgroundInterpolator = ({
  next: { progress: next } = { next: undefined },
}) => ({
  cardStyle: next === undefined ? {} : { opacity: 1 },
});

const exchangeStyleInterpolator = ({
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
      // Translation for the animation of the current card
      transform: [{ translateY }],
    },
    overlayStyle: {
      opacity: backgroundOpacity,
      shadowColor: colors.black,
      shadowOffset: { height: 10, width: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 25,
    },
  };
};

const expandStyleInterpolator = ({
  current: { progress: current },
  layouts: { screen },
}) => {
  const backgroundOpacity = current.interpolate({
    inputRange: [-1, 0, 0.975, 2],
    outputRange: [0, 0, 0.7, 0.7],
  });

  const translateY = current.interpolate({
    extrapolate: 'clamp',
    inputRange: [0, 1],
    outputRange: [screen.height, 0],
  });

  return {
    cardStyle: {
      transform: [{ translateY }],
    },
    overlayStyle: {
      backgroundColor: 'rgb(37, 41, 46)',
      opacity: backgroundOpacity,
      shadowColor: colors.dark,
      shadowOffset: { height: 10, width: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 25,
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
      transform: [{ translateY }],
    },
    overlayStyle: {
      backgroundColor: 'rgb(37, 41, 46)',
      opacity: backgroundOpacity,
      shadowColor: colors.dark,
      shadowOffset: { height: 10, width: 0 },
      shadowOpacity: 0.6,
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
    outputRange: [0, 0, 0.9, 0.9],
  });

  const translateY = current.interpolate({
    extrapolate: 'clamp',
    inputRange: [0, 1],
    outputRange: [screen.height, 0],
  });

  return {
    cardStyle: {
      transform: [{ translateY }],
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

const swapDetailInterpolator = ({
  current: { progress: current },
  layouts: { screen },
}) => {
  // kinda hacky... but lets me expose the
  // stack's transitionPosition in an exportable wayy
  Animated.spring(swapDetailsTransitionPosition, {
    toValue: current,
    useNativeDriver: true,
  }).start();

  const backgroundOpacity = current.interpolate({
    inputRange: [-1, 0, 0.975, 2],
    outputRange: [0, 0, 0.7, 0.7],
  });

  const translateY = current.interpolate({
    inputRange: [0, 1],
    outputRange: [screen.height, 0],
  });

  return {
    cardStyle: {
      // Translation for the animation of the current card
      transform: [{ translateY }],
    },
    overlayStyle: {
      backgroundColor: 'rgb(37, 41, 46)',
      borderBottomWidth: calculateKeyboardHeight(deviceUtils.dimensions.height),
      borderColor: colors.blueGreyDarker,
      opacity: backgroundOpacity,
      overflow: 'hidden',
      shadowColor: colors.dark,
      shadowOffset: { height: 10, width: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 25,
    },
  };
};

const closeSpec = {
  animation: 'spring',
  config: {
    bounciness: 0,
    overshootClamping: true,
    speed: 25,
  },
};

const openSpec = {
  animation: 'spring',
  config: {
    bounciness: 4,
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
  cardStyleInterpolator: expandStyleInterpolator,
  cardTransparent: true,
  gestureDirection: 'vertical',
  gestureResponseDistance,
  onTransitionStart,
  transitionSpec: { close: closeSpec, open: openSpec },
};

export const overlayExpandedPreset = {
  cardOverlayEnabled: true,
  cardShadowEnabled: true,
  cardStyle: { backgroundColor: 'transparent' },
  cardStyleInterpolator: expandStyleInterpolator,
  cardTransparent: true,
  gestureDirection: 'vertical',
  gestureResponseDistance,
  transitionSpec: { close: closeSpec, open: openSpec },
};

export const savingsPreset = {
  cardOverlayEnabled: true,
  cardShadowEnabled: true,
  cardStyle: { backgroundColor: 'transparent' },
  cardStyleInterpolator: savingsStyleInterpolator,
  cardTransparent: true,
  gestureDirection: 'vertical',
  gestureResponseDistance,
  transitionSpec: { close: closeSpec, open: sheetOpenSpec },
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
  cardShadowEnabled: true,
  cardStyle: { backgroundColor: 'transparent' },
  cardStyleInterpolator: swapDetailInterpolator,
  cardTransparent: true,
  gestureDirection: 'vertical',
  gestureResponseDistance,
  transitionSpec: { close: closeSpec, open: openSpec },
};
