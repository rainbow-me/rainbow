import { useEffect, useMemo, useState } from 'react';
import { fetchRegistrationDate } from '@rainbow-me/handlers/ens';
import {
  getAvailable,
  getNameExpires,
  getRentPrice,
} from '@rainbow-me/helpers/ens';
import { formatFixedDecimals, fromWei } from '@rainbow-me/helpers/utilities';

const WAITING_STATUS = 'waiting';
const FAILED_STATUS = 'failed';
const SUCCESS_STATUS = 'success';
const LOADING_STATUS = 'loading';

const formatRentPrice = (rentPrice: string) =>
  formatFixedDecimals(fromWei(rentPrice.toString()), 5);

const formatTime = (timestamp: string) => {
  const date = new Date(Number(timestamp) * 1000);
  return `${date.toDateString()}`;
};

export default function useENSRegistration({
  name,
  duration = 31536000,
}: {
  name: string;
  duration: number;
}) {
  const [registrationData, setRegistrationData] = useState<{
    available: boolean | null;
    rentPrice: string | null;
    nameExpires: string | null;
    registrationDate: string | null;
  }>({
    available: null,
    nameExpires: null,
    registrationDate: null,
    rentPrice: null,
  });

  // status is going to depend if the name is ready and also if is available or not
  const status = useMemo(() => {
    if (name.length < 3) {
      return WAITING_STATUS;
    } else if (registrationData.available === null) {
      return LOADING_STATUS;
    } else if (registrationData.available === true) {
      return registrationData.rentPrice ? SUCCESS_STATUS : FAILED_STATUS;
    } else {
      return Boolean(registrationData.registrationDate) &&
        Boolean(registrationData.nameExpires)
        ? SUCCESS_STATUS
        : FAILED_STATUS;
    }
  }, [
    name.length,
    registrationData.available,
    registrationData.nameExpires,
    registrationData.registrationDate,
    registrationData.rentPrice,
  ]);

  useEffect(() => {
    const getRegistrationValues = async () => {
      const isAvailable = await getAvailable(name);
      if (isAvailable) {
        // we need the price only if is available
        const newRentPrice = await getRentPrice(name, duration);
        const formattedRentPrice = formatRentPrice(newRentPrice);
        setRegistrationData({
          available: isAvailable,
          nameExpires: null,
          registrationDate: null,
          rentPrice: formattedRentPrice,
        });
      } else {
        // we need the expiration and registration date when is not available
        const registrationDate = await fetchRegistrationDate(name + '.eth');
        const newNameExpires = await getNameExpires(name);
        const formattedRegistrarionDate = formatTime(registrationDate);
        const formattedNamesExpires = formatTime(newNameExpires);
        setRegistrationData({
          available: isAvailable,
          nameExpires: formattedNamesExpires,
          registrationDate: formattedRegistrarionDate,
          rentPrice: null,
        });
      }
    };
    getRegistrationValues();
  }, [duration, name]);

  return {
    status,
    ...registrationData,
  };
}
