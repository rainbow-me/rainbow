import { connect } from 'react-redux';
import {
  uniswapClearCurrenciesAndReserves,
  uniswapUpdateAllowances,
  uniswapUpdateInputCurrency,
  uniswapUpdateOutputCurrency,
} from '../redux/uniswap';

const mapStateToProps = ({
  uniswap: { allowances, inputReserve, outputReserve, tokenReserves },
}) => ({
  allowances,
  inputReserve,
  outputReserve,
  tokenReserves,
});

export default Component =>
  connect(mapStateToProps, {
    uniswapClearCurrenciesAndReserves,
    uniswapUpdateAllowances,
    uniswapUpdateInputCurrency,
    uniswapUpdateOutputCurrency,
  })(Component);
