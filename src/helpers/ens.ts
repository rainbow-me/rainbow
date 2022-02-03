import { Contract } from 'ethers';
import { keccak_256 as sha3 } from 'js-sha3';
import { formatFixedDecimals, fromWei } from './utilities';
import { addHexPrefix, web3Provider } from '@rainbow-me/handlers/web3';
import {
  ENSABI,
  ENSBaseRegistrarImplementationABI,
  ETHRegistrarControllerABI,
} from '@rainbow-me/references';

const ensAddress = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
// fixed to main registrar for now
const ensRegistrarAddress = '0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5';
const ensBaseRegistrarImplementationAddress =
  '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85';

const timeFormatter = (timestamp: string) => {
  const date = new Date(Number(timestamp) * 1000);
  return `${date.toDateString()}`;
};

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

const getBaseRegistrarImplementationContract = () => {
  return new Contract(
    ensBaseRegistrarImplementationAddress,
    ENSBaseRegistrarImplementationABI,
    web3Provider
  );
};

const getResolver = async (name: string) => getENSContract().resolver(name);

const getAvailable = async (name: string) =>
  getENSRegistrarContract().available(name);

const getNameExpires = async (name: string) => {
  const nameExpires = getBaseRegistrarImplementationContract().nameExpires(
    addHexPrefix(sha3(name))
  );
  return timeFormatter(nameExpires);
};

const getRentPrice = async (name: string, duration: number) => {
  const rentPrice = await getENSRegistrarContract().rentPrice(name, duration);
  return formatFixedDecimals(fromWei(rentPrice.toString()), 5);
};

export {
  getENSContract,
  getENSRegistrarContract,
  getBaseRegistrarImplementationContract,
  getResolver,
  getAvailable,
  getNameExpires,
  getRentPrice,
};
