import { get } from 'lodash';
import React from 'react';
import Animated from 'react-native-reanimated';
import { createMaterialTopTabNavigator } from 'react-navigation-tabs';
import { withBlockedHorizontalSwipe } from '../hoc';
import CurrencySelectModal from '../screens/CurrencySelectModal';
import ExpandedAssetScreenWithData from '../screens/ExpandedAssetScreenWithData';
import SwapModal from '../screens/SwapModal';
import { deviceUtils } from '../utils';
import createStackNavigator from './createStackNavigator';
import { swapDetailsPreset } from './transitions/effects';

const ExchangeModalTabPosition = new Animated.Value(0);

const ExchangeModalNavigator = createMaterialTopTabNavigator(
  {
    MainExchangeNavigator: {
      screen: createStackNavigator(
        {
          MainExchangeScreen: {
            params: {
              position: ExchangeModalTabPosition,
            },
            screen: SwapModal,
          },
          SwapDetailsScreen: {
            navigationOptions: {
              ...swapDetailsPreset,
            },
            screen: withBlockedHorizontalSwipe(ExpandedAssetScreenWithData),
          },
        },
        {
          initialRouteName: 'MainExchangeScreen',
          transparentCard: true,
        }
      ),
    },
    // eslint-disable-next-line sort-keys
    CurrencySelectScreen: {
      params: {
        position: ExchangeModalTabPosition,
      },
      screen: CurrencySelectModal,
    },
  },
  {
    headerMode: 'none',
    initialLayout: deviceUtils.dimensions,
    mode: 'modal',
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
  }
);

// I need it for changing navigationOptions dynamically
// for preventing swipe down to close on CurrencySelectScreen
// TODO
// eslint-disable-next-line react/display-name
const EnhancedExchangeModalNavigator = React.memo(props => (
  <ExchangeModalNavigator {...props} />
));
EnhancedExchangeModalNavigator.router = ExchangeModalNavigator.router;
EnhancedExchangeModalNavigator.navigationOptions = ({ navigation }) => ({
  ...navigation.state.params,
  gestureEnabled: !get(navigation, 'state.params.isGestureBlocked'),
});

export default EnhancedExchangeModalNavigator;
