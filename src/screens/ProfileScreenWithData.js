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
    return {
      drawerOpenProgress: topNav.getParam('drawerOpenProgress'),
      isBlurVisible: !topNav.state.isDrawerIdle || topNav.state.isDrawerOpen,
      isEmpty: isWalletEmpty && !transactionsCount,
      isLoading: !areTransactionsFetched && !isWalletEmpty,
    };
  }),
)(ProfileScreen);
