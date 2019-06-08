import { accountClearState } from '@rainbow-me/rainbow-common';
import { assetsClearState } from '../redux/data';
import { connect } from 'react-redux';
import { compose } from 'recompact';

export default Component => compose(
  connect(null, { accountClearState, assetsClearState }),
)(Component);
