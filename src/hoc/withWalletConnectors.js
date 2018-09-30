import { connect } from 'react-redux';
import { addWalletConnector } from '../redux/nodes/walletconnect/actions';

export default Component => connect(null, { addWalletConnector })(Component);
