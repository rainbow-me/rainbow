import { useLayoutEffect, useMemo } from 'react';

import { useListen } from '@storesjs/stores';

import { getUniqueId } from '@/entities/assetId';
import { REGISTRATION_STEPS } from '@/features/ens/types/registration';
import useGas from '@/features/gas/hooks/useGas';
import gasUtils from '@/features/gas/utils/gas';
import { ChainId } from '@/features/network/types/backendNetworks';
import { fromWei, greaterThanOrEqualTo, handleSignificantDecimals } from '@/helpers/utilities';
import { useCleanup } from '@/hooks/useCleanup';
import { useRoute } from '@/navigation/RouteContext';
import timeUnits from '@/references/time-units.json';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import ethereumUtils from '@/utils/ethereumUtils';

import { ENS_PAYMENT_TOKEN } from '../data/registration';
import { createEnsGasEstimateStore } from '../data/stores/createEnsGasEstimateStore';
import { formatEstimatedNetworkFee, type formatRentPrice } from '../utils/helpers';
import { useENSRegistration } from './useENSRegistration';

export function useENSRegistrationCosts({
  name,
  rentPrice,
  sendReverseRecord = false,
  step,
  yearsDuration,
}: {
  name: string;
  rentPrice?: ReturnType<typeof formatRentPrice>;
  sendReverseRecord?: boolean;
  step: keyof typeof REGISTRATION_STEPS;
  yearsDuration: number;
}) {
  const account = useAccountAddress();
  const nativeCurrency = userAssetsStoreManager(s => s.currency);
  const usdc = useUserAssetsStore(s => s.getLegacyUserAsset(getUniqueId(ENS_PAYMENT_TOKEN.address, ChainId.mainnet)));
  const { registrationParameters, changedRecords } = useENSRegistration();
  const duration = yearsDuration * timeUnits.secs.year;
  const commitment = registrationParameters?.commitment;
  const gas = useGas({ enableTracking: true });
  const route = useRoute().name;
  const { startPollingGasFees, updateTxFee, gasLimit, gasFeeParamsBySpeed } = gas;
  const hasQuote = !!rentPrice;

  const gasEstimateStore = useMemo(() => createEnsGasEstimateStore(route), [route]);

  useCleanup(gasEstimateStore.getState().reset, [gasEstimateStore]);

  useLayoutEffect(() => {
    gasEstimateStore.setState({
      input:
        name && account && (step !== REGISTRATION_STEPS.COMMIT || hasQuote)
          ? { name, account, step, duration, commitment, records: changedRecords, setReverseRecord: sendReverseRecord }
          : null,
    });
  }, [gasEstimateStore, name, account, step, duration, commitment, changedRecords, sendReverseRecord, hasQuote]);

  useListen(
    useNavigationStore,
    s => s.isRouteActive(route),
    isActive => {
      if (isActive) startPollingGasFees();
    },
    { fireImmediately: true }
  );

  useListen(
    gasEstimateStore,
    s => (s.enabled ? s.getData()?.step : null),
    limit => {
      if (limit) updateTxFee(limit, null);
    },
    { fireImmediately: true }
  );

  const estimate = gasEstimateStore(s => s.getData());
  const stepGasLimit = estimate?.step;

  const nativeAssetPrice = ethereumUtils.getPriceOfNativeAssetForNetwork({ chainId: ChainId.mainnet });
  const baseFee = gas.currentBlockParams?.baseFeePerGas?.gwei;
  const priorityFee = gasFeeParamsBySpeed?.[gas.selectedGasFeeOption || gasUtils.NORMAL]?.maxPriorityFeePerGas?.gwei;
  const estimatedNetworkFee =
    estimate && baseFee && priorityFee
      ? formatEstimatedNetworkFee(estimate.total, baseFee, priorityFee, nativeCurrency, nativeAssetPrice)
      : undefined;
  const paysRegistration = step === REGISTRATION_STEPS.COMMIT || step === REGISTRATION_STEPS.REGISTER || step === REGISTRATION_STEPS.RENEW;
  const sufficientPayment = !paysRegistration
    ? true
    : rentPrice
      ? greaterThanOrEqualTo(usdc?.balance?.amount ?? '0', rentPrice.amount)
      : undefined;
  const nativeBalance = ethereumUtils.getNetworkNativeAsset({ chainId: ChainId.mainnet })?.balance?.amount ?? '0';

  return {
    estimatedNetworkFee,
    isSufficientPayment: sufficientPayment,
    estimatedRentPrice: rentPrice,
    estimatedTotalRegistrationCost:
      estimatedNetworkFee && rentPrice
        ? {
            display: `${rentPrice.amount} ${ENS_PAYMENT_TOKEN.symbol} + ${handleSignificantDecimals(fromWei(estimatedNetworkFee.wei), 4)} ETH`,
          }
        : undefined,
    isSufficientGasForRegistration:
      sufficientPayment && !!estimatedNetworkFee && greaterThanOrEqualTo(nativeBalance, fromWei(estimatedNetworkFee.wei)),
    isSufficientGasForStep: sufficientPayment && !!stepGasLimit && stepGasLimit === gasLimit && gas.isValidGas && gas.isSufficientGas,
    isValidGas: gas.isValidGas,
    stepGasLimit,
  };
}
