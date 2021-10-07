import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../redux/store';
import usePrevious from './usePrevious';
import { GasFeeParams } from '@rainbow-me/entities';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import {
  gasPricesStartPolling,
  gasPricesStopPolling,
  gasUpdateCustomValues,
  gasUpdateDefaultGasLimit,
  gasUpdateGasFeeOption,
  gasUpdateToCustomGasFee,
  gasUpdateTxFee,
} from '@rainbow-me/redux/gas';

export default function useGas() {
  const dispatch = useDispatch();

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
    defaultGasLimit => dispatch(gasUpdateDefaultGasLimit(defaultGasLimit)),
    [dispatch]
  );

  const updateGasFeeOption = useCallback(
    (option, assetsOverride = null) =>
      dispatch(gasUpdateGasFeeOption(option, assetsOverride)),
    [dispatch]
  );

  const updateTxFee = useCallback(
    (newGasLimit, overrideGasOption) => {
      dispatch(gasUpdateTxFee(newGasLimit, overrideGasOption));
    },
    [dispatch]
  );
  const updateCustomValues = useCallback(
    price => dispatch(gasUpdateCustomValues(price)),
    [dispatch]
  );

  const updateToCustomGasFee = useCallback(
    (gasParams: GasFeeParams) => dispatch(gasUpdateToCustomGasFee(gasParams)),
    [dispatch]
  );

  return {
    prevSelectedGasFee,
    startPollingGasFees,
    stopPollingGasFees,
    updateCustomValues,
    updateDefaultGasLimit,
    updateGasFeeOption,
    updateToCustomGasFee,
    updateTxFee,
    ...gasData,
  };
}
