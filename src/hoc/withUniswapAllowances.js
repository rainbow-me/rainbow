import { connect } from 'react-redux';
import {
  uniswapAddPendingApproval,
  uniswapClearCurrenciesAndReserves,
  uniswapUpdateAllowances,
  uniswapUpdateInputCurrency,
  uniswapUpdateOutputCurrency,
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
      uniswapAddPendingApproval,
      uniswapClearCurrenciesAndReserves,
      uniswapUpdateAllowances,
      uniswapUpdateInputCurrency,
      uniswapUpdateOutputCurrency,
    }
  )(Component);
