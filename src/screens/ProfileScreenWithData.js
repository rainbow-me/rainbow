import { compose, withProps } from 'recompact';
import {
  withAccountInfo,
  withAccountSettings,
  withAccountTransactions,
} from '../hoc';
import ProfileScreen from './ProfileScreen';

export default compose(
  withAccountInfo,
  withAccountSettings,
  withAccountTransactions,
  withProps(({ transactionsCount, pendingRequestCount }) => ({
    isEmpty: !transactionsCount && !pendingRequestCount,
  }))
)(ProfileScreen);
