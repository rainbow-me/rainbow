import { accountUpdateTransactions } from 'balance-common';
import { connect } from 'react-redux';
import { removeTransaction } from '../redux/transactionsToApprove';

const mapStateToProps = ({
  walletconnect: { walletConnectors },
}) => ({
  walletConnectors,
});

export default Component => connect(mapStateToProps, {
  accountUpdateTransactions,
  removeTransaction,
})(Component);
