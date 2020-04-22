import { get } from 'lodash';
import React from 'react';
import { Value } from 'react-native-reanimated';
import { createMaterialTopTabNavigator } from 'react-navigation-tabs';
import CurrencySelectModal from '../screens/CurrencySelectModal';
import DepositModal from '../screens/DepositModal';
import { deviceUtils } from '../utils';

const ExchangeModalTabPosition = new Value(0);

const SavingModalNavigator = createMaterialTopTabNavigator(
  {
    MainExchangeScreen: {
      params: {
        position: ExchangeModalTabPosition,
      },
      screen: DepositModal,
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
const EnhancedSavingModalNavigator = React.memo(props => (
  <SavingModalNavigator {...props} />
));
EnhancedSavingModalNavigator.router = SavingModalNavigator.router;
EnhancedSavingModalNavigator.navigationOptions = ({ navigation }) => ({
  ...navigation.state.params,
  gestureEnabled: !get(navigation, 'state.params.isGestureBlocked'),
});

export default EnhancedSavingModalNavigator;
