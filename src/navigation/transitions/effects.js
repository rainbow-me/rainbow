import Animated from 'react-native-reanimated';
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
  if (!current || !closing) return {};

  const value = getInterpolated(current);

  const onOpen = and(eq(closing, 0), eq(current, 0));
  const onClose = and(eq(closing, 1), eq(current, 1));

  return {
    containerStyle: {
      transform: [{
        translateY: block([
          cond(onOpen, call([], () => {
            store.dispatch(updateTransitionProps({
              effect: 'expanded',
              position: current,
            }));
            store.dispatch(updateTransitionProps({ showingModal: true }));
          })),
          cond(onClose, call([], () => {
            console.log('dupa');
            store.dispatch(updateTransitionProps({ showingModal: false }));
          })),
          set(CURRENT_EFFECT, EXPANDED),
          set(CLOSING, closing),
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
  if (!current || !closing || !height) return {};

  const value = getInterpolated(current);

  const onOpen = and(eq(closing, 0), eq(current, 0));
  const onClose = and(eq(closing, 1), eq(current, 1));

  return {
    cardStyle: {
      borderTopLeftRadius: sheet.borderRadiusEnd,
      borderTopRightRadius: sheet.borderRadiusEnd,
      overflow: 'hidden',
      transform: [{
        translateY: block([
          cond(onOpen, call([], () => {
            store.dispatch(updateTransitionProps({
              effect: 'sheet',
              position: current,
            }));
            store.dispatch(updateTransitionProps({ showingModal: true }));
          })),
          cond(onClose, call([], () => {
            console.log('dupa');
            store.dispatch(updateTransitionProps({ showingModal: false }));
          })),
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

export const backgroundStyleInterpolator = ({ progress: { current, next } }) => {
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

  const expandOpacity = interpolate(next, {
    inputRange: [0, 1],
    outputRange: [1, expand.opacityEnd],
  });

  const sheetOpacity = interpolate(next, {
    inputRange: [0, 1],
    outputRange: [1, sheet.opacityEnd],
  });

  return {
    cardStyle: {
      opacity: pick(sheetOpacity, sheetOpacity, expandOpacity, expandOpacity),
    },
    containerStyle: {
      backgroundColor: color(0, 0, 0),
    },
  };
};
