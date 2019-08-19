import { get } from 'lodash';
import React from 'react';
import Animated from 'react-native-reanimated';
import { createMaterialTopTabNavigator } from 'react-navigation-tabs';
import { updateTabsTransitionProps } from '../redux/navigation';
import store from '../redux/store';
import CurrencySelectModal from '../screens/CurrencySelectModal';
import ExchangeModal from '../screens/ExchangeModal';
import { colors } from '../styles';
import { deviceUtils } from '../utils';

const onTransitionEnd = () => store.dispatch(updateTabsTransitionProps({ isTransitioning: false }));
const onTransitionStart = () => store.dispatch(updateTabsTransitionProps({ isTransitioning: true }));

const ExchangeModalTabPosition = new Animated.Value(0);

const ExchangeModalNavigator = createMaterialTopTabNavigator({
  MainExchangeScreen: {
    params: {
      position: ExchangeModalTabPosition,
    },
    screen: ExchangeModal,
  },
  CurrencySelectScreen: {
    params: {
      position: ExchangeModalTabPosition,
    },
    screen: CurrencySelectModal,
  },
}, {
  disableKeyboardHandling: true,
  headerMode: 'none',
  initialLayout: deviceUtils.dimensions,
  keyboardDismissMode: 'none',
  keyboardShouldPersistTaps: 'always',
  mode: 'modal',
  onTransitionEnd,
  onTransitionStart,
  position: ExchangeModalTabPosition,
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
  tabBarComponent: null,
  transparentCard: true,
});

// I need it for changing navigationOptions dynamically
// for preventing swipe down to close on CurrencySelectScreen
const EnhancedExchangeModalNavigator = props => <ExchangeModalNavigator {...props} />;//React.memo();

EnhancedExchangeModalNavigator.router = ExchangeModalNavigator.router;
EnhancedExchangeModalNavigator.navigationOptions = ({ navigation }) => ({
  ...navigation.state.params,
  gesturesEnabled: !get(navigation, 'state.params.isGestureBlocked'),
});

export default EnhancedExchangeModalNavigator;
