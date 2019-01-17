import { accountClearState } from 'balance-common';
import { connect } from 'react-redux';
import { compose } from 'recompact';

export default Component => compose(
  connect(null, { accountClearState }),
)(Component);
