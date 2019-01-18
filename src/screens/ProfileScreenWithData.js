import {
  compose,
  shouldUpdate,
  withHandlers,
  withProps
} from 'recompact';
import { setDisplayName } from 'recompose';
import {
  withAccountAddress,
  withAccountTransactions,
  withBlurTransitionProps,
  withIsWalletEmpty,
  withRequests,
  withAccountSettings,
  withTrackingScreen,
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
  withTrackingScreen,
  withProps(({ isWalletEmpty, transactionsCount }) => ({
    isEmpty: isWalletEmpty && !transactionsCount,
  })),
)(ProfileScreen);

/*
shouldUpdate((props, { isScreenActive, ...nextProps }) => {
  if (!isScreenActive) return false;

  const newTxCount = props.transactionsCount !== nextProps.transactionsCount;
  const newNativeCurrency = props.nativeCurrency !== nextProps.nativeCurrency;
  return finishedLoading || newTxCount || newNativeCurrency;
}),
*/
