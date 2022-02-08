import { BigNumber } from 'ethers';
import { useCallback, useMemo } from 'react';
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

export default function useENSRegistrationEstimations({
  duration,
  name,
  rentPrice,
  ensIsAvailable,
}: {
  duration: number;
  name: string;
  rentPrice: BigNumber;
  ensIsAvailable: boolean;
}) {
  const { nativeCurrency, accountAddress } = useAccountSettings();
  const isValidLength = useMemo(() => name.length > 2, [name.length]);

  const getRegistrationValuesEstimations = useCallback(async () => {
    const nativeAssetPrice = ethereumUtils.getPriceOfNativeAssetForNetwork(
      Network.mainnet
    );
    const gasLimit = await estimateENSRegistrationGasLimit(
      name,
      accountAddress,
      duration * secsInYear,
      rentPrice.toString()
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
      rentPrice.toString()
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
    ensIsAvailable && [
      'getRegistrationValuesEstimations',
      duration,
      name,
      rentPrice,
    ],
    getRegistrationValuesEstimations
  );

  const newStatus = isValidLength ? status : 'idle';

  const isIdle = newStatus === 'idle';
  const isLoading = newStatus === 'loading';
  const isAvailable =
    newStatus === 'success' && !!data?.estimatedTotalRegistrationCost;

  return {
    data,
    isAvailable,
    isIdle,
    isLoading,
  };
}
