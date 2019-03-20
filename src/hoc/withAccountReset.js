import { accountClearState } from '@rainbow-me/rainbow-common';
import { connect } from 'react-redux';
import { compose } from 'recompact';

export default Component => compose(
  connect(null, { accountClearState }),
)(Component);
