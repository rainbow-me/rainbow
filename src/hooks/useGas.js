import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  gasPricesStartPolling,
  gasPricesStopPolling,
  gasUpdateCustomValues,
  gasUpdateDefaultGasLimit,
  gasUpdateGasPriceOption,
  gasUpdateTxFee,
} from '../redux/gas';

export default function useGas() {
  const dispatch = useDispatch();

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

  const startPollingGasPrices = useCallback(
    () => dispatch(gasPricesStartPolling()),
    [dispatch]
  );
  const stopPollingGasPrices = useCallback(
    () => dispatch(gasPricesStopPolling()),
    [dispatch]
  );

  const updateDefaultGasLimit = useCallback(
    data => dispatch(gasUpdateDefaultGasLimit(data)),
    [dispatch]
  );

  const updateGasPriceOption = useCallback(
    data => dispatch(gasUpdateGasPriceOption(data)),
    [dispatch]
  );

  const updateTxFee = useCallback(
    (data, overrideGasOption) =>
      dispatch(gasUpdateTxFee(data, overrideGasOption)),
    [dispatch]
  );
  const updateCustomValues = useCallback(
    (price, estimate) => dispatch(gasUpdateCustomValues(price, estimate)),
    [dispatch]
  );

  return {
    startPollingGasPrices,
    stopPollingGasPrices,
    updateCustomValues,
    updateDefaultGasLimit,
    updateGasPriceOption,
    updateTxFee,
    ...gasData,
  };
}
