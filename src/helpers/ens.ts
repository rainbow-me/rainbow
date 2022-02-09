import { Contract } from 'ethers';
import { keccak_256 as sha3 } from 'js-sha3';
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

enum ENS_RECORDS {
  ETH = 'ETH',
  BTC = 'BTC',
  LTC = 'LTC',
  DOGE = 'DOGE',
  content = 'content',
  email = 'email',
  url = 'url',
  avatar = 'avatar',
  description = 'description',
  notice = 'notice',
  keywords = 'keywords',
  discord = 'com.discord',
  github = 'com.github',
  reddit = 'com.reddit',
  twitter = 'com.twitter',
  telegram = 'com.telegram',
  ensDelegate = 'eth.ens.delegate',
}
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

const getResolver = async (name: string): Promise<string> =>
  getENSContract().resolver(name);

const getAvailable = async (name: string): Promise<boolean> =>
  getENSRegistrarContract().available(name);

const getNameExpires = async (name: string): Promise<object> =>
  getBaseRegistrarImplementationContract().nameExpires(
    addHexPrefix(sha3(name))
  );

const getRentPrice = async (name: string, duration: number): Promise<string> =>
  getENSRegistrarContract().rentPrice(name, duration);

const getENSRecordKeys = () => Object.keys(ENS_RECORDS);
const getENSRecordValues = () => Object.values(ENS_RECORDS);

export {
  ENS_RECORDS,
  getENSContract,
  getENSRecordKeys,
  getENSRecordValues,
  getENSRegistrarContract,
  getBaseRegistrarImplementationContract,
  getResolver,
  getAvailable,
  getNameExpires,
  getRentPrice,
};
