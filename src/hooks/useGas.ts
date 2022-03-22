import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../redux/store';
import usePrevious from './usePrevious';
import { GasFeeParams } from '@rainbow-me/entities';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import {
  gasPricesStartPolling,
  gasPricesStopPolling,
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
        currentBlockParams,
        customGasFeeModifiedByUser,
        gasFeeParamsBySpeed,
        gasFeesBySpeed,
        gasLimit,
        isSufficientGas,
        isValidGas,
        selectedGasFee,
      },
    }: AppState) => ({
      currentBlockParams,
      customGasFeeModifiedByUser,
      gasFeeParamsBySpeed,
      gasFeesBySpeed,
      gasLimit,
      isSufficientGas,
      isValidGas,
      selectedGasFee,
      selectedGasFeeOption: selectedGasFee.option,
    })
  );

  const prevSelectedGasFee = usePrevious(gasData?.selectedGasFee);

  const startPollingGasFees = useCallback(
    (network = networkTypes.mainnet, flashbots = false) =>
      dispatch(gasPricesStartPolling(network, flashbots)),
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
    option => dispatch(gasUpdateGasFeeOption(option)),
    [dispatch]
  );

  const updateTxFee = useCallback(
    (newGasLimit, overrideGasOption, l1GasFeeOptimism = null) => {
      dispatch(
        gasUpdateTxFee(newGasLimit, overrideGasOption, l1GasFeeOptimism)
      );
    },
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
    updateDefaultGasLimit,
    updateGasFeeOption,
    updateToCustomGasFee,
    updateTxFee,
    ...gasData,
  };
}
