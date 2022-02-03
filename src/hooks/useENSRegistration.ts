import { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
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
  const [available, setAvailable] = useState<boolean | null>(null);
  const [rentPrice, setRentPrice] = useState<string | null>(null);
  const [nameExpires, setNameExpires] = useState<string | null>(null);

  // we can get the registration date only if is not available
  const { data } = useQuery(
    !available && name.length > 2 && ['registration', name],
    async (_, name) => {
      const registrationDate = await fetchRegistrationDate(name + '.eth');
      return {
        registrationDate: formatTime(registrationDate),
      };
    }
  );

  // status is going to depend if the name is ready and also if is available or not
  const status = useMemo(() => {
    if (name.length < 3) {
      return WAITING_STATUS;
    } else if (available === null) {
      return LOADING_STATUS;
    } else if (available === true) {
      return rentPrice ? SUCCESS_STATUS : FAILED_STATUS;
    } else {
      return Boolean(data?.registrationDate) && Boolean(nameExpires)
        ? SUCCESS_STATUS
        : FAILED_STATUS;
    }
  }, [available, data?.registrationDate, name.length, nameExpires, rentPrice]);

  useEffect(() => {
    const getRegistrationValues = async () => {
      const newAvailable = await getAvailable(name);
      if (newAvailable) {
        // we need the price only if is available
        const newRentPrice = await getRentPrice(name, duration);
        const formattedRentPrice = formatRentPrice(newRentPrice);
        setRentPrice(formattedRentPrice);
      } else {
        // we need the expiration date when is not available
        const newNameExpires = await getNameExpires(name);
        const formattedNamesExpires = formatTime(newNameExpires);
        setNameExpires(formattedNamesExpires);
      }
      setAvailable(newAvailable);
    };
    getRegistrationValues();
  }, [duration, name]);

  return {
    available,
    nameExpires,
    registrationDate: data?.registrationDate,
    rentPrice,
    status,
  };
}
