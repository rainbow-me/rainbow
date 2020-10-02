import { connect } from '@rainbow-me/react-redux';

const mapStateToProps = ({ appState: { walletReady } }) => ({
  walletReady,
});

export default Component => connect(mapStateToProps)(Component);
