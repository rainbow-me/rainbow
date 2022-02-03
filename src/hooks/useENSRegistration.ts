import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const getRegistrationValues = async () => {
      const newAvailable = await getAvailable(name);
      const newRentPrice = await getRentPrice(name, duration);
      const formattedRentPrice = formatRentPrice(newRentPrice);
      const newNameExpires = await getNameExpires(name);
      const formattedNamesExpires = formatTime(newNameExpires);
      setAvailable(newAvailable);
      setRentPrice(formattedRentPrice);
      setNameExpires(formattedNamesExpires);
    };
    getRegistrationValues();
  }, [duration, name]);

  return {
    available,
    nameExpires,
    rentPrice,
  };
}
