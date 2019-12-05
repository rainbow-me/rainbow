import { connect } from 'react-redux';
import { dataAddNewTransaction } from '../redux/data';
import { removeRequest } from '../redux/requests';
import { updateTransactionCountNonce } from '../redux/nonce';
import { walletConnectSendStatus } from '../redux/walletconnect';

const mapStateToProps = ({ send: { gasPrices }, nonce: { transactionCountNonce } }) => ({ gasPrices, transactionCountNonce });

export default Component => connect(mapStateToProps, {
  dataAddNewTransaction,
  removeRequest,
  updateTransactionCountNonce,
  walletConnectSendStatus,
})(Component);
