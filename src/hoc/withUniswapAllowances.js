import { connect } from 'react-redux';
import {
  uniswapClearCurrenciesAndReserves,
  uniswapUpdateAllowances,
  uniswapUpdateInputCurrency,
  uniswapUpdateOutputCurrency,
  uniswapUpdatePendingApprovals,
} from '../redux/uniswap';

const mapStateToProps = ({
  uniswap: {
    allowances,
    inputReserve,
    outputReserve,
    pendingApprovals,
    tokenReserves,
  },
}) => ({
  allowances,
  inputReserve,
  outputReserve,
  pendingApprovals,
  tokenReserves,
});

export default Component =>
  connect(
    mapStateToProps,
    {
      uniswapClearCurrenciesAndReserves,
      uniswapUpdateAllowances,
      uniswapUpdateInputCurrency,
      uniswapUpdateOutputCurrency,
      uniswapUpdatePendingApprovals,
    }
  )(Component);
