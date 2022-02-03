import { useEffect, useState } from 'react';
import {
  getAvailable,
  getNameExpires,
  getRentPrice,
} from '@rainbow-me/helpers/ens';

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
      const newNameExpires = await getNameExpires(name);
      setAvailable(newAvailable);
      setRentPrice(newRentPrice);
      setNameExpires(newNameExpires);
    };
    getRegistrationValues();
  }, [duration, name]);

  return {
    available,
    nameExpires,
    rentPrice,
  };
}
