import { formatsByName } from '@ensdomains/address-encoder';
import { hash } from '@ensdomains/eth-ens-namehash';
import { BigNumberish, Contract } from 'ethers';
import { keccak_256 as sha3 } from 'js-sha3';
import { addBuffer } from './utilities';
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

interface ENSRegistrationRecords {
  coinAddress: { key: string; address: string }[] | null;
  contentHash: string | null;
  ensAssociatedAddress: string | null;
  text: { key: string; value: string }[] | null;
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

const setupMulticallRecords = (
  name: string,
  records: ENSRegistrationRecords,
  resolverInstance: Contract
): string[] => {
  const resolver = resolverInstance.interface;
  const namehash = hash(name);

  const data = [];

  // ens associated address
  const ensAssociatedRecord = records.ensAssociatedAddress;
  if (
    Boolean(ensAssociatedRecord) &&
    typeof ensAssociatedRecord === 'string' &&
    parseInt(ensAssociatedRecord, 16) !== 0
  ) {
    data.push(
      resolver.encodeFunctionData('setAddr(bytes32,address)', [
        namehash,
        ensAssociatedRecord,
      ])
    );
  }
  // content hash address
  const contentHashAssociatedRecord = records.contentHash;
  if (
    Boolean(contentHashAssociatedRecord) &&
    typeof contentHashAssociatedRecord === 'string' &&
    parseInt(contentHashAssociatedRecord, 16) !== 0
  ) {
    data.push(
      resolver.encodeFunctionData('setContenthash', [
        namehash,
        contentHashAssociatedRecord,
      ])
    );
  }
  // coin addresses
  const coinAddressesAssociatedRecord = records.coinAddress;
  if (coinAddressesAssociatedRecord) {
    data.push(
      coinAddressesAssociatedRecord.map(coinRecord => {
        const { decoder, coinType } = formatsByName[coinRecord.key];
        let addressAsBytes;
        if (!coinRecord.address || coinRecord.address === '') {
          addressAsBytes = Buffer.from('');
        } else {
          addressAsBytes = decoder(coinRecord.address);
        }
        return resolver.encodeFunctionData('setAddr(bytes32,uint256,bytes)', [
          namehash,
          coinType,
          addressAsBytes,
        ]);
      })
    );
  }
  // text addresses
  const textAssociatedRecord = records.text;
  if (textAssociatedRecord) {
    data.push(
      textAssociatedRecord.map(textRecord => {
        return resolver.encodeFunctionData('setText', [
          namehash,
          textRecord.key,
          textRecord.value,
        ]);
      })
    );
  }
  // flatten textrecords and addresses and remove undefined
  return data.flat().filter(Boolean);
};

const generateSalt = () => {
  const random = new Uint8Array(32);
  crypto.getRandomValues(random);
  const salt =
    '0x' +
    Array.from(random)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  return salt;
};

const getENSExecutionDetails = ({
  name,
  type,
  accountAddress,
  rentPrice,
  duration,
  recordKey,
  recordValue,
  records,
}: {
  name: string;
  type: ENSRegistrationStepType;
  accountAddress?: string;
  rentPrice?: string;
  duration?: number;
  recordKey?: string;
  recordValue?: string;
  records?: ENSRegistrationRecords;
}): {
  methodArguments: (string | string[] | number)[] | null;
  methodNames: string[] | null;
  value: BigNumberish | null;
  contract: Contract | null;
} => {
  let methodNames: string[] | null = null;
  let args: (string | string[] | number)[] | null = null;
  let value: string | null = null;
  let contract: Contract | null = null;

  switch (type) {
    case ENSRegistrationStepType.COMMIT: {
      if (!name || !accountAddress) throw new Error('Bad arguments for commit');
      methodNames = ['commit'];
      const salt = generateSalt();
      const registrarController = getENSRegistrarControllerContract();
      const commitment = registrarController.makeCommitment(
        name,
        accountAddress,
        salt
      );
      args = [commitment];
      contract = getENSRegistrarControllerContract();
      break;
    }
    case ENSRegistrationStepType.REGISTER_WITH_CONFIG: {
      if (!name || !accountAddress || !duration || !rentPrice)
        throw new Error('Bad arguments for registerWithConfig');
      methodNames = ['register'];
      const salt = generateSalt();
      args = [name, accountAddress, duration, salt];
      contract = getENSRegistrarControllerContract();
      value = toHex(addBuffer(rentPrice, 1.1));
      break;
    }
    case ENSRegistrationStepType.SET_TEXT: {
      if (!name || !recordKey || !recordValue)
        throw new Error('Bad arguments for setText');
      methodNames = ['setText'];
      const namehash = hash(name);
      args = [namehash, recordKey, recordValue];
      contract = getENSPublicResolverContract();
      break;
    }
    case ENSRegistrationStepType.MULTICALL: {
      if (!name || !records) throw new Error('Bad arguments for multicall');
      methodNames = ['multicall'];
      contract = getENSPublicResolverContract();
      const data = setupMulticallRecords(name, records, contract) || [];
      args = [data];
      break;
    }
    case ENSRegistrationStepType.SET_NAME:
      if (!name) throw new Error('Bad arguments for setName');
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
