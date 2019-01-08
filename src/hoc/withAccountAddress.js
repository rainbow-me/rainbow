import { connect } from 'react-redux';
import { compose, withProps } from 'recompose';
import { settingsUpdateAccountAddress } from 'balance-common';

const mapStateToProps = ({ settings: { accountAddress } }) => ({ accountAddress });

export default Component => compose(
  connect(mapStateToProps, { settingsUpdateAccountAddress }),
  withProps(({ accountAddress }) => ({ accountAddress: accountAddress.toLowerCase() })),
)(Component);
