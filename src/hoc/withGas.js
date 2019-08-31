import { connect } from 'react-redux';
import { compose } from 'recompact';
import {
  gasUpdateGasPriceOption,
  gasUpdateTxFee,
  resetGasTxFees,
} from '../redux/gas';

const mapStateToProps = ({ gas }) => ({
  gasLimit: gas.gasLimit,
  gasPrices: gas.gasPrices,
  isSufficientGas: gas.isSufficientGas,
  selectedGasPrice: gas.selectedGasPrice,
  selectedGasPriceOption: gas.selectedGasPriceOption,
  txFees: gas.txFees,
});

export default Component => compose(
  connect(mapStateToProps, {
    gasUpdateGasPriceOption,
    gasUpdateTxFee,
    resetGasTxFees,
  }),
)(Component);
