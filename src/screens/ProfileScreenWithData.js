import { compose, withHandlers, withProps, withState } from 'recompact';
import { setDisplayName } from 'recompose';
import {
  withAccountSettings,
  withAccountTransactions,
  withIsWalletEmpty,
  withRequests,
} from '../hoc';
import {
  loadUsersInfo,
  saveWalletDetails,
  loadCurrentUserInfo,
} from '../model/wallet';
import ProfileScreen from './ProfileScreen';

export default compose(
  setDisplayName('ProfileScreen'),
  withAccountSettings,
  withAccountTransactions,
  withIsWalletEmpty,
  withRequests,
  withState('shouldUpdate', 'setShouldUpdate', true),
  withHandlers({
    onPressBackButton: ({ navigation }) => () =>
      navigation.navigate('WalletScreen'),
    onPressProfileHeader: ({ navigation, setShouldUpdate }) => async () => {
      let profiles = await loadUsersInfo();
      if (!profiles || profiles.length === 0) {
        const wallet = await loadCurrentUserInfo();

        const currentWallet = {
          address: wallet.address,
          color: 0,
          name: 'My Wallet',
          privateKey: wallet.privateKey,
          seedPhrase: wallet.seedPhrase,
        };

        await saveWalletDetails(
          currentWallet.name,
          currentWallet.color,
          currentWallet.seedPhrase,
          currentWallet.privateKey,
          currentWallet.address
        );

        profiles = [currentWallet];
      }
      navigation.navigate('ChangeWalletModal', {
        profiles,
        setIsLoading: payload => setShouldUpdate(payload),
      });
    },
    onPressSettings: ({ navigation }) => () =>
      navigation.navigate('SettingsModal'),
  }),
  withProps(({ isWalletEmpty, transactionsCount, pendingRequestCount }) => ({
    isEmpty: isWalletEmpty && !transactionsCount && !pendingRequestCount,
  }))
)(ProfileScreen);
