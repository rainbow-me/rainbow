import { removeRequest } from '../redux/requests';
import { connect } from '@rainbow-me/react-redux';

const mapStateToProps = ({ walletconnect: { walletConnectors } }) => ({
  walletConnectors,
});

export default Component =>
  connect(mapStateToProps, { removeRequest })(Component);
