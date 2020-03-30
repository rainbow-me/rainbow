import { connect } from 'react-redux';
import {
  uniswapClearCurrenciesAndReserves,
  uniswapUpdateAllowances,
  uniswapUpdateInputCurrency,
  uniswapUpdateOutputCurrency,
} from '../redux/uniswap';

const mapStateToProps = ({
  uniswap: { allowances, inputReserve, outputReserve },
}) => ({
  allowances,
  inputReserve,
  outputReserve,
});

export default Component =>
  connect(mapStateToProps, {
    uniswapClearCurrenciesAndReserves,
    uniswapUpdateAllowances,
    uniswapUpdateInputCurrency,
    uniswapUpdateOutputCurrency,
  })(Component);
