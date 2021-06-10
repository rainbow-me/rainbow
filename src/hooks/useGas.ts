import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import usePrevious from './usePrevious';
import { Asset, GasSpeedOption } from '@rainbow-me/entities';
import { Network } from '@rainbow-me/helpers/networkTypes';
import {
  gasPricesStartPolling,
  gasPricesStopPolling,
  gasUpdateCustomValues,
  gasUpdateDefaultGasLimit,
  gasUpdateGasSpeedOption,
  gasUpdateTxFee,
} from '@rainbow-me/redux/gas';
import { AppState } from '@rainbow-me/redux/store';

export default function useGas() {
  const dispatch = useDispatch();
  const { network: currentNetwork } = useAccountSettings();

  const gasData = useSelector(
    ({
      gas: {
        gasLimit,
        gasPrices,
        gasSpeedOption,
        isSufficientGas,
        selectedGasPrice,
        txFees,
      },
    }: AppState) => ({
      gasLimit,
      gasPrices,
      gasSpeedOption,
      isSufficientGas,
      selectedGasPrice,
      txFees,
    })
  );

  const prevSelectedGasPrice = usePrevious(gasData?.selectedGasPrice);

  const startPollingGasPrices = useCallback(
    (network: Network = Network.mainnet) =>
      dispatch(gasPricesStartPolling(network)),
    [dispatch]
  );
  const stopPollingGasPrices = useCallback(
    () => dispatch(gasPricesStopPolling()),
    [dispatch]
  );

  const updateDefaultGasLimit = useCallback(
    (network: Network, defaultGasLimit: number) =>
      dispatch(gasUpdateDefaultGasLimit(network, defaultGasLimit)),
    [dispatch]
  );

  const updateGasSpeedOption = useCallback(
    (option: GasSpeedOption, network: Network = currentNetwork, assetsOverride?: Asset[]) =>
      dispatch(gasUpdateGasSpeedOption(option, network, assetsOverride)),
    [currentNetwork, dispatch]
  );

  const updateTxFee = useCallback(
    (newGasLimit: string | number | null, network: Network = currentNetwork, overrideGasOption?: GasSpeedOption) => {
      dispatch(gasUpdateTxFee(network, newGasLimit, overrideGasOption));
    },
    [currentNetwork, dispatch]
  );

  const updateCustomValues = useCallback(
    (price: string, network: Network = currentNetwork) =>
      dispatch(gasUpdateCustomValues(price, network)),
    [currentNetwork, dispatch]
  );

  return {
    prevSelectedGasPrice,
    startPollingGasPrices,
    stopPollingGasPrices,
    updateCustomValues,
    updateDefaultGasLimit,
    updateGasSpeedOption,
    updateTxFee,
    ...gasData,
  };
}
