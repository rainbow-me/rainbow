import { compose, shouldUpdate, withHandlers } from 'recompact';
import {
  withAccountAddress,
  withAccountTransactions,
  withBlurTransitionProps,
  withRequests,
} from '../hoc';
import ProfileScreen from './ProfileScreen';

export default compose(
  withAccountAddress,
  withAccountTransactions,
  withBlurTransitionProps,
  withRequests,
  withHandlers({
    onPressBackButton: ({ navigation }) => () => navigation.navigate('WalletScreen'),
    onPressSettings: ({ navigation }) => () => navigation.navigate('SettingsModal'),
  }),
  shouldUpdate((props, { isScreenActive, ...nextProps }) => {
    if (!isScreenActive) return false;

    const finishedLoading = props.fetchingTransactions && !nextProps.fetchingTransactions;
    const newTxCount = props.transactionsCount !== nextProps.transactionsCount;
    const newNativeCurrency = props.nativeCurrency !== nextProps.nativeCurrency;
    const update = finishedLoading || newTxCount || newNativeCurrency;
    console.log('UPDATE PROFILE', update);
    return update;
  }),
)(ProfileScreen);
