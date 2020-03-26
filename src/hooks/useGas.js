import { useSelector } from 'react-redux';
import {
  gasPricesStartPolling,
  gasPricesStopPolling,
  gasUpdateDefaultGasLimit,
  gasUpdateGasPriceOption,
  gasUpdateTxFee,
} from '../redux/gas';

export default function useGas() {
  const gasData = useSelector(
    ({
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
    })
  );
  return {
    gasPricesStartPolling,
    gasPricesStopPolling,
    gasUpdateDefaultGasLimit,
    gasUpdateGasPriceOption,
    gasUpdateTxFee,
    ...gasData,
  };
}
