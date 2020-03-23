import { compose, withProps } from 'recompact';
import { setDisplayName } from 'recompose';
import {
  withAccountInfo,
  withAccountSettings,
  withAccountTransactions,
  withIsWalletEmpty,
} from '../hoc';
import ProfileScreen from './ProfileScreen';

export default compose(
  setDisplayName('ProfileScreen'),
  withAccountInfo,
  withAccountSettings,
  withAccountTransactions,
  withIsWalletEmpty,
  withProps(({ isWalletEmpty, transactionsCount, pendingRequestCount }) => ({
    isEmpty: isWalletEmpty && !transactionsCount && !pendingRequestCount,
  }))
)(ProfileScreen);
