import { useCallback, useMemo } from 'react';
import { useQuery } from 'react-query';
import { useAccountSettings } from '.';
import { estimateENSRegistrationGasLimit } from '@rainbow-me/handlers/ens';
import {
  formatEstimatedNetworkFee,
  formatRentPrice,
  formatTotalRegistrationCost,
} from '@rainbow-me/helpers/ens';
import { Network } from '@rainbow-me/helpers/networkTypes';
import { add, addDisplay, multiply } from '@rainbow-me/helpers/utilities';
import { getEIP1559GasParams } from '@rainbow-me/redux/gas';
import { ethereumUtils } from '@rainbow-me/utils';

const secsInYear = 31536000;

export default function useENSRegistrationCosts({
  duration,
  name,
  rentPrice,
}: {
  duration: number;
  name: string;
  rentPrice?: { perYear: { wei: number } };
}) {
  const { nativeCurrency, accountAddress } = useAccountSettings();

  const getEstimatedNetworkFee = useCallback(
    async (_, { accountAddress, rentPricePerYear, name, nativeCurrency }) => {
      const nativeAssetPrice = ethereumUtils.getPriceOfNativeAssetForNetwork(
        Network.mainnet
      );
      const rentPrice = multiply(rentPricePerYear, duration);
      const gasLimit = await estimateENSRegistrationGasLimit(
        name,
        accountAddress,
        duration * secsInYear,
        rentPrice
      );

      const {
        gasFeeParamsBySpeed,
        currentBaseFee,
      } = await getEIP1559GasParams();

      const formattedEstimatedNetworkFee = formatEstimatedNetworkFee(
        gasLimit,
        currentBaseFee.gwei,
        gasFeeParamsBySpeed.normal.maxPriorityFeePerGas.gwei,
        nativeCurrency,
        nativeAssetPrice
      );

      return formattedEstimatedNetworkFee;
    },
    [duration]
  );

  const rentPricePerYear = rentPrice?.perYear?.wei?.toString();
  const { data: estimatedNetworkFee, status } = useQuery(
    Boolean(rentPricePerYear) && [
      'getEstimatedNetworkFee',
      {
        accountAddress,
        name,
        nativeCurrency,
        rentPricePerYear,
      },
    ],
    getEstimatedNetworkFee,
    { cacheTime: 0 }
  );

  const data = useMemo(() => {
    if (estimatedNetworkFee && rentPricePerYear) {
      const nativeAssetPrice = ethereumUtils.getPriceOfNativeAssetForNetwork(
        Network.mainnet
      );
      const rentPrice = multiply(rentPricePerYear, duration);
      const estimatedRentPrice = formatRentPrice(
        rentPrice,
        duration,
        nativeCurrency,
        nativeAssetPrice
      );

      const weiEstimatedTotalCost = add(
        estimatedNetworkFee.wei,
        estimatedRentPrice.wei.toString()
      );
      const displayEstimatedTotalCost = addDisplay(
        estimatedNetworkFee.display,
        estimatedRentPrice.total.display
      );
      const estimatedTotalRegistrationCost = formatTotalRegistrationCost(
        weiEstimatedTotalCost,
        nativeCurrency,
        nativeAssetPrice
      );

      return {
        estimatedNetworkFee: estimatedNetworkFee,
        estimatedRentPrice,
        estimatedTotalRegistrationCost: {
          ...estimatedTotalRegistrationCost,
          display: displayEstimatedTotalCost,
        },
      };
    }
  }, [duration, estimatedNetworkFee, nativeCurrency, rentPricePerYear]);

  const newStatus = rentPricePerYear ? status : 'idle';

  const isIdle = newStatus === 'idle';
  const isLoading = newStatus === 'loading';
  const isSuccess = newStatus === 'success' && !!data?.estimatedRentPrice;

  return {
    data,
    isIdle,
    isLoading,
    isSuccess,
  };
}
