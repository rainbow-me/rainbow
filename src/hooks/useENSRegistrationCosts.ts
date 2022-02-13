import { useCallback, useMemo } from 'react';
import { useQuery } from 'react-query';
import { useAccountSettings } from '.';
import { estimateENSRegistrationGasLimit } from '@rainbow-me/handlers/ens';
import { Network } from '@rainbow-me/helpers/networkTypes';
import {
  add,
  addDisplay,
  convertAmountAndPriceToNativeDisplay,
  fromWei,
  multiply,
} from '@rainbow-me/helpers/utilities';
import { gweiToWei } from '@rainbow-me/parsers';
import { getEIP1559GasParams } from '@rainbow-me/redux/gas';
import { ethereumUtils } from '@rainbow-me/utils';

const secsInYear = 31536000;

const formatEstimatedNetworkFee = (
  gasLimit: string,
  maxBaseFee: string,
  maxPriorityFee: string,
  nativeCurrency: any,
  nativeAssetPrice: any
) => {
  const networkFeeInWei = multiply(
    gweiToWei(add(maxBaseFee, maxPriorityFee)),
    gasLimit
  );
  const networkFeeInEth = fromWei(networkFeeInWei);

  const { amount, display } = convertAmountAndPriceToNativeDisplay(
    networkFeeInEth,
    nativeAssetPrice,
    nativeCurrency
  );

  return {
    amount,
    display,
    wei: networkFeeInWei,
  };
};

const formatTotalRegistrationCost = (
  wei: string,
  nativeCurrency: any,
  nativeAssetPrice: any,
  skipDecimals: boolean = false
) => {
  const networkFeeInEth = fromWei(wei);

  const { amount, display } = convertAmountAndPriceToNativeDisplay(
    networkFeeInEth,
    nativeAssetPrice,
    nativeCurrency,
    undefined,
    skipDecimals
  );

  return {
    amount,
    display,
    wei,
  };
};

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

      const networkFeeCost = formatTotalRegistrationCost(
        formattedEstimatedNetworkFee.wei,
        nativeCurrency,
        nativeAssetPrice
      );

      return networkFeeCost;
    },
    [duration]
  );

  const rentPricePerYear = rentPrice?.perYear?.wei?.toString();
  const { data: networkFee, status } = useQuery(
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
    if (networkFee && rentPricePerYear) {
      const nativeAssetPrice = ethereumUtils.getPriceOfNativeAssetForNetwork(
        Network.mainnet
      );
      const rentPrice = multiply(rentPricePerYear, duration);
      const estimatedRentPrice = formatTotalRegistrationCost(
        rentPrice,
        nativeCurrency,
        nativeAssetPrice,
        true
      );
      const weiEstimatedTotalCost = add(networkFee.wei, estimatedRentPrice.wei);
      const displayEstimatedTotalCost = addDisplay(
        networkFee.display,
        estimatedRentPrice.display
      );
      const estimatedTotalRegistrationCost = formatTotalRegistrationCost(
        weiEstimatedTotalCost,
        nativeCurrency,
        nativeAssetPrice
      );
      return {
        estimatedNetworkFeeCost: networkFee,
        estimatedRentPrice,
        estimatedTotalRegistrationCost: {
          ...estimatedTotalRegistrationCost,
          display: displayEstimatedTotalCost,
        },
      };
    }
  }, [duration, nativeCurrency, networkFee, rentPricePerYear]);

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
