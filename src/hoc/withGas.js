import { connect } from 'react-redux';
import {
  gasPricesStartPolling,
  gasPricesStopPolling,
  gasUpdateDefaultGasLimit,
  gasUpdateGasPriceOption,
  gasUpdateTxFee,
} from '../redux/gas';

const mapStateToProps = ({
  gas: {
    gasLimit,
    gasPrices,
    isSufficientGas,
    selectedGasPrice,
    selectedGasPriceOption,
    txFees,
  },
}) => ({
  gasLimit,
  gasPrices,
  isSufficientGas,
  selectedGasPrice,
  selectedGasPriceOption,
  txFees,
});

export default Component =>
  connect(mapStateToProps, {
    gasPricesStartPolling,
    gasPricesStopPolling,
    gasUpdateDefaultGasLimit,
    gasUpdateGasPriceOption,
    gasUpdateTxFee,
  })(Component);
