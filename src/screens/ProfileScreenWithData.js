import { compose, withHandlers, withProps } from 'recompact';
import { setDisplayName } from 'recompose';
import {
  withAccountInfo,
  withAccountSettings,
  withAccountTransactions,
  withIsWalletEmpty,
  withRequests,
} from '../hoc';
import ProfileScreen from './ProfileScreen';

export default compose(
  setDisplayName('ProfileScreen'),
  withAccountInfo,
  withAccountSettings,
  withAccountTransactions,
  withIsWalletEmpty,
  withRequests,
  withHandlers({
    onPressBackButton: ({ navigation }) => () =>
      navigation.navigate('WalletScreen'),
    onPressSettings: ({ navigation }) => () =>
      navigation.navigate('SettingsModal'),
  }),
  withProps(({ isWalletEmpty, transactionsCount, pendingRequestCount }) => ({
    isEmpty: isWalletEmpty && !transactionsCount && !pendingRequestCount,
  }))
)(ProfileScreen);
