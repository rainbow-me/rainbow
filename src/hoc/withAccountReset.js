import { assetsClearState } from '../redux/data';
import { connect } from 'react-redux';
import { compose } from 'recompact';
import { accountClearState } from '../redux/assets';

export default Component => compose(
  connect(null, { accountClearState, assetsClearState }),
)(Component);
