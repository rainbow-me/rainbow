import { Animated, StatusBar } from 'react-native';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { calculateKeyboardHeight } from '../../helpers/keyboardHeight';
import { colors } from '../../styles';
import { deviceUtils } from '../../utils';

const statusBarHeight = getStatusBarHeight(true);
export const sheetVerticalOffset = statusBarHeight;
export let swapDetailsTransitionPosition = new Animated.Value(0);

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
    outputRange: [-(screen.height / 2) + statusBarHeight + 78.5, 0],
  });

  const scale = current.interpolate({
    inputRange: [-1, 0, 0.99, 2],
    outputRange: [0.01, 0.01, 1, 1],
  });

  return {
    cardStyle: {
      opacity: backgroundOpacity,
      transform: [{ translateY }, { scale }],
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

const exchangeStyleInterpolator = ({
  current: { progress: current },
  layouts: { screen },
}) => {
  const backgroundOpacity = current.interpolate({
    inputRange: [-1, 0, 0.975, 2],
    outputRange: [0, 0, 1, 1],
  });

  const translateY = current.interpolate({
    inputRange: [-1, 0, 1, 2],
    outputRange: [screen.height, screen.height, 0, 0],
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

const exchangeDetailsStyleInterpolator = ({
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

export const emojiPreset = {
  cardOverlayEnabled: true,
  cardShadowEnabled: true,
  cardStyle: { backgroundColor: 'transparent' },
  cardStyleInterpolator: emojiStyleInterpolator,
  cardTransparent: true,
  gestureDirection: 'vertical-inverted',
  gestureResponseDistance,
  onTransitionStart,
  transitionSpec: { close: closeSpec, open: sheetOpenSpec },
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
  transitionSpec: { close: closeSpec, open: sheetOpenSpec },
};

export const expandedPreset = {
  cardOverlayEnabled: true,
  cardShadowEnabled: true,
  cardStyle: { backgroundColor: 'transparent' },
  cardStyleInterpolator: exchangeDetailsStyleInterpolator,
  cardTransparent: true,
  gestureDirection: 'vertical',
  gestureResponseDistance,
  onTransitionStart,
  transitionSpec: { close: closeSpec, open: openSpec },
};

export const exchangeDetailsPreset = {
  cardOverlayEnabled: true,
  cardShadowEnabled: true,
  cardStyle: { backgroundColor: 'transparent' },
  cardStyleInterpolator: exchangeDetailsStyleInterpolator,
  cardTransparent: true,
  gestureDirection: 'vertical',
  gestureResponseDistance,
  transitionSpec: { close: closeSpec, open: sheetOpenSpec },
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

export const overlayExpandedPreset = {
  cardOverlayEnabled: true,
  cardShadowEnabled: true,
  cardStyle: { backgroundColor: 'transparent', overflow: 'visible' },
  cardStyleInterpolator: expandStyleInterpolator(0.7),
  cardTransparent: true,
  gestureDirection: 'vertical',
  gestureResponseDistance,
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
  cardShadowEnabled: true,
  cardStyle: { backgroundColor: 'transparent' },
  cardStyleInterpolator: swapDetailInterpolator,
  cardTransparent: true,
  gestureDirection: 'vertical',
  gestureResponseDistance,
  transitionSpec: { close: closeSpec, open: openSpec },
};
