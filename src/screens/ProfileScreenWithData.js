import { compose, withHandlers, withProps } from 'recompact';
import { setDisplayName } from 'recompose';
import {
  withAccountSettings,
  withAccountTransactions,
  withIsWalletEmpty,
  withRequests,
} from '../hoc';
import ProfileScreen from './ProfileScreen';

export default compose(
  setDisplayName('ProfileScreen'),
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
  withProps(({ isWalletEmpty, transactionsCount }) => ({
    isEmpty: isWalletEmpty && !transactionsCount,
  }))
)(ProfileScreen);
