import { connect } from 'react-redux';
import {
  uniswapGetTokenReserve,
  uniswapUpdateAllowances,
  uniswapUpdatePendingApprovals,
} from '../redux/uniswap';

const mapStateToProps = ({
  uniswap: { allowances, pendingApprovals, tokenReserves },
}) => ({
  allowances,
  pendingApprovals,
  tokenReserves,
});

export default Component =>
  connect(
    mapStateToProps,
    {
      uniswapGetTokenReserve,
      uniswapUpdateAllowances,
      uniswapUpdatePendingApprovals,
    }
  )(Component);
