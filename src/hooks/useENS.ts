import { useCallback } from 'react';
import {
  getENSContract,
  getENSRegistrarContract,
} from '@rainbow-me/helpers/ens';

export default function useENS() {
  const ensContract = getENSContract();
  const ensRegistrarContract = getENSRegistrarContract();

  const getResolver = useCallback(
    async (name: string) => ensContract.resolver(name),
    [ensContract]
  );

  const getAvailable = useCallback(
    async (name: string) => ensRegistrarContract.available(name),
    [ensRegistrarContract]
  );

  const getRentPrice = useCallback(
    async (name: string, duration: number) =>
      ensRegistrarContract.rentPrice(name, duration),
    [ensRegistrarContract]
  );

  return { getAvailable, getRentPrice, getResolver };
}
