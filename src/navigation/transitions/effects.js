import { StatusBar } from 'react-native';
import Animated from 'react-native-reanimated';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import store from '../../redux/store';
import { updateTransitionProps } from '../../redux/navigation';
import { interpolate } from '../../components/animations';
import { deviceUtils } from '../../utils';
import { colors } from '../../styles';

const { and, block, call, color, cond, eq, or, SpringUtils } = Animated;

const statusBarHeight = getStatusBarHeight(true);

const expand = {};
expand.translateY = deviceUtils.dimensions.height;

export const sheetVerticalOffset = statusBarHeight;

const effectOpacity = Animated.proc((closing, current) =>
  block([
    cond(
      // onStart
      or(
        and(eq(closing, 0), eq(current, 0)),
        and(eq(closing, 1), eq(current, 1))
      ),
      // setShowingModal
      call([], () => {
        store.dispatch(updateTransitionProps({ showingModal: true }));
      })
    ),
    // return opacity value of 1
    1,
  ])
);

const exchangeStyleInterpolator = ({
  closing,
  current: { progress: current },
  layouts: { screen },
}) => {
  const backgroundOpacity = interpolate(current, {
    extrapolate: Animated.Extrapolate.CLAMP,
    inputRange: [-1, 0, 0.975, 2],
    outputRange: [0, 0, 1, 1],
  });

  const translateY = interpolate(current, {
    inputRange: [0, 1],
    outputRange: [screen.height, 0],
  });

  return {
    cardStyle: {
      opacity: effectOpacity(closing, current),
      shadowColor: colors.black,
      shadowOffset: { height: 10, width: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 50,
      // Translation for the animation of the current card
      transform: [{ translateY }],
    },
    containerStyle: {
      backgroundColor: color(20, 20, 20, backgroundOpacity),
    },
  };
};

const expandStyleInterpolator = ({
  closing,
  current: { progress: current },
  layouts: { screen },
}) => {
  const backgroundOpacity = interpolate(current, {
    extrapolate: Animated.Extrapolate.CLAMP,
    inputRange: [-1, 0, 0.975, 2],
    outputRange: [0, 0, 0.7, 0.7],
  });

  const translateY = interpolate(current, {
    inputRange: [0, 1],
    outputRange: [screen.height, 0],
  });

  return {
    cardStyle: {
      opacity: effectOpacity(closing, current),
      shadowColor: colors.dark,
      shadowOffset: { height: 10, width: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 50,
      // Translation for the animation of the current card
      transform: [{ translateY }],
    },
    containerStyle: {
      backgroundColor: color(37, 41, 46, backgroundOpacity),
    },
  };
};

const sheetStyleInterpolator = ({
  current: { progress: current },
  layouts: { screen },
}) => {
  const backgroundOpacity = interpolate(current, {
    extrapolate: Animated.Extrapolate.CLAMP,
    inputRange: [-1, 0, 0.975, 2],
    outputRange: [0, 0, 0.9, 0.9],
  });

  const cardBackgroundOpacity = interpolate(current, {
    extrapolate: Animated.Extrapolate.CLAMP,
    inputRange: [-1, 0, 0.99, 1, 2],
    outputRange: [0, 0, 0, 1, 1],
  });

  const translateY = block([
    interpolate(current, {
      inputRange: [0, 1],
      outputRange: [screen.height, 0],
    }),
  ]);

  return {
    cardStyle: {
      backgroundColor: color(20, 20, 20, cardBackgroundOpacity),
      shadowColor: colors.black,
      shadowOffset: { height: 10, width: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 50,
      // Translation for the animation of the current card
      transform: [{ translateY }],
    },
    containerStyle: {
      backgroundColor: color(0, 0, 0, backgroundOpacity),
    },
  };
};

const backgroundInterpolator = ({
  next: { progress: next } = { next: undefined },
}) => {
  if (next === undefined) {
    return { cardStyle: {} };
  }

  return { cardStyle: { opacity: 1 } };
};

const closeSpec = {
  animation: 'spring',
  config: SpringUtils.makeConfigFromBouncinessAndSpeed({
    ...SpringUtils.makeDefaultConfig(),
    bounciness: 0,
    mass: 1,
    overshootClamping: true,
    speed: 25,
  }),
};

const openSpec = {
  animation: 'spring',
  config: SpringUtils.makeConfigFromBouncinessAndSpeed({
    ...SpringUtils.makeDefaultConfig(),
    bounciness: 4,
    mass: 1,
    speed: 25,
  }),
};

const sheetOpenSpec = {
  animation: 'spring',
  config: SpringUtils.makeConfigFromBouncinessAndSpeed({
    ...SpringUtils.makeDefaultConfig(),
    bounciness: 0,
    mass: 1,
    speed: 22,
  }),
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

export const exchangePreset = {
  cardShadowEnabled: true,
  cardStyleInterpolator: exchangeStyleInterpolator,
  cardTransparent: true,
  gestureDirection: 'vertical',
  gestureResponseDistance,
  onTransitionStart,
  transitionSpec: { close: closeSpec, open: sheetOpenSpec },
};

export const overlayExpandedPreset = {
  cardShadowEnabled: true,
  cardStyleInterpolator: expandStyleInterpolator,
  cardTransparent: true,
  gestureDirection: 'vertical',
  gestureResponseDistance,
  transitionSpec: { close: closeSpec, open: openSpec },
};

export const expandedPreset = {
  cardShadowEnabled: true,
  cardStyleInterpolator: expandStyleInterpolator,
  cardTransparent: true,
  gestureDirection: 'vertical',
  gestureResponseDistance,
  onTransitionStart,
  transitionSpec: { close: closeSpec, open: openSpec },
};

export const sheetPreset = {
  cardShadowEnabled: true,
  cardStyleInterpolator: sheetStyleInterpolator,
  cardTransparent: true,
  gestureDirection: 'vertical',
  gestureResponseDistance,
  onTransitionStart,
  transitionSpec: { close: closeSpec, open: sheetOpenSpec },
};

export const backgroundPreset = {
  cardStyleInterpolator: backgroundInterpolator,
};
