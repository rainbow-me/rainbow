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
import witAreTransactionsFetched from '../hoc/withAreTransactionsFetched';

export default compose(
  setDisplayName('ProfileScreen'),
  withAccountAddress,
  withAccountSettings,
  withAccountTransactions,
  withBlurTransitionProps,
  withIsWalletEmpty,
  witAreTransactionsFetched,
  withRequests,
  withHandlers({
    onPressBackButton: ({ navigation }) => () => navigation.navigate('WalletScreen'),
    onPressSettings: ({ navigation }) => () => navigation.navigate('SettingsModal'),
  }),
  withProps(({ isWalletEmpty, transactionsCount }) => ({
    isEmpty: isWalletEmpty && !transactionsCount,
  })),
)(ProfileScreen);
