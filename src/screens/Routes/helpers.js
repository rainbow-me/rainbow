import { Platform } from 'react-native';
import { createStackNavigator as oldCreateStackNavigator } from 'react-navigation-stack';
import {
  exchangePreset,
  expandedPreset,
  expandedPresetReverse,
  sheetPreset,
} from '../../navigation/transitions/effects';
import { updateTransitionProps } from '../../redux/navigation';
import store from '../../redux/store';
import Routes from './routesNames';

export const onTransitionEnd = () =>
  store.dispatch(
    updateTransitionProps({ date: Date.now(), isTransitioning: false })
  );
export const onTransitionStart = () =>
  store.dispatch(
    updateTransitionProps({ date: Date.now(), isTransitioning: true })
  );

function presetWithTransition(preset) {
  return {
    ...preset,
    onTransitionEnd: props => {
      if (preset.onTransitionEnd) {
        preset.onTransitionEnd(props);
      }
      onTransitionEnd();
    },
    onTransitionStart: props => {
      if (preset.onTransitionStart) {
        preset.onTransitionStart(props);
      }
      onTransitionStart();
    },
  };
}

export const sheetPresetWithTransitions = presetWithTransition(sheetPreset);

export const expandedPresetWithTransitions = presetWithTransition(
  expandedPreset
);

export const expandedReversePresetWithTransitions = presetWithTransition(
  expandedPresetReverse
);

export const exchangePresetWithTransitions = presetWithTransition(
  exchangePreset
);

export function createStackNavigator(routes, config = {}) {
  return oldCreateStackNavigator(routes, {
    headerMode: 'none',
    initialRouteName: Routes.SWIPE_LAYOUT,
    keyboardHandlingEnabled: Platform.OS === 'ios',
    mode: 'modal',
    ...config,
    // eslint-disable-next-line sort-keys
    defaultNavigationOptions: {
      gestureEnabled: true,
      onTransitionEnd,
      onTransitionStart,
      ...config.defaultNavigationOptions,
    },
  });
}
