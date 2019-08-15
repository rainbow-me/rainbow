import { connect } from 'react-redux';
import { compose } from 'recompose';
import { uniswapUpdateAllowances } from '../redux/uniswap';

const mapStateToProps = ({ uniswap: { allowances } }) => ({ allowances });

export default Component => compose(
  connect(mapStateToProps, { uniswapUpdateAllowances }),
)(Component);
