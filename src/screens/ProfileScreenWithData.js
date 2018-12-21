import { compose, shouldUpdate, withHandlers } from 'recompact';
import { setDisplayName } from 'recompose';
import {
  withAccountAddress,
  withAccountTransactions,
  withBlurTransitionProps,
  withRequests,
  withTrackingScreen,
} from '../hoc';
import ProfileScreen from './ProfileScreen';

export default compose(
  setDisplayName('ProfileScreen'),
  withAccountAddress,
  withAccountTransactions,
  withBlurTransitionProps,
  withRequests,
  withHandlers({
    onPressBackButton: ({ navigation }) => () => navigation.navigate('WalletScreen'),
    onPressSettings: ({ navigation }) => () => navigation.navigate('SettingsModal'),
  }),
  withTrackingScreen,
  /*
  shouldUpdate((props, { isScreenActive, ...nextProps }) => {
    if (!isScreenActive) return false;

    const finishedLoading = props.fetchingTransactions && !nextProps.fetchingTransactions;
    const newTxCount = props.transactionsCount !== nextProps.transactionsCount;
    const newNativeCurrency = props.nativeCurrency !== nextProps.nativeCurrency;
    return finishedLoading || newTxCount || newNativeCurrency;
  }),
  */
)(ProfileScreen);
