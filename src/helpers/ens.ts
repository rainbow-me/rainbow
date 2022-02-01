import { Contract } from 'ethers';
import { web3Provider } from '@rainbow-me/handlers/web3';
import { ENSABI, ETHRegistrarControllerABI } from '@rainbow-me/references';

const ensAddress = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const ensRegistrarAddress = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';

const getENSContract = () => {
  return new Contract(ensAddress, ENSABI, web3Provider);
};
const getENSRegistrarContract = (registrarAddress?: string) => {
  return new Contract(
    registrarAddress || ensRegistrarAddress,
    ETHRegistrarControllerABI,
    web3Provider
  );
};

const getResolver = async (name: string) => {
  const ens = getENSContract();
  return await ens.resolver(name);
};

const getAvailable = async (name: string) => {
  const registrar = getENSRegistrarContract();
  return await registrar.available(name);
};

const getRentPrice = async (name: string, duration: number) => {
  const registrar = getENSRegistrarContract();
  return await registrar.rentPrice(name, duration);
};

export { getResolver, getAvailable, getRentPrice };
