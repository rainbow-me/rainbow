import { useCallback, useMemo } from 'react';
import { useQuery } from 'react-query';
import { useAccountSettings } from '.';
import {
  estimateENSRegistrationGasLimit,
  fetchReverseRecord,
} from '@rainbow-me/handlers/ens';
import { NetworkTypes } from '@rainbow-me/helpers';
import {
  formatEstimatedNetworkFee,
  formatRentPrice,
  formatTotalRegistrationCost,
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
  duration,
  name,
  rentPrice,
  sendReverseRecord,
}: {
  duration: number;
  name: string;
  sendReverseRecord: boolean;
  rentPrice?: { wei: number; perYear: { wei: number } };
}) {
  const { nativeCurrency, accountAddress } = useAccountSettings();

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

  const getEstimatedNetworkFee = useCallback(async () => {
    if (!rentPriceInWei) return;

    const nativeAssetPrice = ethereumUtils.getPriceOfNativeAssetForNetwork(
      Network.mainnet
    );

    const reverseRecord =
      sendReverseRecord || (await fetchReverseRecord(accountAddress));

    const {
      commitGasLimit,
      multicallGasLimit,
      registerWithConfigGasLimit,
      setNameGasLimit,
    } = await estimateENSRegistrationGasLimit(
      name,
      accountAddress,
      duration * timeUnits.secs.year,
      rentPriceInWei
    );

    const totalRegistrationGasLimit =
      [
        commitGasLimit,
        multicallGasLimit,
        registerWithConfigGasLimit,
        !reverseRecord && setNameGasLimit,
      ].reduce((a, b) => add(a || 0, b || 0)) || `${ethUnits.ens_registration}`;

    const { gasFeeParamsBySpeed, currentBaseFee } = await getEIP1559GasParams();

    const formattedEstimatedNetworkFee = formatEstimatedNetworkFee(
      totalRegistrationGasLimit,
      currentBaseFee.gwei,
      gasFeeParamsBySpeed.normal.maxPriorityFeePerGas.gwei,
      nativeCurrency,
      nativeAssetPrice
    );

    return {
      estimatedGasLimit: totalRegistrationGasLimit,
      estimatedNetworkFee: formattedEstimatedNetworkFee,
    };
  }, [
    accountAddress,
    duration,
    name,
    nativeCurrency,
    rentPriceInWei,
    sendReverseRecord,
  ]);

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
