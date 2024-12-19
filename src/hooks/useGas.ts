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
import { fromWei, greaterThan, greaterThanOrEqualTo } from '@/helpers/utilities';
import {
  gasPricesStartPolling,
  gasPricesStopPolling,
  gasUpdateDefaultGasLimit,
  gasUpdateGasFeeOption,
  gasUpdateToCustomGasFee,
  gasUpdateTxFee,
} from '@/redux/gas';
import { ethereumUtils } from '@/utils';
import {
  EXTERNAL_TOKEN_CACHE_TIME,
  EXTERNAL_TOKEN_STALE_TIME,
  externalTokenQueryKey,
  fetchExternalToken,
} from '@/resources/assets/externalAssetsQuery';
import useAccountSettings from './useAccountSettings';
import { ChainId } from '@/state/backendNetworks/types';
import { useQueries } from '@tanstack/react-query';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

const checkSufficientGas = (txFee: LegacyGasFee | GasFee, chainId: ChainId, nativeAsset?: ParsedAddressAsset) => {
  const isLegacyGasNetwork = !(txFee as GasFee)?.maxFee;
  const txFeeValue = isLegacyGasNetwork ? (txFee as LegacyGasFee)?.estimatedFee : (txFee as GasFee)?.maxFee;
  const networkNativeAsset = nativeAsset || ethereumUtils.getNetworkNativeAsset({ chainId });
  const balanceAmount = networkNativeAsset?.balance?.amount || 0;
  const txFeeAmount = fromWei(txFeeValue?.value?.amount);
  const isSufficientGas = greaterThanOrEqualTo(balanceAmount, txFeeAmount);
  return isSufficientGas;
};

const checkValidGas = (selectedGasParams: LegacyGasFeeParams | GasFeeParams) => {
  const isLegacyGasNetwork = !!(selectedGasParams as LegacyGasFeeParams)?.gasPrice;
  const gasValue = isLegacyGasNetwork
    ? (selectedGasParams as LegacyGasFeeParams)?.gasPrice
    : (selectedGasParams as GasFeeParams)?.maxBaseFee;
  const isValidGas = Boolean(gasValue?.amount) && greaterThan(gasValue?.amount, 0.00000000001);
  return isValidGas;
};

const checkGasReady = (txFee: LegacyGasFee | GasFee, selectedGasParams: LegacyGasFeeParams | GasFeeParams) => {
  const isLegacyGasNetwork = !!(selectedGasParams as LegacyGasFeeParams)?.gasPrice;
  const gasValue = isLegacyGasNetwork
    ? (selectedGasParams as LegacyGasFeeParams)?.gasPrice
    : (selectedGasParams as GasFeeParams)?.maxBaseFee;
  const txFeeValue = isLegacyGasNetwork ? (txFee as LegacyGasFee)?.estimatedFee : (txFee as GasFee)?.maxFee;
  return Boolean(gasValue?.amount) && Boolean(txFeeValue?.value?.amount);
};

export default function useGas({ nativeAsset }: { nativeAsset?: ParsedAddressAsset } = {}) {
  const dispatch = useDispatch();
  const { nativeCurrency } = useAccountSettings();

  const chainsNativeAsset = useBackendNetworksStore.getState().getChainsNativeAsset();

  // keep native assets up to date for gas price calculations
  // NOTE: We only fetch the native asset for mainnet and chains that don't use ETH as their native token
  const chainsToFetch = Object.entries(chainsNativeAsset).filter(
    ([chainId, { symbol }]) => +chainId === ChainId.mainnet || symbol.toLowerCase() !== 'eth'
  );
  useQueries({
    queries: chainsToFetch.map(([chainId, { address }]) => ({
      queryKey: externalTokenQueryKey({ address, chainId: parseInt(chainId, 10), currency: nativeCurrency }),
      queryFn: () => fetchExternalToken({ address, chainId: parseInt(chainId, 10), currency: nativeCurrency }),
      staleTime: EXTERNAL_TOKEN_STALE_TIME,
      cacheTime: EXTERNAL_TOKEN_CACHE_TIME,
      enabled: !!address,
    })),
  });

  const gasData: {
    currentBlockParams: CurrentBlockParams;
    customGasFeeModifiedByUser: boolean;
    gasFeeParamsBySpeed: GasFeeParamsBySpeed;
    gasFeesBySpeed: GasFeesBySpeed;
    gasLimit: string;
    selectedGasFee: SelectedGasFee;
    selectedGasFeeOption: string;
    chainId: ChainId;
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
        chainId,
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
      chainId,
    })
  );

  const prevSelectedGasFee = usePrevious(gasData?.selectedGasFee);

  const isSufficientGas = useMemo(
    () => checkSufficientGas(gasData?.selectedGasFee?.gasFee, gasData?.chainId, nativeAsset),
    [gasData?.selectedGasFee?.gasFee, gasData?.chainId, nativeAsset]
  );

  const isValidGas = useMemo(() => checkValidGas(gasData?.selectedGasFee?.gasFeeParams), [gasData?.selectedGasFee]);

  const isGasReady = useMemo(
    () => checkGasReady(gasData?.selectedGasFee?.gasFee, gasData?.selectedGasFee?.gasFeeParams),
    [gasData?.selectedGasFee?.gasFee, gasData?.selectedGasFee?.gasFeeParams]
  );

  const startPollingGasFees = useCallback((chainId = ChainId.mainnet) => dispatch(gasPricesStartPolling(chainId)), [dispatch]);
  const stopPollingGasFees = useCallback(() => dispatch(gasPricesStopPolling()), [dispatch]);

  const updateDefaultGasLimit = useCallback((defaultGasLimit?: number) => dispatch(gasUpdateDefaultGasLimit(defaultGasLimit)), [dispatch]);

  const updateGasFeeOption = useCallback((option: string) => dispatch(gasUpdateGasFeeOption(option)), [dispatch]);

  const updateTxFee = useCallback(
    (newGasLimit: any, overrideGasOption?: any, l1GasFeeOptimism: any = null) => {
      dispatch(gasUpdateTxFee(newGasLimit, overrideGasOption, l1GasFeeOptimism));
    },
    [dispatch]
  );

  const updateToCustomGasFee = useCallback((gasParams: GasFeeParams) => dispatch(gasUpdateToCustomGasFee(gasParams)), [dispatch]);

  const getTotalGasPrice = useCallback(() => {
    const txFee = gasData?.selectedGasFee?.gasFee;
    const isLegacyGasNetwork = !!(txFee as LegacyGasFee)?.estimatedFee;
    const txFeeValue = isLegacyGasNetwork ? (txFee as LegacyGasFee)?.estimatedFee : (txFee as GasFee)?.maxFee;

    const txFeeAmount = fromWei(txFeeValue?.value?.amount);
    return txFeeAmount;
  }, [gasData?.selectedGasFee?.gasFee]);

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
    getTotalGasPrice,
    ...gasData,
  };
}
