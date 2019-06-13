import React from 'react';
import {
  createAppContainer,
  createStackNavigator,
} from 'react-navigation';
import { hoistStatics } from 'recompact';
import { createDrawerNavigator } from 'react-navigation-drawer';
import { createMaterialTopTabNavigator } from 'react-navigation-tabs';
import Navigation from '../navigation';
import { buildTransitions, expanded, sheet } from '../navigation/transitions';
import { updateTransitionProps } from '../redux/navigation';
import store from '../redux/store';
import { deviceUtils } from '../utils';
import ExpandedAssetScreen from './ExpandedAssetScreen';
import ImportSeedPhraseSheetWithData from './ImportSeedPhraseSheetWithData';
import ProfileScreenWithData from './ProfileScreenWithData';
import ReceiveModal from './ReceiveModal';
// import ExamplePage from './ExamplePage';
import SendSheetWithData from './SendSheetWithData';
import SettingsModal from './SettingsModal';
import TransactionConfirmationScreenWithData from './TransactionConfirmationScreenWithData';
import WalletScreen from './WalletScreen';
import QRScannerScreenWithData from './QRScannerScreenWithData';

export const tab = React.createRef();
export const tabActiveOffsetX = [-20, 20];

const onTransitionEnd = () => store.dispatch(updateTransitionProps({ isTransitioning: false }));
const onTransitionStart = () => store.dispatch(updateTransitionProps({ isTransitioning: true }));
const swipeToReceive = createDrawerNavigator({
  ProfileScreenWithData: {
    screen: ProfileScreenWithData,
  },
}, {
  contentComponent: hoistStatics(props => (<ReceiveModal {...props} tab={{ tabActiveOffsetX, tabRef: tab }} />)),
  drawerBackgroundColor: 'transparent',
  drawerWidth: deviceUtils.dimensions.width,
  edgeWidth: deviceUtils.dimensions.width,
  gestureHandlerProps: {
    id: 'drawer-view',
    simultaneousHandlers: 'tab-view',
  },
  overlayColor: 'black',
});
const SwipeStack = createMaterialTopTabNavigator({
  ProfileScreen: {
    name: 'ProfileScreen',
    screen: swipeToReceive,
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
  gestureHandlerProps: {
    activeOffsetX: tabActiveOffsetX,
    id: 'tab-view',
    ref: tab,
    simultaneousHandlers: 'drawer-view',
  },
  headerMode: 'none',
  initialRouteName: 'WalletScreen',
  mode: 'modal',
  tabBarComponent: null,
});

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
