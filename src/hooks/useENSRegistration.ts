import { BigNumber } from 'ethers';
import { keccak_256 as sha3 } from 'js-sha3';
import { useCallback, useEffect, useState } from 'react';
import {
  getBaseRegistrarImplementationContract,
  getENSContract,
  getENSRegistrarContract,
} from '@rainbow-me/helpers/ens';
export default function useENSRegistration({ name }: { name: string }) {
  const [available, setAvailable] = useState<boolean>(false);
  const [rentPrice, setRentPrice] = useState<BigNumber | null>(null);
  const [nameExpires, setNameExpires] = useState<BigNumber | null>(null);

  const ensContract = getENSContract();
  const ensRegistrarContract = getENSRegistrarContract();
  const ensBaseRegistrarContract = getBaseRegistrarImplementationContract();

  const getResolver = useCallback(
    async (name: string) => ensContract.resolver(name),
    [ensContract]
  );

  const getAvailable = useCallback(
    async (name: string) => ensRegistrarContract.available(name),
    [ensRegistrarContract]
  );

  const getNameExpires = useCallback(
    async (name: string) => {
      return ensBaseRegistrarContract.nameExpires('0x' + sha3(name));
    },
    [ensBaseRegistrarContract]
  );

  const getRentPrice = useCallback(
    async (name: string, duration: number) =>
      ensRegistrarContract.rentPrice(name, duration),
    [ensRegistrarContract]
  );

  useEffect(() => {
    const getRegistrationValues = async () => {
      const newAvailable = await getAvailable(name);
      const newRentPrice = await getRentPrice(name, 31536000);
      const newNameExpires = await getNameExpires(name);
      setAvailable(newAvailable);
      setRentPrice(newRentPrice);
      setNameExpires(newNameExpires);
    };
    getRegistrationValues();
  }, [getAvailable, getNameExpires, getRentPrice, name]);

  return {
    available,
    getAvailable,
    getNameExpires,
    getRentPrice,
    getResolver,
    nameExpires,
    rentPrice,
  };
}
