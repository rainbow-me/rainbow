import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../redux/store';
import useAccountSettings from './useAccountSettings';
import usePrevious from './usePrevious';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import {
  gasPricesStartPolling,
  gasPricesStopPolling,
  gasUpdateCustomValues,
  gasUpdateDefaultGasLimit,
  gasUpdateGasFeeOption,
  gasUpdateTxFee,
} from '@rainbow-me/redux/gas';

export default function useGas() {
  const dispatch = useDispatch();
  const { network: currentNetwork } = useAccountSettings();

  const gasData = useSelector(
    ({
      gas: {
        gasFeeParamsBySpeed,
        gasFeesBySpeed,
        gasLimit,
        isSufficientGas,
        selectedGasFee,
      },
    }: AppState) => ({
      gasFeeParamsBySpeed,
      gasFeesBySpeed,
      gasLimit,
      isSufficientGas,
      selectedGasFee,
      selectedGasFeeOption: selectedGasFee.option,
    })
  );

  const prevSelectedGasFee = usePrevious(gasData?.selectedGasFee);

  const startPollingGasFees = useCallback(
    (network = networkTypes.mainnet) =>
      dispatch(gasPricesStartPolling(network)),
    [dispatch]
  );
  const stopPollingGasFees = useCallback(
    () => dispatch(gasPricesStopPolling()),
    [dispatch]
  );

  const updateDefaultGasLimit = useCallback(
    (network, defaultGasLimit) =>
      dispatch(gasUpdateDefaultGasLimit(network, defaultGasLimit)),
    [dispatch]
  );

  const updateGasFeeOption = useCallback(
    (option, network = currentNetwork, assetsOverride = null) =>
      dispatch(gasUpdateGasFeeOption(option, network, assetsOverride)),
    [currentNetwork, dispatch]
  );

  const updateTxFee = useCallback(
    (newGasLimit, overrideGasOption, network = currentNetwork) => {
      dispatch(gasUpdateTxFee(network, newGasLimit, overrideGasOption));
    },
    [currentNetwork, dispatch]
  );
  const updateCustomValues = useCallback(
    price => dispatch(gasUpdateCustomValues(price)),
    [dispatch]
  );

  return {
    prevSelectedGasFee,
    startPollingGasFees,
    stopPollingGasFees,
    updateCustomValues,
    updateDefaultGasLimit,
    updateGasFeeOption,
    updateTxFee,
    ...gasData,
  };
}
