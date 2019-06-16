import Animated from 'react-native-reanimated';
import {
  compose,
  setDisplayName,
  withHandlers,
  withProps,
} from 'recompact';
import {
  withAccountAddress,
  withAccountSettings,
  withAccountTransactions,
  withAreTransactionsFetched,
  withBlurTransitionProps,
  withIsWalletEmpty,
  withRequests,
} from '../hoc';
import { deviceUtils } from '../utils';
import ProfileScreen from './ProfileScreen';

export default compose(
  setDisplayName('ProfileScreenWithData'),
  withAccountAddress,
  withAccountSettings,
  withAccountTransactions,
  withBlurTransitionProps,
  withIsWalletEmpty,
  withAreTransactionsFetched,
  withRequests,
  withHandlers({
    onPressBackButton: ({ navigation }) => () => navigation.navigate('WalletScreen'),
    onPressSettings: ({ navigation }) => () => navigation.navigate('SettingsModal'),
  }),
  withProps(({
    areTransactionsFetched,
    isWalletEmpty,
    navigation,
    transactionsCount,
  }) => {
    const topNav = navigation.dangerouslyGetParent();
    const { width } = deviceUtils.dimensions;
    const drawerOpenProgress = topNav.getParam('drawerOpenProgress');

    // On opening drawer we firstly move BlurOverlay to screen and then set proper opacity
    // in order not to prevent gesture recognition while if drawer closed
    let blurDrawerOpacity = 0;
    let blurTranslateX = -width;

    if (drawerOpenProgress) {
      blurTranslateX = Animated.interpolate(drawerOpenProgress, {
        inputRange: [0, 0.1, 1],
        outputRange: [-width, 0, 0],
      });

      blurDrawerOpacity = Animated.interpolate(drawerOpenProgress, {
        inputRange: [0, 0.1, 1],
        outputRange: [0, 0, 1],
      });
    }

    return {
      blurDrawerOpacity,
      blurTranslateX,
      isEmpty: isWalletEmpty && !transactionsCount,
      isLoading: !areTransactionsFetched && !isWalletEmpty,
    };
  }),
)(ProfileScreen);
