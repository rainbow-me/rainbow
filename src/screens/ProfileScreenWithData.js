import {
  compose,
  withHandlers,
  withProps,
} from 'recompact';
import { setDisplayName } from 'recompose';
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
  setDisplayName('ProfileScreen'),
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
    const blurTranslateX = drawerOpenProgress ? drawerOpenProgress.interpolate({
      inputRange: [0, 0.1, 1],
      outputRange: [-width, 0, 0],
    }) : -width;

    const blurDrawerOpacity = drawerOpenProgress ? drawerOpenProgress.interpolate({
      inputRange: [0, 0.1, 1],
      outputRange: [0, 0, 1],
    }) : 0;

    return {
      blurDrawerOpacity,
      blurTranslateX,
      isEmpty: isWalletEmpty && !transactionsCount,
      isLoading: !areTransactionsFetched && !isWalletEmpty,
    };
  }),
)(ProfileScreen);
