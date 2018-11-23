import { connect } from 'react-redux';

const mapStateToProps = ({ account: { accountAddress } }) => ({
  accountAddress: accountAddress.toLowerCase(),
});

export default Component => connect(mapStateToProps)(Component);
