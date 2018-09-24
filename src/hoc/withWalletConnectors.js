import { addWalletConnector } from '../reducers/walletconnect';
import { connect } from 'react-redux';

export default Component => connect(null, { addWalletConnector })(Component);
