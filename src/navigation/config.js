import { Platform, StatusBar } from 'react-native';
import { deviceUtils } from '../utils';
import { onDidPop, onWillPop } from './Navigation';
import { appearListener } from './nativeStackHelpers';

export const expandedAssetSheetConfig = {
  options: {
    allowsDragToDismiss: true,
    allowsTapToDismiss: true,
    backgroundOpacity: 0.7,
    blocksBackgroundTouches: true,
    cornerRadius: 24,
    customStack: true,
    gestureEnabled: true,
    headerHeight: 50,
    onAppear: null,
    scrollEnabled: true,
    springDamping: 0.8755,
    topOffset: 0,
    transitionDuration: 0.42,
  },
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

export const exchangeTabNavigatorConfig = position => ({
  initialLayout: deviceUtils.dimensions,
  position,
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
});
