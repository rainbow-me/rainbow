import {
  compose,
  withHandlers,
  withProps,
} from 'recompact';
import { setDisplayName } from 'recompose';
import {
  withAccountAddress,
  withAccountTransactions,
  withBlurTransitionProps,
  withIsWalletEmpty,
  withRequests,
  withAccountSettings,
} from '../hoc';
import ProfileScreen from './ProfileScreen';

export default compose(
  setDisplayName('ProfileScreen'),
  withAccountAddress,
  withAccountSettings,
  withAccountTransactions,
  withBlurTransitionProps,
  withIsWalletEmpty,
  withRequests,
  withHandlers({
    onPressBackButton: ({ navigation }) => () => navigation.navigate('WalletScreen'),
    onPressSettings: ({ navigation }) => () => navigation.navigate('SettingsModal'),
  }),
  withProps(({ isWalletEmpty, transactionsCount, navigation }) => {
    const topNav = navigation.dangerouslyGetParent()
    return ({
      drawerOpenProgress: topNav.getParam('drawerOpenProgress'),
      isBlurVisible: !topNav.state.isDrawerIdle || topNav.state.isDrawerOpen,
      isEmpty: isWalletEmpty && !transactionsCount,
    });
  }),
)(ProfileScreen);
