import { useCallback, useMemo } from 'react';
import { useQuery } from 'react-query';
import { useAccountSettings } from '.';
import {
  estimateENSRegistrationGasLimit,
  fetchRegistrationDate,
} from '@rainbow-me/handlers/ens';
import {
  getAvailable,
  getNameExpires,
  getRentPrice,
} from '@rainbow-me/helpers/ens';
import { Network } from '@rainbow-me/helpers/networkTypes';
import {
  add,
  convertAmountAndPriceToNativeDisplay,
  divide,
  fromWei,
  multiply,
} from '@rainbow-me/helpers/utilities';
import { gweiToWei } from '@rainbow-me/parsers';
import { getEIP1559GasParams } from '@rainbow-me/redux/gas';
import { ethereumUtils } from '@rainbow-me/utils';

const secsInYear = 31536000;

const getRentPricePerYear = (rentPrice: string, duration: number) =>
  divide(rentPrice, duration);

const formatRentPrice = (
  rentPrice: string,
  duration: number,
  nativeCurrency: any
) => {
  const rentPriceInETH = fromWei(rentPrice.toString());
  const rentPricePerYear = getRentPricePerYear(rentPriceInETH, duration);
  const nativeAssetPrice = ethereumUtils.getPriceOfNativeAssetForNetwork(
    Network.mainnet
  );
  const { amount, display } = convertAmountAndPriceToNativeDisplay(
    rentPriceInETH,
    nativeAssetPrice,
    nativeCurrency
  );
  const {
    display: displayPerYear,
    amount: amountPerYear,
  } = convertAmountAndPriceToNativeDisplay(
    rentPricePerYear,
    nativeAssetPrice,
    nativeCurrency,
    undefined,
    true
  );

  return {
    perYear: {
      amount: amountPerYear,
      display: displayPerYear,
    },
    total: {
      amount,
      display,
    },
    wei: rentPrice.toString(),
  };
};

const formatNetworkFee = (
  gasLimit: string,
  maxBaseFee: string,
  maxPriorityFee: string,
  nativeCurrency: any
) => {
  const networkFeeInWei = multiply(
    gweiToWei(add(maxBaseFee, maxPriorityFee)),
    gasLimit
  );
  const networkFeeInEth = fromWei(networkFeeInWei);
  const nativeAssetPrice = ethereumUtils.getPriceOfNativeAssetForNetwork(
    Network.mainnet
  );
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

const formatTotalCost = (wei: string, nativeCurrency: any) => {
  const networkFeeInEth = fromWei(wei);
  const nativeAssetPrice = ethereumUtils.getPriceOfNativeAssetForNetwork(
    Network.mainnet
  );
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

const formatTime = (timestamp: string) => {
  const date = new Date(Number(timestamp) * 1000);
  return `${date.toLocaleDateString()}`;
};

export default function useENSRegistration({
  duration,
  name,
}: {
  duration: number;
  name: string;
}) {
  const { nativeCurrency, accountAddress } = useAccountSettings();
  const isValidLength = useMemo(() => name.length > 2, [name.length]);

  const getRegistrationValues = useCallback(async () => {
    const isAvailable = await getAvailable(name);
    if (isAvailable) {
      // we need the price only if is available
      const rentPrice = await getRentPrice(name, duration * secsInYear);
      const formattedRentPrice = formatRentPrice(
        rentPrice,
        duration,
        nativeCurrency
      );
      const gasLimit = await estimateENSRegistrationGasLimit(
        name,
        accountAddress,
        duration * secsInYear,
        rentPrice.toString()
      );

      const {
        gasFeeParamsBySpeed,
        currentBaseFee,
      } = await getEIP1559GasParams();

      const estimatedNetworkFee = formatNetworkFee(
        gasLimit,
        currentBaseFee.gwei,
        gasFeeParamsBySpeed.normal.maxPriorityFeePerGas.gwei,
        nativeCurrency
      );

      const weiEstimatedTotalCost = add(
        estimatedNetworkFee.wei,
        formattedRentPrice.wei
      );
      const totalCost = formatTotalCost(weiEstimatedTotalCost, nativeCurrency);

      return {
        available: isAvailable,
        estimatedTotalCost: totalCost,
        expirationDate: null,
        registrationDate: null,
        rentPrice: formattedRentPrice,
      };
    } else {
      // we need the expiration and registration date when is not available
      const registrationDate = await fetchRegistrationDate(name + '.eth');
      const nameExpires = await getNameExpires(name);
      const formattedRegistrarionDate = formatTime(registrationDate);
      const formattedExpirationDate = formatTime(nameExpires);

      return {
        available: isAvailable,
        expirationDate: formattedExpirationDate,
        registrationDate: formattedRegistrarionDate,
        rentPrice: null,
      };
    }
  }, [name, duration, nativeCurrency, accountAddress]);

  const { data: registrationData, status } = useQuery(
    isValidLength && ['registration', name],
    () => getRegistrationValues()
  );

  return { status: isValidLength ? status : 'idle', ...registrationData };
}
