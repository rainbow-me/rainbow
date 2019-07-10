import Animated from 'react-native-reanimated';
import { getStatusBarHeight, isIphoneX } from 'react-native-iphone-x-helper';
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
  lessThan,
  greaterThan,
  set,
  sub,
  Value,
} = Animated;

const NO = 0;
const EXPANDED = 1;
const SHEET = 2;

const CURRENT_EFFECT = new Value(NO);

const statusBarHeight = getStatusBarHeight(true);

const getInterpolated = value => interpolate(
  value,
  { inputRange: [0, 1], outputRange: [0, 1] },
);

const expand = {};
expand.opacityEnd = 0.75;
expand.translateY = deviceUtils.dimensions.height;

const sheet = {};
sheet.distanceFromTop = 14;
sheet.borderRadiusEnd = 12;
sheet.scaleEnd = 1 - ((statusBarHeight + (isIphoneX() ? sheet.distanceFromTop : 0)) / deviceUtils.dimensions.height);
sheet.heightEnd = statusBarHeight + sheet.distanceFromTop;
sheet.borderRadiusScaledEnd = sheet.borderRadiusEnd / sheet.scaleEnd;
sheet.opacityEnd = 0.5;

const CLOSING = new Value(-1);

export const expandStyleInterpolator = ({
  progress: { current },
  closing,
}) => {
  const value = getInterpolated(current);
  return {
    containerStyle: {
      transform: [{
        translateY: block([
          call([], () => {
            store.dispatch(updateTransitionProps({
              effect: 'expanded',
              position: current,
            }));
          }),
          set(CURRENT_EFFECT, EXPANDED),
          set(CLOSING, closing),
          cond(
            eq(closing, 1),
            cond(lessThan(value, 0.5), call([], () => {
              store.dispatch(updateTransitionProps({ showingModal: false }));
            })),
            cond(greaterThan(value, 0.5), call([], () => {
              store.dispatch(updateTransitionProps({ showingModal: true }));
            })),
          ),
          multiply(expand.translateY, sub(1, value)),
        ]),
      }],
    },
  };
};

export const sheetStyleInterpolator = ({
  progress: { current },
  closing,
  layouts: { screen: { height } },
}) => {
  store.dispatch(updateTransitionProps({
    effect: 'sheet',
    position: current,
  }));

  const value = getInterpolated(current);

  return {
    cardStyle: {
      borderTopLeftRadius: sheet.borderRadiusEnd,
      borderTopRightRadius: sheet.borderRadiusEnd,
      transform: [{
        translateY: block([
          call([], () => {
            store.dispatch(updateTransitionProps({
              effect: 'sheet',
              position: current,
            }));
          }),
          set(CURRENT_EFFECT, SHEET),
          set(CLOSING, closing),
          add(
            sheet.heightEnd,
            multiply(sub(height, sheet.heightEnd), sub(1, value)),
          ),
        ]),
      }],
    },
  };
};

export const backgroundStyleInterpolator = ({ progress: { next } }) => {
  if (!next) return {};

  const pick = (
    openingSheet,
    closingSheet,
    openingExpanded,
    closingExpanded,
  ) => cond(
    eq(CURRENT_EFFECT, SHEET),
    cond(
      eq(CLOSING, 0),
      openingSheet,
      closingSheet,
    ),
    cond(
      eq(CURRENT_EFFECT, EXPANDED),
      cond(
        eq(CLOSING, 0),
        openingExpanded,
        closingExpanded,
      ),
    ),
  );

  // Expand opening

  const expandOpacity = interpolate(next, {
    inputRange: [0, 1],
    outputRange: [1, expand.opacityEnd],
  });

  // Sheet opening

  const translateY = interpolate(next, {
    inputRange: [0, 1],
    outputRange: [0, sheet.distanceFromTop],
  });

  const sheetOpacity = interpolate(next, {
    inputRange: [0, 1],
    outputRange: [1, sheet.opacityEnd],
  });

  const scale = interpolate(next, {
    inputRange: [0, 1],
    outputRange: [1, sheet.scaleEnd],
  });

  const sheetOpeningBorderRadius = interpolate(next, {
    inputRange: [0, 1],
    outputRange: [isIphoneX() ? 38.5 : 0, sheet.borderRadiusScaledEnd],
  });

  const sheetClosingBorderRadius = interpolate(next, {
    inputRange: [0, 1],
    outputRange: [0, sheet.borderRadiusEnd],
  });

  return {
    cardStyle: {
      borderTopLeftRadius: pick(sheetOpeningBorderRadius, sheetClosingBorderRadius, 0, 0),
      borderTopRightRadius: pick(sheetOpeningBorderRadius, sheetClosingBorderRadius, 0, 0),
      opacity: pick(sheetOpacity, sheetOpacity, expandOpacity, expandOpacity),
      transform: [{
        scale: pick(scale, scale, 1, 1),
      }, {
        translateY: pick(translateY, translateY, 0, 0),
      }],
    },
    containerStyle: {
      backgroundColor: color(0, 0, 0),
    },
  };
};
