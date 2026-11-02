import { useEffect, useMemo } from 'react';

import { type BigNumberish } from '@ethersproject/bignumber';
import { useIsFocused } from '@react-navigation/native';

import useGas from '@/features/gas/hooks/useGas';
import gasUtils from '@/features/gas/utils/gas';
import { ChainId } from '@/features/network/types/backendNetworks';
import { add, addBuffer, addDisplay, fromWei, greaterThanOrEqualTo, multiply } from '@/helpers/utilities';
import { useCleanup } from '@/hooks/useCleanup';
import timeUnits from '@/references/time-units.json';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
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
  const nativeCurrency = userAssetsStoreManager(s => s.currency);
  const { registrationParameters, changedRecords } = useENSRegistration();
  const isFocused = useIsFocused();
  const duration = step === REGISTRATION_STEPS.REGISTER ? registrationParameters?.duration : yearsDuration * timeUnits.secs.year;
  const rentPriceInWei = rentPrice?.wei.toString();
  const { salt, rentPrice: committedRentPrice } = registrationParameters ?? {};
  const gas = useGas({ enableTracking: true });
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
  const gasEstimateStore = useMemo(
    () =>
      createEnsGasEstimateStore(
        {
          name,
          ownerAddress: accountAddress,
          step,
          duration,
          rentPrice: step === REGISTRATION_STEPS.REGISTER ? committedRentPrice : rentPriceInWei,
          salt,
          records: changedRecords,
          setReverseRecord: sendReverseRecord,
        },
        isFocused
      ),
    [name, accountAddress, step, duration, committedRentPrice, rentPriceInWei, salt, changedRecords, sendReverseRecord, isFocused]
  );
  useCleanup(() => gasEstimateStore.getState().reset(), [gasEstimateStore]);
  const estimate = gasEstimateStore(s => s.getData());
  const stepGasLimit = estimate?.stepGasLimit;
  const estimatedGasLimit = estimate?.estimatedGasLimit;

  useEffect(() => {
    if (isFocused) startPollingGasFees();
  }, [isFocused, startPollingGasFees]);
  useEffect(() => {
    if (isFocused && stepGasLimit && stepGasLimit !== gasLimit && Object.keys(gasFeeParamsBySpeed).length) updateTxFee(stepGasLimit, null);
  }, [isFocused, stepGasLimit, gasLimit, gasFeeParamsBySpeed, updateTxFee]);

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
