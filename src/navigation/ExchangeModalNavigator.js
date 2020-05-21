import { get } from 'lodash';
import { Value } from 'react-native-reanimated';
import { createMaterialTopTabNavigator } from 'react-navigation-tabs';
import { withBlockedHorizontalSwipe } from '../hoc';
import CurrencySelectModal from '../screens/CurrencySelectModal';
import ModalScreen from '../screens/ModalScreen';
import SwapModal from '../screens/SwapModal';
import { deviceUtils } from '../utils';
import { swapDetailsPreset } from './effects';
import { createStackNavigator } from './helpers';
import Routes from './routesNames';

const ExchangeModalTabPosition = new Value(0);

const ExchangeModalNavigator = createMaterialTopTabNavigator(
  {
    MainExchangeNavigator: {
      screen: createStackNavigator(
        {
          [Routes.MAIN_EXCHANGE_SCREEN]: {
            params: {
              position: ExchangeModalTabPosition,
            },
            screen: SwapModal,
          },
          [Routes.SWAP_DETAILS_SCREEN]: {
            navigationOptions: {
              ...swapDetailsPreset,
            },
            screen: withBlockedHorizontalSwipe(ModalScreen),
          },
        },
        {
          initialRouteName: Routes.MAIN_EXCHANGE_SCREEN,
          transparentCard: true,
        }
      ),
    },
    [Routes.CURRENCY_SELECT_SCREEN]: {
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

ExchangeModalNavigator.navigationOptions = ({ navigation }) => ({
  gestureEnabled: !get(navigation, 'state.params.isGestureBlocked'),
});

export default ExchangeModalNavigator;
