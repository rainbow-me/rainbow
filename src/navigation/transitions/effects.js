import Animated, { Easing } from 'react-native-reanimated';
import { getStatusBarHeight, isIphoneX } from 'react-native-iphone-x-helper';
import chroma from 'chroma-js';
import store from '../../redux/store';
import { updateTransitionProps } from '../../redux/navigation';
import { deviceUtils } from '../../utils';
import { colors } from '../../styles';

const {
  add,
  and,
  block,
  call,
  color,
  cond,
  eq,
  interpolate,
  multiply,
  set,
  SpringUtils,
  sub,
  Value,
} = Animated;

const NO = 0;
const EXPANDED = 1;
const SHEET = 2;

const CURRENT_EFFECT = new Value(EXPANDED);

const statusBarHeight = getStatusBarHeight(true);

const getInterpolated = value => interpolate(
  value,
  { inputRange: [0, 1], outputRange: [0, 1] },
);

const expand = {};
expand.opacityEnd = 0.75;
expand.translateY = deviceUtils.dimensions.height;

const sheet = {};
sheet.borderRadiusEnd = 16;

export const sheetVerticalOffset = statusBarHeight;

const CLOSING = new Value(-1);

const expandStyleInterpolator = ({
  progress: { current },
  layouts: { screen },
}) => {
  const backgroundOpacity = interpolate(current, {
    inputRange: [0, 0.975],
    outputRange: [0, 0.7],
    extrapolate: 'clamp',
  });

  const translateY = interpolate(current, {
    inputRange: [0, 1],
    outputRange: [screen.height, 0],
  });

  return {
    cardStyle: {
      transform: [
        // Translation for the animation of the current card
        { translateY },
      ],
    },
    containerStyle: {
      backgroundColor: color(37, 41, 46, backgroundOpacity),
    },
  };
};

export const sheetStyleInterpolator = ({
  progress: { current },
  layouts: { screen },
}) => {
  const backgroundOpacity = interpolate(current, {
    inputRange: [0, 0.975],
    outputRange: [0, 0.7],
    extrapolate: 'clamp',
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
      transform: [
        // Translation for the animation of the current card
        { translateY },
      ],
    },
    containerStyle: {
      backgroundColor: color(37, 41, 46, backgroundOpacity),
    },
  };
};

const expandedCloseSpec = {
  config: SpringUtils.makeConfigFromBouncinessAndSpeed({
    ...SpringUtils.makeDefaultConfig(),
    bounciness: 0,
    overshootClamping: true,
    speed: 20,
  }),
  timing: 'spring',
};

const expandedOpenSpec = {
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

export const expandedPreset = {
  cardStyleInterpolator: expandStyleInterpolator,
  cardTransparent: true,
  effect: 'expanded',
  gestureDirection: 'vertical',
  gestureResponseDistance,
  transitionSpec: { close: expandedCloseSpec, open: expandedOpenSpec },
};

export const sheetPreset = {
  cardStyleInterpolator: sheetStyleInterpolator,
  cardTransparent: true,
  effect: 'sheet',
  gestureDirection: 'vertical',
  gestureResponseDistance,
  transitionSpec: { close: expandedCloseSpec, open: expandedOpenSpec },
};
