import { useEffect, useMemo, useState } from 'react';
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

const WAITING_STATUS = 'waiting';
const FAILED_STATUS = 'failed';
const SUCCESS_STATUS = 'success';
const LOADING_STATUS = 'loading';

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
    nativeCurrency
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
  const [registrationData, setRegistrationData] = useState<{
    available: boolean | null;
    rentPrice: {
      total: { amount: string; display: string };
      perYear: { amount: string; display: string };
      wei: string;
    } | null;
    expirationDate: string | null;
    registrationDate: string | null;
  }>({
    available: null,
    expirationDate: null,
    registrationDate: null,
    rentPrice: null,
  });

  const { nativeCurrency } = useAccountSettings();

  const nameIsValid = useMemo(() => name.length > 2, [name.length]);

  // status is going to depend if the name is ready and also if is available or not
  const status = useMemo(() => {
    if (!nameIsValid) {
      return WAITING_STATUS;
    } else if (registrationData.available === null) {
      return LOADING_STATUS;
    } else if (registrationData.available === true) {
      return registrationData.rentPrice ? SUCCESS_STATUS : FAILED_STATUS;
    } else {
      return Boolean(registrationData.registrationDate) &&
        Boolean(registrationData.expirationDate)
        ? SUCCESS_STATUS
        : FAILED_STATUS;
    }
  }, [
    nameIsValid,
    registrationData.available,
    registrationData.expirationDate,
    registrationData.registrationDate,
    registrationData.rentPrice,
  ]);

  useEffect(() => {
    const getRegistrationValues = async () => {
      const isAvailable = await getAvailable(name);
      if (isAvailable) {
        // we need the price only if is available
        const rentPrice = await getRentPrice(name, duration * secsInYear);
        const formattedRentPrice = formatRentPrice(
          rentPrice,
          duration,
          nativeCurrency
        );
        setRegistrationData({
          available: isAvailable,
          expirationDate: null,
          registrationDate: null,
          rentPrice: formattedRentPrice,
        });
      } else {
        // we need the expiration and registration date when is not available
        const registrationDate = await fetchRegistrationDate(name + '.eth');
        const nameExpires = await getNameExpires(name);
        const formattedRegistrarionDate = formatTime(registrationDate);
        const formattedExpirationDate = formatTime(nameExpires);

        setRegistrationData({
          available: isAvailable,
          expirationDate: formattedExpirationDate,
          registrationDate: formattedRegistrarionDate,
          rentPrice: null,
        });
      }
    };
    nameIsValid && getRegistrationValues();
  }, [duration, name, nameIsValid, nativeCurrency]);

  return {
    status,
    ...registrationData,
  };
}
