import { connect } from 'react-redux';
import { transactionsAddNewTransaction } from '../redux/transactions';
import { removeTransaction } from '../redux/transactionsToApprove';
import { updateTransactionCountNonce } from '../redux/nonce';
import { walletConnectSendStatus } from '../redux/walletconnect';

const mapStateToProps = ({
  nonce: { transactionCountNonce },
}) => ({
  transactionCountNonce
});

export default Component => connect(mapStateToProps, {
  removeTransaction,
  transactionsAddNewTransaction,
  updateTransactionCountNonce,
  walletConnectSendStatus,
})(Component);
