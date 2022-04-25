import { format } from 'date-fns';
import { useCallback, useMemo } from 'react';
import { useQuery } from 'react-query';
import { useAccountSettings } from '.';
import { fetchRegistrationDate } from '@rainbow-me/handlers/ens';
import {
  ENS_DOMAIN,
  formatRentPrice,
  getAvailable,
  getNameExpires,
  getRentPrice,
} from '@rainbow-me/helpers/ens';
import { Network } from '@rainbow-me/helpers/networkTypes';
import { timeUnits } from '@rainbow-me/references';
import { ethereumUtils, validateENS } from '@rainbow-me/utils';

const formatTime = (timestamp: string, abbreviated: boolean = true) => {
  const style = abbreviated ? 'MMM d, y' : 'MMMM d, y';
  return format(new Date(Number(timestamp) * 1000), style);
};

export default function useENSSearch({
  yearsDuration = 1,
  name: inputName,
}: {
  yearsDuration?: number;
  name: string;
}) {
  const name = inputName.replace(ENS_DOMAIN, '');
  const { nativeCurrency } = useAccountSettings();
  const isValidLength = useMemo(() => name.length > 2, [name.length]);
  const duration = yearsDuration * timeUnits.secs.year;
  const getRegistrationValues = useCallback(async () => {
    const ensValidation = validateENS(`${name}${ENS_DOMAIN}`, {
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
    const rentPrice = await getRentPrice(name, duration);
    const nativeAssetPrice = ethereumUtils.getPriceOfNativeAssetForNetwork(
      Network.mainnet
    );
    const formattedRentPrice = formatRentPrice(
      rentPrice,
      yearsDuration,
      nativeCurrency,
      nativeAssetPrice
    );
    if (isAvailable) {
      return {
        available: isAvailable,
        rentPrice: formattedRentPrice,
        valid: true,
      };
    } else {
      // we need the expiration and registration date when is not available
      const registrationDate = await fetchRegistrationDate(name + ENS_DOMAIN);
      const nameExpires = await getNameExpires(name);
      const formattedRegistrarionDate = formatTime(registrationDate, false);
      const formattedExpirationDate = formatTime(nameExpires);

      return {
        available: isAvailable,
        expirationDate: formattedExpirationDate,
        registrationDate: formattedRegistrarionDate,
        rentPrice: formattedRentPrice,
        valid: true,
      };
    }
  }, [duration, name, nativeCurrency, yearsDuration]);

  const { data, status, isIdle, isLoading } = useQuery(
    ['getRegistrationValues', [duration, name, nativeCurrency]],
    getRegistrationValues,
    { enabled: isValidLength, retry: 0, staleTime: Infinity }
  );

  const isAvailable = status === 'success' && data?.available === true;
  const isRegistered = status === 'success' && data?.available === false;
  const isInvalid = status === 'success' && !data?.valid;

  return {
    data,
    isAvailable,
    isIdle,
    isInvalid,
    isLoading,
    isRegistered,
  };
}
