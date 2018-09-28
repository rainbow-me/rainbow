import { accountUpdateHasPendingTransaction, accountUpdateTransactions } from 'balance-common';
import { connect } from 'react-redux';
import { removeTransaction } from '../reducers/transactionsToApprove';

const mapStateToProps = ({ walletconnect: { walletConnectors } }) => ({
  walletConnectors,
});

export default Component => connect(mapStateToProps, {
  accountUpdateHasPendingTransaction,
  accountUpdateTransactions,
  removeTransaction,
})(Component);
