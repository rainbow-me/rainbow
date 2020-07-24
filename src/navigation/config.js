import { Keyboard, Platform, StatusBar } from 'react-native';
import { onDidPop, onWillPop } from './Navigation';
import { appearListener } from './nativeStackHelpers';
import { deviceUtils, safeAreaInsetValues } from '@rainbow-me/utils';

export const expandedAssetSheetConfig = {
  options: ({ route: { params = {} } }) => ({
    allowsDragToDismiss: true,
    allowsTapToDismiss: true,
    backgroundOpacity: 0.7,
    blocksBackgroundTouches: true,
    cornerRadius: params.longFormHeight ? 39 : 30,
    customStack: true,
    gestureEnabled: true,
    headerHeight: 25,
    longFormHeight: params.longFormHeight,
    onAppear: null,
    scrollEnabled: true,
    topOffset: safeAreaInsetValues.top + 5,
  }),
};

export const nativeStackConfig = {
  mode: 'modal',
  screenOptions: {
    contentStyle: {
      backgroundColor: 'transparent',
    },
    onAppear: () => {
      appearListener.current && appearListener.current();
    },
    onDismissed: onDidPop,
    onTouchTop: ({ nativeEvent: { dismissing } }) => {
      if (dismissing) {
        Keyboard.dismiss();
      } else {
        appearListener.current && appearListener.current();
      }
    },
    onWillDismiss: () => {
      onWillPop();
      StatusBar.setBarStyle('dark-content');
    },
    showDragIndicator: false,
    springDamping: 0.8,
    stackPresentation: 'modal',
    transitionDuration: 0.35,
  },
};

export const sharedCoolModalConfig = {
  options: {
    customStack: true,
    ignoreBottomOffset: true,
    onAppear: null,
  },
};

export const stackNavigationConfig = {
  headerMode: 'none',
  keyboardHandlingEnabled: Platform.OS === 'ios',
  mode: 'modal',
};

export const defaultScreenStackOptions = {
  gestureEnabled: true,
};

export const exchangeTabNavigatorConfig = {
  initialLayout: deviceUtils.dimensions,
  sceneContainerStyle: {
    backgroundColor: 'transparent',
  },
  springConfig: {
    damping: 40,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
    stiffness: 300,
  },
  swipeDistanceMinimum: 0,
  swipeVelocityImpact: 1,
  swipeVelocityScale: 1,
  tabBar: () => null,
  transparentCard: true,
};
