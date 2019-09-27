import { connect } from 'react-redux';
import {
  gasUpdateGasPriceOption,
  gasUpdateTxFee,
  resetGasTxFees,
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

export default Component => (
  connect(mapStateToProps, {
    gasUpdateGasPriceOption,
    gasUpdateTxFee,
    resetGasTxFees,
  })(Component)
);
