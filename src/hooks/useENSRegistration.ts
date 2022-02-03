import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { fetchRegistrationDate } from '@rainbow-me/handlers/ens';
import {
  getAvailable,
  getNameExpires,
  getRentPrice,
} from '@rainbow-me/helpers/ens';
import { formatFixedDecimals, fromWei } from '@rainbow-me/helpers/utilities';

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
  const [available, setAvailable] = useState<boolean>(false);
  const [rentPrice, setRentPrice] = useState<string | null>(null);
  const [nameExpires, setNameExpires] = useState<string | null>(null);

  // we need the registration date only if is not available
  const { data, status } = useQuery(
    !available && name.length > 2 && ['registration', name],
    async (_, name) => {
      const registrationDate = await fetchRegistrationDate(name + '.eth');
      return {
        registrationDate: formatTime(registrationDate),
      };
    }
  );

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
