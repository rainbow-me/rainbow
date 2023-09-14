import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../redux/store';
import usePrevious from './usePrevious';
import {
  CurrentBlockParams,
  GasFee,
  GasFeeParams,
  GasFeeParamsBySpeed,
  GasFeesBySpeed,
  LegacyGasFee,
  LegacyGasFeeParams,
  ParsedAddressAsset,
  SelectedGasFee,
} from '@/entities';
import networkTypes, { Network } from '@/helpers/networkTypes';
import {
  fromWei,
  greaterThan,
  greaterThanOrEqualTo,
} from '@/helpers/utilities';
import {
  gasPricesStartPolling,
  gasPricesStopPolling,
  gasUpdateDefaultGasLimit,
  gasUpdateGasFeeOption,
  gasUpdateToCustomGasFee,
  gasUpdateTxFee,
} from '@/redux/gas';
import { ethereumUtils } from '@/utils';
import { getNetworkObj } from '@/networks';

const checkSufficientGas = (
  txFee: LegacyGasFee | GasFee,
  network: Network,
  nativeAsset?: ParsedAddressAsset
) => {
  const isLegacyGasNetwork = getNetworkObj(network).gas.gasType === 'legacy';
  const txFeeValue = isLegacyGasNetwork
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
  const isLegacyGasNetwork = getNetworkObj(network).gas.gasType === 'legacy';
  const gasValue = isLegacyGasNetwork
    ? (selectedGasParams as LegacyGasFeeParams)?.gasPrice
    : (selectedGasParams as GasFeeParams)?.maxBaseFee;
  const isValidGas =
    Boolean(gasValue?.amount) && greaterThan(gasValue?.amount, 0.00000000001);
  return isValidGas;
};

const checkGasReady = (
  txFee: LegacyGasFee | GasFee,
  selectedGasParams: LegacyGasFeeParams | GasFeeParams,
  network: Network
) => {
  const isLegacyGasNetwork = getNetworkObj(network).gas.gasType === 'legacy';
  const gasValue = isLegacyGasNetwork
    ? (selectedGasParams as LegacyGasFeeParams)?.gasPrice
    : (selectedGasParams as GasFeeParams)?.maxBaseFee;
  const txFeeValue = isLegacyGasNetwork
    ? (txFee as LegacyGasFee)?.estimatedFee
    : (txFee as GasFee)?.maxFee;
  return Boolean(gasValue?.amount) && Boolean(txFeeValue?.value?.amount);
};

export default function useGas({
  nativeAsset,
}: { nativeAsset?: ParsedAddressAsset } = {}) {
  const dispatch = useDispatch();

  const gasData: {
    currentBlockParams: CurrentBlockParams;
    customGasFeeModifiedByUser: boolean;
    gasFeeParamsBySpeed: GasFeeParamsBySpeed;
    gasFeesBySpeed: GasFeesBySpeed;
    gasLimit: string;
    selectedGasFee: SelectedGasFee;
    selectedGasFeeOption: string;
    txNetwork: Network;
    l1GasFeeOptimism: string;
  } = useSelector(
    ({
      gas: {
        currentBlockParams,
        customGasFeeModifiedByUser,
        gasFeeParamsBySpeed,
        gasFeesBySpeed,
        gasLimit,
        l1GasFeeOptimism,
        selectedGasFee,
        txNetwork,
      },
    }: AppState) => ({
      currentBlockParams,
      customGasFeeModifiedByUser,
      gasFeeParamsBySpeed,
      gasFeesBySpeed,
      gasLimit,
      l1GasFeeOptimism,
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

  const isGasReady = useMemo(
    () =>
      checkGasReady(
        gasData?.selectedGasFee?.gasFee,
        gasData?.selectedGasFee?.gasFeeParams,
        gasData?.txNetwork
      ),
    [
      gasData?.selectedGasFee?.gasFee,
      gasData?.selectedGasFee?.gasFeeParams,
      gasData?.txNetwork,
    ]
  );

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
    (defaultGasLimit?: number) =>
      dispatch(gasUpdateDefaultGasLimit(defaultGasLimit)),
    [dispatch]
  );

  const updateGasFeeOption = useCallback(
    (option: string) => dispatch(gasUpdateGasFeeOption(option)),
    [dispatch]
  );

  const updateTxFee = useCallback(
    (
      newGasLimit: any,
      overrideGasOption: any,
      l1GasFeeOptimism: any = null
    ) => {
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
    isGasReady,
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
