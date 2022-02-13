import { format } from 'date-fns';
import { BigNumber } from 'ethers';
import { useCallback, useMemo } from 'react';
import { useQuery } from 'react-query';
import { useAccountSettings } from '.';
import { fetchRegistrationDate } from '@rainbow-me/handlers/ens';
import {
  getAvailable,
  getNameExpires,
  getRentPrice,
} from '@rainbow-me/helpers/ens';
import { Network } from '@rainbow-me/helpers/networkTypes';
import {
  convertAmountAndPriceToNativeDisplay,
  divide,
  fromWei,
} from '@rainbow-me/helpers/utilities';
import { ethereumUtils, validateENS } from '@rainbow-me/utils';

const secsInYear = 31536000;

const getRentPricePerYear = (rentPrice: string, duration: number) =>
  divide(rentPrice, duration);

const formatRentPrice = (
  rentPrice: BigNumber,
  duration: number,
  nativeCurrency: any,
  nativeAssetPrice: any
) => {
  const rentPriceInETH = fromWei(rentPrice.toString());
  const rentPricePerYear = getRentPricePerYear(rentPriceInETH, duration);
  const rentPricePerYearInWei = divide(rentPrice.toString(), duration);

  const { amount, display } = convertAmountAndPriceToNativeDisplay(
    rentPriceInETH,
    nativeAssetPrice,
    nativeCurrency,
    undefined,
    true
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
      wei: rentPricePerYearInWei,
    },
    total: {
      amount,
      display,
    },
    wei: rentPrice,
  };
};

const formatTime = (timestamp: string, abbreviated: boolean = true) => {
  const style = abbreviated ? 'MMM d, y' : 'MMMM d, y';
  return format(new Date(Number(timestamp) * 1000), style);
};

export default function useENSRegistration({
  duration = 1,
  name,
}: {
  duration?: number;
  name: string;
}) {
  const { nativeCurrency } = useAccountSettings();
  const isValidLength = useMemo(() => name.length > 2, [name.length]);

  const getRegistrationValues = useCallback(
    async (_, { name, duration, nativeCurrency }) => {
      const ensValidation = validateENS(`${name}.eth`, {
        includeSubdomains: false,
      });
      if (!ensValidation.valid) {
        return {
          code: ensValidation.code,
          hint: ensValidation.hint,
          valid: false,
        };
      }

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

        return {
          available: isAvailable,
          rentPrice: formattedRentPrice,
          valid: true,
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
          valid: true,
        };
      }
    },
    []
  );

  const { data, status } = useQuery(
    isValidLength && [
      'getRegistrationValues',
      { duration, name, nativeCurrency },
    ],
    getRegistrationValues,
    { retry: 0 }
  );

  const newStatus = isValidLength ? status : 'idle';

  const isIdle = newStatus === 'idle';
  const isLoading = newStatus === 'loading';
  const isAvailable = newStatus === 'success' && data?.available === true;
  const isRegistered = newStatus === 'success' && data?.available === false;
  const isInvalid = newStatus === 'success' && !data?.valid;

  return {
    data,
    isAvailable,
    isIdle,
    isInvalid,
    isLoading,
    isRegistered,
  };
}
