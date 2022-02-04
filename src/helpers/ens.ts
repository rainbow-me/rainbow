import { Contract } from 'ethers';
import { keccak_256 as sha3 } from 'js-sha3';
import { addHexPrefix, web3Provider } from '@rainbow-me/handlers/web3';
import {
  ENSABI,
  ENSBaseRegistrarImplementationABI,
  ETHRegistrarControllerABI,
} from '@rainbow-me/references';

enum ENSRegistrationStepType {
  COMMIT,
  REGISTER_WITH_CONFIG,
  SET_TEXT,
  SET_NAME,
  MULTICALL,
}

const ensAddress = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
// fixed to main registrar for now
const ensRegistrarAddress = '0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5';
const ensBaseRegistrarImplementationAddress =
  '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85';

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

const getNameExpires = async (name: string): Promise<string> =>
  getBaseRegistrarImplementationContract().nameExpires(
    addHexPrefix(sha3(name))
  );

const getRentPrice = async (name: string, duration: number): Promise<string> =>
  getENSRegistrarContract().rentPrice(name, duration);

const getExecutionDetails = (
  accountAddress: string,
  ensRegistrationStepType: ENSRegistrationStepType
): {
  methodArguments: (string | string[] | number)[];
  methodNames: string[];
  value: string | null;
} => {
  // let estimate: Function, method: Function,
  let methodNames: string[],
    args: (string | string[] | number)[],
    value: string | null = null;
  switch (ensRegistrationStepType) {
    // to ETHRegistrarController
    case ENSRegistrationStepType.COMMIT:
      methodNames = ['commit'];
      args = ['dummy commitment'];
      break;
    // to ETHRegistrarController
    case ENSRegistrationStepType.REGISTER_WITH_CONFIG:
      methodNames = ['register'];
      args = [
        'name',
        'owner',
        'duration',
        'secret',
        `{ value: price.toString() }`,
      ];
      value = 'eth value';
      break;
    // to Resolver
    case ENSRegistrationStepType.SET_TEXT:
      methodNames = ['setText'];
      args = ['node (bytes32)', 'key (string)', 'value (string)'];
      break;
    // to Resolver
    case ENSRegistrationStepType.MULTICALL:
      methodNames = ['multicall'];
      args = ['data (bytes[])'];
      break;
    // to ReverseRegistrar
    case ENSRegistrationStepType.SET_NAME:
      methodNames = ['setName'];
      args = ['name'];
      break;
  }
  return {
    methodArguments: args,
    methodNames,
    value,
  };
};

export {
  getENSContract,
  getENSRegistrarContract,
  getBaseRegistrarImplementationContract,
  getResolver,
  getAvailable,
  getNameExpires,
  getRentPrice,
  getExecutionDetails,
};
