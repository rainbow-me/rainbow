import { connect } from 'react-redux';
import { compose } from 'recompact';
import { uniswapGetTokenReserve, uniswapUpdateAllowances } from '../redux/uniswap';

const mapStateToProps = ({ uniswap: { allowances, tokenReserves } }) => ({ allowances, tokenReserves });

export default Component => compose(
  connect(mapStateToProps, { uniswapGetTokenReserve, uniswapUpdateAllowances }),
)(Component);
