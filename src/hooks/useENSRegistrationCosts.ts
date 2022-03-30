import { useCallback, useMemo } from 'react';
import { useQuery } from 'react-query';
import { useAccountSettings } from '.';
import { Records } from '@rainbow-me/entities';
import {
  estimateENSRegistrationGasLimit,
  estimateENSRenewGasLimit,
  fetchReverseRecord,
} from '@rainbow-me/handlers/ens';
import { NetworkTypes } from '@rainbow-me/helpers';
import {
  formatEstimatedNetworkFee,
  formatRentPrice,
  formatTotalRegistrationCost,
  REGISTRATION_STEPS,
} from '@rainbow-me/helpers/ens';
import { Network } from '@rainbow-me/helpers/networkTypes';
import {
  add,
  addBuffer,
  addDisplay,
  fromWei,
  greaterThanOrEqualTo,
  multiply,
} from '@rainbow-me/helpers/utilities';
import { getEIP1559GasParams } from '@rainbow-me/redux/gas';
import { ethUnits, timeUnits } from '@rainbow-me/references';
import { ethereumUtils } from '@rainbow-me/utils';

export default function useENSRegistrationCosts({
  yearsDuration,
  name,
  rentPrice,
  sendReverseRecord,
  records,
  step,
}: {
  yearsDuration: number;
  name: string;
  step: keyof typeof REGISTRATION_STEPS;
  sendReverseRecord: boolean;
  rentPrice?: { wei: number; perYear: { wei: number } };
  records?: Records;
}) {
  const { nativeCurrency, accountAddress } = useAccountSettings();
  const duration = yearsDuration * timeUnits.secs.year;

  const checkIfSufficientEth = useCallback((wei: string) => {
    const nativeAsset = ethereumUtils.getNetworkNativeAsset(
      NetworkTypes.mainnet
    );
    const balanceAmount = nativeAsset?.balance?.amount || 0;
    const txFeeAmount = fromWei(wei);
    const isSufficientGas = greaterThanOrEqualTo(balanceAmount, txFeeAmount);
    return isSufficientGas;
  }, []);

  const rentPriceInWei = rentPrice?.wei?.toString();

  const estimateTotalRegistrationGasLimit = useCallback(
    async (rentPriceInWei: string) => {
      const reverseRecord =
        sendReverseRecord && (await fetchReverseRecord(accountAddress));

      const {
        commitGasLimit,
        multicallGasLimit,
        registerWithConfigGasLimit,
        setNameGasLimit,
      } = await estimateENSRegistrationGasLimit(
        name,
        accountAddress,
        duration,
        rentPriceInWei,
        records
      );

      const totalRegistrationGasLimit =
        [
          commitGasLimit,
          multicallGasLimit,
          registerWithConfigGasLimit,
          !reverseRecord && setNameGasLimit,
        ].reduce((a, b) => add(a || 0, b || 0)) ||
        `${ethUnits.ens_registration}`;
      return totalRegistrationGasLimit;
    },
    [accountAddress, duration, name, records, sendReverseRecord]
  );

  const estimateRenewRegistrationGasLimit = useCallback(
    async (rentPriceInWei: string) => {
      const gasLimit =
        (await estimateENSRenewGasLimit({
          duration,
          name,
          rentPrice: rentPriceInWei,
        })) || '';

      return gasLimit;
    },
    [duration, name]
  );

  const estimateGasLimit = useMemo(
    () => ({
      [REGISTRATION_STEPS.COMMIT]: estimateTotalRegistrationGasLimit,
      [REGISTRATION_STEPS.RENEW]: estimateRenewRegistrationGasLimit,
      [REGISTRATION_STEPS.EDIT]: null,
      [REGISTRATION_STEPS.REGISTER]: null,
      [REGISTRATION_STEPS.SET_NAME]: null,
      [REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION]: null,
      [REGISTRATION_STEPS.WAIT_ENS_COMMITMENT]: null,
    }),
    [estimateRenewRegistrationGasLimit, estimateTotalRegistrationGasLimit]
  );

  const getEstimatedNetworkFee = useCallback(async () => {
    if (!rentPriceInWei) return;

    const nativeAssetPrice = ethereumUtils.getPriceOfNativeAssetForNetwork(
      Network.mainnet
    );

    const { gasFeeParamsBySpeed, currentBaseFee } = await getEIP1559GasParams();

    const estimatedGasLimit =
      (await estimateGasLimit?.[step]?.(rentPriceInWei)) || '';

    const formattedEstimatedNetworkFee = formatEstimatedNetworkFee(
      estimatedGasLimit,
      currentBaseFee.gwei,
      gasFeeParamsBySpeed.normal.maxPriorityFeePerGas.gwei,
      nativeCurrency,
      nativeAssetPrice
    );

    return {
      estimatedGasLimit,
      estimatedNetworkFee: formattedEstimatedNetworkFee,
    };
  }, [rentPriceInWei, estimateGasLimit, step, nativeCurrency]);

  const { data: estimatedFee, status, isIdle, isLoading } = useQuery(
    [
      'getEstimatedNetworkFee',
      [accountAddress, name, nativeCurrency, rentPriceInWei],
    ],
    getEstimatedNetworkFee,
    { cacheTime: 0, enabled: Boolean(rentPriceInWei) }
  );

  const data = useMemo(() => {
    const rentPricePerYearInWei = rentPrice?.perYear?.wei?.toString();
    const nativeAssetPrice = ethereumUtils.getPriceOfNativeAssetForNetwork(
      Network.mainnet
    );

    if (rentPricePerYearInWei) {
      const rentPriceInWei = multiply(rentPricePerYearInWei, duration);
      const estimatedRentPrice = formatRentPrice(
        rentPriceInWei,
        duration,
        nativeCurrency,
        nativeAssetPrice
      );

      if (estimatedFee) {
        const weiEstimatedTotalCost = add(
          estimatedFee.estimatedNetworkFee.wei,
          estimatedRentPrice.wei.toString()
        );
        const displayEstimatedTotalCost = addDisplay(
          estimatedFee.estimatedNetworkFee.display,
          estimatedRentPrice.total.display
        );
        const estimatedTotalRegistrationCost = formatTotalRegistrationCost(
          weiEstimatedTotalCost,
          nativeCurrency,
          nativeAssetPrice
        );

        const isSufficientGasForRegistration = checkIfSufficientEth(
          addBuffer(
            add(
              estimatedFee?.estimatedNetworkFee?.wei,
              estimatedRentPrice?.wei?.toString()
            ),
            1.1
          )
        );

        return {
          estimatedGasLimit: estimatedFee.estimatedGasLimit,
          estimatedNetworkFee: estimatedFee.estimatedNetworkFee,
          estimatedRentPrice,
          estimatedTotalRegistrationCost: {
            ...estimatedTotalRegistrationCost,
            display: displayEstimatedTotalCost,
          },
          isSufficientGasForRegistration,
        };
      }

      return { estimatedRentPrice };
    }
  }, [
    checkIfSufficientEth,
    duration,
    estimatedFee,
    nativeCurrency,
    rentPrice?.perYear?.wei,
  ]);

  const isSuccess = status === 'success' && !!data?.estimatedRentPrice;

  return {
    data,
    isIdle,
    isLoading,
    isSuccess,
  };
}
