import { connect } from 'react-redux';
import { compose, withProps } from 'recompose';

const mapStateToProps = ({ account: { accountAddress } }) => ({ accountAddress });

export default Component => compose(
  connect(mapStateToProps),
  withProps(({ accountAddress }) => ({ accountAddress: accountAddress.toLowerCase() })),
)(Component);
