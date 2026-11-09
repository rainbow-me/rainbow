import { useLayoutEffect, useMemo } from 'react';

import { type BigNumberish } from '@ethersproject/bignumber';
import { useListen } from '@storesjs/stores';

import useGas from '@/features/gas/hooks/useGas';
import gasUtils from '@/features/gas/utils/gas';
import { ChainId } from '@/features/network/types/backendNetworks';
import { useAppSettingsStore } from '@/features/settings/data/appSettingsStore';
import { add, addBuffer, addDisplay, fromWei, greaterThanOrEqualTo, multiply } from '@/helpers/utilities';
import { useCleanup } from '@/hooks/useCleanup';
import { useRoute } from '@/navigation/RouteContext';
import timeUnits from '@/references/time-units.json';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import ethereumUtils from '@/utils/ethereumUtils';

import { createEnsGasEstimateStore } from '../data/stores/createEnsGasEstimateStore';
import { formatEstimatedNetworkFee, formatRentPrice, formatTotalRegistrationCost, REGISTRATION_STEPS } from '../utils/helpers';
import { useENSRegistration } from './useENSRegistration';

export function useENSRegistrationCosts({
  name,
  rentPrice,
  sendReverseRecord,
  step,
  yearsDuration,
}: {
  name: string;
  rentPrice?: { wei: BigNumberish; perYear: { wei: string } };
  sendReverseRecord?: boolean;
  step: keyof typeof REGISTRATION_STEPS;
  yearsDuration: number;
}) {
  const accountAddress = useAccountAddress();
  const nativeCurrency = useAppSettingsStore(s => s.currency);
  const { registrationParameters, changedRecords } = useENSRegistration();
  const route = useRoute().name;
  const gas = useGas({ enableTracking: true });

  const duration = step === REGISTRATION_STEPS.REGISTER ? registrationParameters?.duration : yearsDuration * timeUnits.secs.year;
  const rentPriceInWei = rentPrice?.wei.toString();
  const { salt, rentPrice: committedRentPrice } = registrationParameters ?? {};
  const {
    startPollingGasFees,
    updateTxFee,
    gasLimit,
    gasFeeParamsBySpeed,
    selectedGasFeeOption,
    currentBlockParams,
    isValidGas,
    isSufficientGas,
  } = gas;

  const gasEstimateStore = useMemo(() => createEnsGasEstimateStore(route), [route]);

  useCleanup(gasEstimateStore.getState().reset, [gasEstimateStore]);

  useLayoutEffect(() => {
    gasEstimateStore.setState({
      input: {
        name,
        ownerAddress: accountAddress,
        step,
        duration,
        rentPrice: step === REGISTRATION_STEPS.REGISTER ? committedRentPrice : rentPriceInWei,
        salt,
        records: changedRecords,
        setReverseRecord: sendReverseRecord,
      },
    });
  }, [gasEstimateStore, name, accountAddress, step, duration, committedRentPrice, rentPriceInWei, salt, changedRecords, sendReverseRecord]);

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
    s => (s.enabled ? s.getData()?.stepGasLimit : null),
    limit => {
      if (limit) updateTxFee(limit, null);
    },
    { fireImmediately: true }
  );

  const estimate = gasEstimateStore(s => s.getData());
  const stepGasLimit = estimate?.stepGasLimit;
  const estimatedGasLimit = estimate?.estimatedGasLimit;

  return useMemo(() => {
    const nativeAssetPrice = ethereumUtils.getPriceOfNativeAssetForNetwork({ chainId: ChainId.mainnet });
    const baseFee = currentBlockParams?.baseFeePerGas?.gwei;
    const priorityFee = gasFeeParamsBySpeed?.[selectedGasFeeOption || gasUtils.NORMAL]?.maxPriorityFeePerGas?.gwei;

    const estimatedNetworkFee =
      estimatedGasLimit && baseFee && priorityFee
        ? formatEstimatedNetworkFee(estimatedGasLimit, baseFee, priorityFee, nativeCurrency, nativeAssetPrice)
        : undefined;

    const estimatedRentPrice = rentPrice?.perYear.wei
      ? formatRentPrice(multiply(rentPrice.perYear.wei, yearsDuration), yearsDuration, nativeCurrency, nativeAssetPrice)
      : undefined;

    const totalWei =
      estimatedNetworkFee && estimatedRentPrice ? add(estimatedNetworkFee.wei, estimatedRentPrice.wei.toString()) : undefined;

    const estimatedTotalRegistrationCost =
      totalWei && estimatedNetworkFee && estimatedRentPrice
        ? {
            ...formatTotalRegistrationCost(totalWei, nativeCurrency, nativeAssetPrice),
            display: addDisplay(estimatedNetworkFee.display, estimatedRentPrice.total.display),
          }
        : undefined;

    const balance = ethereumUtils.getNetworkNativeAsset({ chainId: ChainId.mainnet })?.balance?.amount ?? 0;

    return {
      estimatedNetworkFee,
      estimatedRentPrice,
      estimatedTotalRegistrationCost,
      isSufficientGasForRegistration: !!totalWei && greaterThanOrEqualTo(balance, fromWei(addBuffer(totalWei, 1.1))),
      isSufficientGasForStep: !!stepGasLimit && stepGasLimit === gasLimit && isValidGas && isSufficientGas,
      isValidGas,
      stepGasLimit,
    };
  }, [
    currentBlockParams,
    gasFeeParamsBySpeed,
    selectedGasFeeOption,
    estimatedGasLimit,
    nativeCurrency,
    rentPrice?.perYear.wei,
    yearsDuration,
    isSufficientGas,
    stepGasLimit,
    gasLimit,
    isValidGas,
  ]);
}
