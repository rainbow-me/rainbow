import { format } from 'date-fns';
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
    nativeCurrency,
    3,
    true
  );
  const {
    display: displayPerYear,
    amount: amountPerYear,
  } = convertAmountAndPriceToNativeDisplay(
    rentPricePerYear,
    nativeAssetPrice,
    nativeCurrency,
    3,
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

const formatTime = (timestamp: string, abbreviated: boolean = true) => {
  const style = abbreviated ? 'MMM d, y' : 'MMMM d, y';
  return format(new Date(Number(timestamp) * 1000), style);
};

export default function useENSRegistration({
  duration,
  name,
}: {
  duration: number;
  name: string;
}) {
  const { nativeCurrency } = useAccountSettings();
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
      return {
        available: isAvailable,
        expirationDate: null,
        registrationDate: null,
        rentPrice: formattedRentPrice,
      };
    } else {
      // we need the expiration and registration date when is not available
      const registrationDate = await fetchRegistrationDate(name + '.eth');
      const nameExpires = await getNameExpires(name);
      const formattedRegistrarionDate = formatTime(registrationDate, false);
      const formattedExpirationDate = formatTime(nameExpires);

      return {
        available: isAvailable,
        expirationDate: formattedExpirationDate,
        registrationDate: formattedRegistrarionDate,
        rentPrice: null,
      };
    }
  }, [duration, nativeCurrency, name]);

  const { data: registrationData, status } = useQuery(
    isValidLength && ['registration', name],
    () => getRegistrationValues()
  );

  return { status: isValidLength ? status : 'idle', ...registrationData };
}
