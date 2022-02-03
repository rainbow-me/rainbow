import { keccak_256 as sha3 } from 'js-sha3';
import { useCallback } from 'react';
import {
  getBaseRegistrarImplementationContract,
  getENSContract,
  getENSRegistrarContract,
} from '@rainbow-me/helpers/ens';
export default function useENSRegistration() {
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

  return { getAvailable, getNameExpires, getRentPrice, getResolver };
}
