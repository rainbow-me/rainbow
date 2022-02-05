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
  nativeCurrency: any,
  nativeAssetPrice: any
) => {
  const rentPriceInETH = fromWei(rentPrice.toString());
  const rentPricePerYear = getRentPricePerYear(rentPriceInETH, duration);
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
      const rentPrice = await getRentPrice(name, duration * secsInYear);
      const nativeAssetPrice = ethereumUtils.getPriceOfNativeAssetForNetwork(
        Network.mainnet
      );
      const formattedRentPrice = formatRentPrice(
        rentPrice,
        duration,
        nativeCurrency,
        nativeAssetPrice
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

      const formattedEstimatedNetworkFee = formatEstimatedNetworkFee(
        gasLimit,
        currentBaseFee.gwei,
        gasFeeParamsBySpeed.normal.maxPriorityFeePerGas.gwei,
        nativeCurrency,
        nativeAssetPrice
      );

      const weiEstimatedTotalCost = add(
        formattedEstimatedNetworkFee.wei,
        formattedRentPrice.wei
      );
      const totalRegistrationCost = formatTotalRegistrationCost(
        weiEstimatedTotalCost,
        nativeCurrency,
        nativeAssetPrice
      );

      return {
        available: isAvailable,
        estimatedTotalRegistrationCost: totalRegistrationCost,
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
