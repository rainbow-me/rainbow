import React from 'react';
import { createAppContainer, createStackNavigator } from 'react-navigation';
import { hoistStatics } from 'recompact';
import { createDrawerNavigator } from 'react-navigation-drawer';
import { createMaterialTopTabNavigator } from 'react-navigation-tabs';
import Navigation from '../navigation';
import { buildTransitions, expanded, sheet } from '../navigation/transitions';
import { updateTransitionProps } from '../redux/navigation';
import store from '../redux/store';
import { colors } from '../styles';
import { deviceUtils } from '../utils';
import ExpandedAssetScreenWithData from './ExpandedAssetScreenWithData';
import ImportSeedPhraseSheetWithData from './ImportSeedPhraseSheetWithData';
import ProfileScreenWithData from './ProfileScreenWithData';
import ReceiveModal from './ReceiveModal';
import WalletConnectConfirmationModal from './WalletConnectConfirmationModal';
import SendSheetWithData from './SendSheetWithData';
import SettingsModal from './SettingsModal';
import TransactionConfirmationScreenWithData from './TransactionConfirmationScreenWithData';
import WalletScreen from './WalletScreen';
import QRScannerScreenWithData from './QRScannerScreenWithData';

export const tab = React.createRef();
export const tabActiveOffsetX = [-20, 20];

const onTransitionEnd = () => store.dispatch(updateTransitionProps({ isTransitioning: false }));
const onTransitionStart = () => store.dispatch(updateTransitionProps({ isTransitioning: true }));

const SwipeToReceiveContent = (props) => (
  <ReceiveModal
    {...props}
    tab={{
      tabActiveOffsetX,
      tabRef: tab,
    }}
  />
);

const SwipeToReceiveNavigator = createDrawerNavigator({
  ProfileScreenWithData: {
    screen: ProfileScreenWithData,
  },
}, {
  contentComponent: hoistStatics(SwipeToReceiveContent),
  drawerBackgroundColor: colors.transparent,
  drawerWidth: deviceUtils.dimensions.width,
  edgeWidth: deviceUtils.dimensions.width,
  gestureHandlerProps: {
    id: 'drawer-view',
    simultaneousHandlers: 'tab-view',
  },
  onTransitionEnd,
  onTransitionStart,
  overlayColor: colors.alpha(colors.blueGreyDarker, 0.69),
});

const SwipeStack = createMaterialTopTabNavigator({
  ProfileScreen: {
    name: 'ProfileScreen',
    screen: SwipeToReceiveNavigator,
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
  onTransitionEnd,
  onTransitionStart,
  tabBarComponent: null,
});

const MainNavigator = createStackNavigator({
  ConfirmRequest: TransactionConfirmationScreenWithData,
  ExpandedAssetScreen: {
    navigationOptions: {
      effect: 'expanded',
      gestureResponseDistance: {
        vertical: deviceUtils.dimensions.height,
      },
    },
    screen: ExpandedAssetScreenWithData,
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
  WalletConnectConfirmationModal: {
    navigationOptions: {
      effect: 'expanded',
      gestureResponseDistance: {
        vertical: deviceUtils.dimensions.height,
      },
    },
    screen: WalletConnectConfirmationModal,
  },
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
