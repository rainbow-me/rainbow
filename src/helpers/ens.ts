import { Contract } from 'ethers';
import { keccak_256 as sha3 } from 'js-sha3';
import { multiply } from './utilities';
import { addHexPrefix, toHex, web3Provider } from '@rainbow-me/handlers/web3';
import {
  ENSBaseRegistrarImplementationABI,
  ensBaseRegistrarImplementationAddress,
  ENSETHRegistrarControllerABI,
  ensETHRegistrarControllerAddress,
  ENSPublicResolverABI,
  ensPublicResolverAddress,
  ensRegistryAddress,
  ENSRegistryWithFallbackABI,
  ENSReverseRegistrarABI,
  ensReverseRegistrarAddress,
} from '@rainbow-me/references';

export enum ENSRegistrationStepType {
  COMMIT,
  REGISTER_WITH_CONFIG,
  SET_TEXT,
  SET_NAME,
  MULTICALL,
}

const getENSRegistryContract = () => {
  return new Contract(
    ensRegistryAddress,
    ENSRegistryWithFallbackABI,
    web3Provider
  );
};
const getENSRegistrarControllerContract = (registrarAddress?: string) => {
  return new Contract(
    registrarAddress || ensETHRegistrarControllerAddress,
    ENSETHRegistrarControllerABI,
    web3Provider
  );
};
const getENSPublicResolverContract = () => {
  return new Contract(
    ensPublicResolverAddress,
    ENSPublicResolverABI,
    web3Provider
  );
};

const getENSReverseRegistrarContract = () => {
  return new Contract(
    ensReverseRegistrarAddress,
    ENSReverseRegistrarABI,
    web3Provider
  );
};

const getENSBaseRegistrarImplementationContract = () => {
  return new Contract(
    ensBaseRegistrarImplementationAddress,
    ENSBaseRegistrarImplementationABI,
    web3Provider
  );
};

const getResolver = async (name: string): Promise<string> =>
  getENSRegistryContract().resolver(name);

const getAvailable = async (name: string): Promise<boolean> =>
  getENSRegistrarControllerContract().available(name);

const getNameExpires = async (name: string): Promise<string> =>
  getENSBaseRegistrarImplementationContract().nameExpires(
    addHexPrefix(sha3(name))
  );

const getRentPrice = async (name: string, duration: number): Promise<string> =>
  getENSRegistrarControllerContract().rentPrice(name, duration);

const getENSExecutionDetails = (
  name: string,
  ensRegistrationStepType: ENSRegistrationStepType,
  accountAddress?: string,
  rentPrice?: string,
  duration?: number
): {
  methodArguments: (string | string[] | number | { value: string })[] | null;
  methodNames: string[] | null;
  value: string | null;
  contract: Contract | null;
} => {
  let methodNames: string[] | null = null;
  let args: (string | string[] | number | { value: string })[] | null = null;
  let value: string | null = null;
  let contract: Contract | null = null;

  switch (ensRegistrationStepType) {
    case ENSRegistrationStepType.COMMIT: {
      const random = new Uint8Array(32);
      crypto.getRandomValues(random);
      const salt =
        '0x' +
        Array.from(random)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

      const registrarController = getENSRegistrarControllerContract();
      const commitment = registrarController.makeCommitment(
        name,
        accountAddress,
        salt
      );
      methodNames = ['commit'];
      args = [commitment];
      contract = getENSRegistrarControllerContract();
      break;
    }
    case ENSRegistrationStepType.REGISTER_WITH_CONFIG: {
      if (!name || !accountAddress || !duration || !rentPrice) break;
      const random = new Uint8Array(32);
      crypto.getRandomValues(random);
      const salt =
        '0x' +
        Array.from(random)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      methodNames = ['register'];
      args = [name, accountAddress, duration, salt];
      value = toHex(Number(multiply(rentPrice, 1.1)).toFixed(0));
      contract = getENSRegistrarControllerContract();
      break;
    }
    case ENSRegistrationStepType.SET_TEXT:
      methodNames = ['setText'];
      args = ['node (bytes32)', 'key (string)', 'value (string)'];
      contract = getENSPublicResolverContract();
      break;
    case ENSRegistrationStepType.MULTICALL:
      methodNames = ['multicall'];
      args = ['data (bytes[])'];
      contract = getENSPublicResolverContract();
      break;
    case ENSRegistrationStepType.SET_NAME:
      methodNames = ['setName'];
      args = [name];
      contract = getENSReverseRegistrarContract();
      break;
  }
  return {
    contract,
    methodArguments: args,
    methodNames,
    value,
  };
};

export {
  getENSRegistryContract,
  getENSRegistrarControllerContract,
  getENSBaseRegistrarImplementationContract,
  getENSPublicResolverContract,
  getENSReverseRegistrarContract,
  getResolver,
  getAvailable,
  getNameExpires,
  getRentPrice,
  getENSExecutionDetails,
};
