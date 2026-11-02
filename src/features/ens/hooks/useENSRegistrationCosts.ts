import { useEffect, useMemo } from 'react';

import { type BigNumberish } from '@ethersproject/bignumber';
import { getAddress } from 'viem';

import useGas from '@/features/gas/hooks/useGas';
import gasUtils from '@/features/gas/utils/gas';
import { ChainId } from '@/features/network/types/backendNetworks';
import { add, addBuffer, addDisplay, fromWei, greaterThanOrEqualTo, multiply } from '@/helpers/utilities';
import ethUnits from '@/references/ethereum-units.json';
import timeUnits from '@/references/time-units.json';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import ethereumUtils from '@/utils/ethereumUtils';

import { useEnsGasEstimateStore } from '../data/stores/gasEstimateStore';
import { useEnsNameStore } from '../data/useEnsNameStore';
import {
  ENS_DOMAIN,
  formatEstimatedNetworkFee,
  formatRentPrice,
  formatTotalRegistrationCost,
  REGISTRATION_MODES,
  REGISTRATION_STEPS,
} from '../utils/helpers';
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
  const { registrationParameters, mode, changedRecords } = useENSRegistration();
  const duration = yearsDuration * timeUnits.secs.year;
  const label = name.endsWith(ENS_DOMAIN) ? name.slice(0, -ENS_DOMAIN.length) : null;
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
  const hasInput = !!name && !!accountAddress;
  const reverseName = useEnsNameStore(s =>
    hasInput && step === REGISTRATION_STEPS.COMMIT ? s.get(getAddress(accountAddress)) : undefined
  );

  const commitGasLimit = useEnsGasEstimateStore(s =>
    hasInput && label && step === REGISTRATION_STEPS.COMMIT && rentPriceInWei
      ? s.get({ action: 'commit', name: label, duration, ownerAddress: accountAddress, rentPrice: rentPriceInWei })
      : undefined
  );
  const setNameGasLimit = useEnsGasEstimateStore(s =>
    hasInput && (step === REGISTRATION_STEPS.SET_NAME || (step === REGISTRATION_STEPS.COMMIT && reverseName === null))
      ? s.get({ action: 'setName', name, ownerAddress: accountAddress })
      : undefined
  );
  const setRecordsGasLimit = useEnsGasEstimateStore(s =>
    hasInput && (step === REGISTRATION_STEPS.COMMIT || step === REGISTRATION_STEPS.EDIT)
      ? s.get({
          action: 'setRecords',
          name,
          records: changedRecords,
          ownerAddress: mode === REGISTRATION_MODES.EDIT ? accountAddress : undefined,
          setReverseRecord: sendReverseRecord,
        })
      : undefined
  );
  const renewGasLimit = useEnsGasEstimateStore(s =>
    hasInput && label && step === REGISTRATION_STEPS.RENEW && rentPriceInWei
      ? s.get({ action: 'renew', name: label, duration, rentPrice: rentPriceInWei })
      : undefined
  );
  const registerGasLimit = useEnsGasEstimateStore(s =>
    hasInput && label && step === REGISTRATION_STEPS.REGISTER && salt && committedRentPrice
      ? s.get({
          action: 'register',
          name: label,
          duration,
          ownerAddress: accountAddress,
          records: changedRecords,
          rentPrice: committedRentPrice,
          salt,
          setReverseRecord: sendReverseRecord,
        })
      : undefined
  );

  const stepGasLimit = useMemo(() => {
    switch (step) {
      case REGISTRATION_STEPS.COMMIT:
        return commitGasLimit;
      case REGISTRATION_STEPS.RENEW:
        return renewGasLimit;
      case REGISTRATION_STEPS.EDIT:
        return setRecordsGasLimit;
      case REGISTRATION_STEPS.REGISTER:
        return registerGasLimit;
      case REGISTRATION_STEPS.SET_NAME:
        return setNameGasLimit;
      default:
        return undefined;
    }
  }, [step, commitGasLimit, renewGasLimit, setRecordsGasLimit, registerGasLimit, setNameGasLimit]);

  const reverseGasLimit = reverseName === undefined ? undefined : reverseName === null ? setNameGasLimit : '0';
  const estimatedGasLimit =
    step !== REGISTRATION_STEPS.COMMIT
      ? stepGasLimit
      : commitGasLimit != null && setRecordsGasLimit != null && reverseGasLimit != null
        ? add(add(commitGasLimit, setRecordsGasLimit), add(ethUnits.ens_register_with_config, reverseGasLimit))
        : undefined;

  useEffect(() => {
    startPollingGasFees();
  }, [startPollingGasFees, step]);
  useEffect(() => {
    if (stepGasLimit && stepGasLimit !== gasLimit && Object.keys(gasFeeParamsBySpeed).length) updateTxFee(stepGasLimit, null);
  }, [stepGasLimit, gasLimit, gasFeeParamsBySpeed, updateTxFee]);

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
