import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import usePrevious from './usePrevious';
import {
  gasPricesStartPolling,
  gasPricesStopPolling,
  gasUpdateCustomValues,
  gasUpdateDefaultGasLimit,
  gasUpdateGasPriceOption,
  gasUpdateTxFee,
} from '@rainbow-me/redux/gas';

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

  const prevSelectedGasPrice = usePrevious(gasData?.selectedGasPrice);

  const startPollingGasPrices = useCallback(
    () => dispatch(gasPricesStartPolling()),
    [dispatch]
  );
  const stopPollingGasPrices = useCallback(
    () => dispatch(gasPricesStopPolling()),
    [dispatch]
  );

  const updateDefaultGasLimit = useCallback(
    defaultGasLimit => dispatch(gasUpdateDefaultGasLimit(defaultGasLimit)),
    [dispatch]
  );

  const updateGasPriceOption = useCallback(
    option => dispatch(gasUpdateGasPriceOption(option)),
    [dispatch]
  );

  const updateTxFee = useCallback(
    (newGasLimit, overrideGasOption) => {
      dispatch(gasUpdateTxFee(newGasLimit, overrideGasOption));
    },
    [dispatch]
  );
  const updateCustomValues = useCallback(
    (price, estimate) => dispatch(gasUpdateCustomValues(price, estimate)),
    [dispatch]
  );

  return {
    prevSelectedGasPrice,
    startPollingGasPrices,
    stopPollingGasPrices,
    updateCustomValues,
    updateDefaultGasLimit,
    updateGasPriceOption,
    updateTxFee,
    ...gasData,
  };
}
