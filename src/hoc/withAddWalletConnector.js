import { connect } from 'react-redux';
import { addWalletConnector } from '../redux/walletconnect';

export default Component => connect(null, { addWalletConnector })(Component);
