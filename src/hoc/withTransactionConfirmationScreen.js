import { connect } from 'react-redux';
import { dataAddNewTransaction } from '../redux/data';
import { removeTransaction } from '../redux/transactionsToApprove';
import { updateTransactionCountNonce } from '../redux/nonce';
import { walletConnectSendStatus } from '../redux/walletconnect';

const mapStateToProps = ({
  nonce: { transactionCountNonce },
}) => ({
  transactionCountNonce
});

export default Component => connect(mapStateToProps, {
  dataAddNewTransaction,
  removeTransaction,
  updateTransactionCountNonce,
  walletConnectSendStatus,
})(Component);
