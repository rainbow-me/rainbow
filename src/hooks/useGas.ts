import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../redux/store';
import usePrevious from './usePrevious';
import {
  GasFee,
  GasFeeParams,
  LegacyGasFee,
  LegacyGasFeeParams,
  ParsedAddressAsset,
} from '@rainbow-me/entities';
import { isL2Network } from '@rainbow-me/handlers/web3';
import networkTypes, { Network } from '@rainbow-me/helpers/networkTypes';
import {
  fromWei,
  greaterThan,
  greaterThanOrEqualTo,
} from '@rainbow-me/helpers/utilities';
import {
  gasPricesStartPolling,
  gasPricesStopPolling,
  gasUpdateDefaultGasLimit,
  gasUpdateGasFeeOption,
  gasUpdateToCustomGasFee,
  gasUpdateTxFee,
} from '@rainbow-me/redux/gas';
import { ethereumUtils } from '@rainbow-me/utils';

const checkSufficientGas = (
  txFee: LegacyGasFee | GasFee,
  network: Network,
  nativeAsset?: ParsedAddressAsset
) => {
  const isL2 = isL2Network(network);
  const txFeeValue = isL2
    ? (txFee as LegacyGasFee)?.estimatedFee
    : (txFee as GasFee)?.maxFee;
  const networkNativeAsset =
    nativeAsset || ethereumUtils.getNetworkNativeAsset(network);
  const balanceAmount = networkNativeAsset?.balance?.amount || 0;
  const txFeeAmount = fromWei(txFeeValue?.value?.amount);
  const isSufficientGas = greaterThanOrEqualTo(balanceAmount, txFeeAmount);
  return isSufficientGas;
};

const checkValidGas = (
  selectedGasParams: LegacyGasFeeParams | GasFeeParams,
  network: Network
) => {
  const isL2 = isL2Network(network);
  const gasValue = isL2
    ? (selectedGasParams as LegacyGasFeeParams)?.gasPrice
    : (selectedGasParams as GasFeeParams)?.maxFeePerGas;
  const isValidGas = greaterThan(gasValue?.amount, 0);
  return isValidGas;
};

export default function useGas({ nativeAsset }: { nativeAsset?: any } = {}) {
  const dispatch = useDispatch();

  const gasData = useSelector(
    ({
      gas: {
        currentBlockParams,
        customGasFeeModifiedByUser,
        gasFeeParamsBySpeed,
        gasFeesBySpeed,
        gasLimit,
        selectedGasFee,
        txNetwork,
      },
    }: AppState) => ({
      currentBlockParams,
      customGasFeeModifiedByUser,
      gasFeeParamsBySpeed,
      gasFeesBySpeed,
      gasLimit,
      selectedGasFee,
      selectedGasFeeOption: selectedGasFee.option,
      txNetwork,
    })
  );

  const prevSelectedGasFee = usePrevious(gasData?.selectedGasFee);

  const isSufficientGas = useMemo(
    () =>
      checkSufficientGas(
        gasData?.selectedGasFee?.gasFee,
        gasData?.txNetwork,
        nativeAsset
      ),
    [gasData?.selectedGasFee?.gasFee, gasData?.txNetwork, nativeAsset]
  );

  const isValidGas = useMemo(
    () =>
      checkValidGas(gasData?.selectedGasFee?.gasFeeParams, gasData?.txNetwork),
    [gasData?.selectedGasFee, gasData?.txNetwork]
  );

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
    isSufficientGas,
    isValidGas,
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
