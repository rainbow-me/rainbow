import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import usePrevious from './usePrevious';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import {
  gasPricesStartPolling,
  gasPricesStopPolling,
  gasUpdateCustomValues,
  gasUpdateDefaultGasLimit,
  gasUpdateGasPriceOption,
  gasUpdateTxFee,
} from '@rainbow-me/redux/gas';

// EIP1559 WIP
export default function useGas() {
  const dispatch = useDispatch();
  const { network: currentNetwork } = useAccountSettings();

  const gasData = useSelector(
    ({
      gas: {
        eip1559GasPrices,
        gasLimit,
        gasPrices,
        isSufficientGas,
        selectedGasPrice,
        selectedGasPriceOption,
        txFees,
      },
    }) => ({
      eip1559GasPrices,
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
    (network = networkTypes.mainnet) =>
      dispatch(gasPricesStartPolling(network)),
    [dispatch]
  );
  const stopPollingGasPrices = useCallback(
    () => dispatch(gasPricesStopPolling()),
    [dispatch]
  );

  const updateDefaultGasLimit = useCallback(
    (network, defaultGasLimit) =>
      dispatch(gasUpdateDefaultGasLimit(network, defaultGasLimit)),
    [dispatch]
  );

  const updateGasPriceOption = useCallback(
    (option, network = currentNetwork, assetsOverride = null) =>
      dispatch(gasUpdateGasPriceOption(option, network, assetsOverride)),
    [currentNetwork, dispatch]
  );

  const updateTxFee = useCallback(
    (newGasLimit, overrideGasOption, network = currentNetwork) => {
      dispatch(gasUpdateTxFee(network, newGasLimit, overrideGasOption));
    },
    [currentNetwork, dispatch]
  );
  const updateCustomValues = useCallback(
    (price, network = currentNetwork) =>
      dispatch(gasUpdateCustomValues(price, network)),
    [currentNetwork, dispatch]
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
