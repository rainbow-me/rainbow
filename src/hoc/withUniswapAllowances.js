import { connect } from 'react-redux';
import { uniswapGetTokenReserve, uniswapUpdateAllowances } from '../redux/uniswap';

const mapStateToProps = ({ uniswap: { allowances, tokenReserves } }) => ({ allowances, tokenReserves });

export default Component => (
  connect(mapStateToProps, {
    uniswapGetTokenReserve,
    uniswapUpdateAllowances,
  })(Component)
);
