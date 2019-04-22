import {
  createAppContainer,
  createMaterialTopTabNavigator,
  createStackNavigator,
} from 'react-navigation';
import Navigation from '../navigation';
import { buildTransitions, expanded, sheet } from '../navigation/transitions';
import { updateTransitionProps } from '../redux/navigation';
import store from '../redux/store';
import { deviceUtils } from '../utils';
import ExpandedAssetScreen from './ExpandedAssetScreen';
import ImportSeedPhraseSheetWithData from './ImportSeedPhraseSheetWithData';
import ProfileScreenWithData from './ProfileScreenWithData';
import QRScannerScreenWithData from './QRScannerScreenWithData';
import ReceiveModal from './ReceiveModal';
// import ExamplePage from './ExamplePage';
import SendSheetWithData from './SendSheetWithData';
import SettingsModal from './SettingsModal';
import TransactionConfirmationScreenWithData from './TransactionConfirmationScreenWithData';
import WalletScreen from './WalletScreen';
import ExchangeModal from './ExchangeModal';
import CurrencySelectModal from './CurrencySelectModal';

const onTransitionEnd = () => store.dispatch(updateTransitionProps({ isTransitioning: false }));
const onTransitionStart = () => store.dispatch(updateTransitionProps({ isTransitioning: true }));

const SwipeStack = createMaterialTopTabNavigator({
  ProfileScreen: {
    name: 'ProfileScreen',
    screen: ProfileScreenWithData,
  },
  WalletScreen: {
    name: 'WalletScreen',
    screen: WalletScreen,
  },
  // eslint-disable-next-line sort-keys
  QRScannerScreen: {
    name: 'QRScannerScreen',
    screen: QRScannerScreenWithData,
  },
}, {
  headerMode: 'none',
  initialRouteName: 'WalletScreen',
  mode: 'modal',
  tabBarComponent: null,
});

const ExchangeModalNavigator = createMaterialTopTabNavigator({
  MainExchangeScreen: {
    screen: ExchangeModal,
  },
  // eslint-disable-next-line sort-keys
  CurrencySelectScreen: {
    screen: CurrencySelectModal,
  },
}, {
  headerMode: 'none',
  tabBarComponent: null,
  mode: 'modal',
  transparentCard: true,
})

const MainNavigator = createStackNavigator({
  ConfirmRequest: TransactionConfirmationScreenWithData,
  // ExamplePage: ExamplePage,
  ExpandedAssetScreen: {
    navigationOptions: {
      effect: 'expanded',
      gestureResponseDistance: {
        vertical: deviceUtils.dimensions.height,
      },
    },
    screen: ExpandedAssetScreen,
  },
  ImportSeedPhraseSheet: ImportSeedPhraseSheetWithData,
  ReceiveModal: {
    navigationOptions: {
      effect: 'expanded',
      gestureResponseDistance: {
        vertical: deviceUtils.dimensions.height,
      },
    },
    screen: ReceiveModal,
  },
  SendSheet: SendSheetWithData,
  SettingsModal: {
    navigationOptions: {
      effect: 'expanded',
      gesturesEnabled: false,
    },
    screen: SettingsModal,
    transparentCard: true,

  },
  ExchangeModal2: {
    navigationOptions: {
      effect: 'sheet',
      gestureResponseDistance: {
        vertical: deviceUtils.dimensions.height,
      },
      mode: 'card',
      gesturesEnabled: true,
    },
    mode: 'card',
    screen: ExchangeModal,
  },
  ExchangeModal: {
    navigationOptions: {
      effect: 'expanded',
      gestureResponseDistance: {
        vertical: deviceUtils.dimensions.height,
      },
      gesturesEnabled: true,
    },
    screen: ExchangeModalNavigator,
  },
  SwipeLayout: SwipeStack,
}, {
  headerMode: 'none',
  initialRouteName: 'SwipeLayout',
  mode: 'modal',
  onTransitionEnd,
  onTransitionStart,
  transitionConfig: buildTransitions(Navigation, { expanded, sheet }),
  transparentCard: true,
});

export default createAppContainer(MainNavigator);
