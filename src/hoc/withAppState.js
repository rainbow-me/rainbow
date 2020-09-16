import { connect } from 'react-redux';

const mapStateToProps = ({ appState: { walletReady } }) => ({
  walletReady,
});

export default Component => connect(mapStateToProps)(Component);
