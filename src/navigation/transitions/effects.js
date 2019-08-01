import { StatusBar } from 'react-native';
import Animated from 'react-native-reanimated';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import store from '../../redux/store';
import { updateTransitionProps } from '../../redux/navigation';
import { deviceUtils } from '../../utils';
import { colors } from '../../styles';

const {
  and,
  block,
  call,
  color,
  cond,
  eq,
  interpolate,
  or,
  SpringUtils,
} = Animated;

const statusBarHeight = getStatusBarHeight(true);

const expand = {};
expand.opacityEnd = 0.75;
expand.translateY = deviceUtils.dimensions.height;

const sheet = {};
sheet.borderRadiusEnd = 16;

export const sheetVerticalOffset = statusBarHeight;

const expandStyleInterpolator = ({
  closing,
  layouts: { screen },
  progress: { current },
}) => {
  const backgroundOpacity = interpolate(current, {
    extrapolate: 'clamp',
    inputRange: [0, 0.975],
    outputRange: [0, 0.7],
  });

  const translateY = interpolate(current, {
    inputRange: [0, 1],
    outputRange: [screen.height, 0],
  });

  const onStart = or(and(eq(closing, 0), eq(current, 0)), and(eq(closing, 1), eq(current, 1)));
  const setShowingModal = call([], () => {
    store.dispatch(updateTransitionProps({ showingModal: true }));
  });

  return {
    cardStyle: {
      opacity: block([cond(onStart, setShowingModal), 1]),
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
  progress: { current },
  layouts: { screen },
}) => {
  const backgroundOpacity = interpolate(current, {
    extrapolate: 'clamp',
    inputRange: [0, 0.975],
    outputRange: [0, 0.7],
  });

  const translateY = interpolate(current, {
    inputRange: [0, 1],
    outputRange: [screen.height, statusBarHeight],
  });

  return {
    cardStyle: {
      borderTopLeftRadius: sheet.borderRadiusEnd,
      borderTopRightRadius: sheet.borderRadiusEnd,
      overflow: 'hidden',
      // Translation for the animation of the current card
      transform: [{ translateY }],
    },
    containerStyle: {
      backgroundColor: color(37, 41, 46, backgroundOpacity),
    },
  };
};

const backgroundInterpolator = ({ progress: { next } }) => {
  const dispatch = cond(call([], () => {
    store.dispatch(updateTransitionProps({ position: next }));
  }));
  return { cardStyle: { opacity: block([dispatch, 1]) } };
};

const closeSpec = {
  config: SpringUtils.makeConfigFromBouncinessAndSpeed({
    ...SpringUtils.makeDefaultConfig(),
    bounciness: 0,
    overshootClamping: true,
    speed: 20,
  }),
  timing: 'spring',
};

const openSpec = {
  config: SpringUtils.makeConfigFromBouncinessAndSpeed({
    ...SpringUtils.makeDefaultConfig(),
    bounciness: 5,
    speed: 20,
  }),
  timing: 'spring',
};

const gestureResponseDistance = {
  vertical: deviceUtils.dimensions.height,
};

const onTransitionStart = closing => {
  if (closing) {
    StatusBar.setBarStyle('dark-content');
  } else {
    StatusBar.setBarStyle('light-content');
  }
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
  cardStyleInterpolator: sheetStyleInterpolator,
  cardTransparent: true,
  gestureDirection: 'vertical',
  gestureResponseDistance,
  onTransitionStart,
  transitionSpec: { close: closeSpec, open: openSpec },
};

export const backgroundPreset = {
  cardStyleInterpolator: backgroundInterpolator,
};
