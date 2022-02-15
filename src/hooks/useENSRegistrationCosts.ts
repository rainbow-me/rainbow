import { useCallback } from 'react';
import { useQuery } from 'react-query';
import { useAccountSettings } from '.';
import { estimateENSRegistrationGasLimit } from '@rainbow-me/handlers/ens';
import { Network } from '@rainbow-me/helpers/networkTypes';
import {
  add,
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
  nativeAssetPrice: any
) => {
  const networkFeeInEth = fromWei(wei);

  const { amount, display } = convertAmountAndPriceToNativeDisplay(
    networkFeeInEth,
    nativeAssetPrice,
    nativeCurrency
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
  rentPrice: string;
}) {
  const { nativeCurrency, accountAddress } = useAccountSettings();

  const getRegistrationValuesEstimations = useCallback(async () => {
    const nativeAssetPrice = ethereumUtils.getPriceOfNativeAssetForNetwork(
      Network.mainnet
    );
    const gasLimit = await estimateENSRegistrationGasLimit(
      name,
      accountAddress,
      duration * secsInYear,
      rentPrice
    );

    const { gasFeeParamsBySpeed, currentBaseFee } = await getEIP1559GasParams();

    const formattedEstimatedNetworkFee = formatEstimatedNetworkFee(
      gasLimit,
      currentBaseFee.gwei,
      gasFeeParamsBySpeed.normal.maxPriorityFeePerGas.gwei,
      nativeCurrency,
      nativeAssetPrice
    );

    const weiEstimatedTotalCost = add(
      formattedEstimatedNetworkFee.wei,
      rentPrice
    );
    const totalRegistrationCost = formatTotalRegistrationCost(
      weiEstimatedTotalCost,
      nativeCurrency,
      nativeAssetPrice
    );

    return {
      estimatedTotalRegistrationCost: totalRegistrationCost,
    };
  }, [accountAddress, duration, name, nativeCurrency, rentPrice]);

  const { data, status } = useQuery(
    !!rentPrice && [
      'getRegistrationValuesEstimations',
      duration,
      name,
      rentPrice,
    ],
    getRegistrationValuesEstimations
  );

  const newStatus = rentPrice ? status : 'idle';

  const isIdle = newStatus === 'idle';
  const isLoading = newStatus === 'loading';
  const isSuccess =
    newStatus === 'success' && !!data?.estimatedTotalRegistrationCost;

  return {
    data,
    isIdle,
    isLoading,
    isSuccess,
  };
}
