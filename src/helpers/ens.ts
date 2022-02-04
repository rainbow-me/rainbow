import { formatsByName } from '@ensdomains/address-encoder';
import { hash } from '@ensdomains/eth-ens-namehash';
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

const setupMulticallRecords = (
  name: string,
  records: {
    coinAddress: { key: string; address: string }[] | null;
    contentHash: string | null;
    ensAssociatedAddress: string | null;
    text: { key: string; value: string }[] | null;
  },
  resolverInstance: Contract
): string[] => {
  const resolver = resolverInstance.interface;
  const namehash = hash(name);

  const calls = [];

  // ens associated address
  const ensAssociatedRecord = records.ensAssociatedAddress;
  if (
    Boolean(ensAssociatedRecord) &&
    typeof ensAssociatedRecord === 'string' &&
    parseInt(ensAssociatedRecord, 16) !== 0
  ) {
    calls.push(
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
    calls.push(
      resolver.encodeFunctionData('setContenthash', [
        namehash,
        ensAssociatedRecord,
      ])
    );
  }
  // coin addresses
  const coinAddressesAssociatedRecord = records.coinAddress;
  if (coinAddressesAssociatedRecord) {
    calls.push(
      coinAddressesAssociatedRecord.map(coinRecord => {
        // if (parseInt(coinRecord.address, 16) === 0) return undefined;
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
    calls.push(
      textAssociatedRecord.map(textRecord => {
        // if (textRecord.value.length === 0) return undefined;
        return resolver.encodeFunctionData('setText', [
          namehash,
          textRecord.key,
          textRecord.value,
        ]);
      })
    );
  }
  // flatten textrecords and addresses and remove undefined
  return calls.flat().filter(bytes => Boolean(bytes));
};

const getENSExecutionDetails = (
  name: string,
  ensRegistrationStepType: ENSRegistrationStepType,
  accountAddress?: string,
  rentPrice?: string,
  duration?: number,
  recordKey?: string,
  recordValue?: string
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
    case ENSRegistrationStepType.SET_TEXT: {
      methodNames = ['setText'];
      const namehash = hash(name);
      args = [namehash, recordKey, recordValue];
      contract = getENSPublicResolverContract();
      break;
    }
    case ENSRegistrationStepType.MULTICALL: {
      methodNames = ['multicall'];
      contract = getENSPublicResolverContract();
      const data =
        setupMulticallRecords(
          name,
          {
            coinAddress: null,
            contentHash: null,
            ensAssociatedAddress: null,
            text: [{ key: 'name', value: 'blabla' }],
          },
          contract
        ) || [];
      args = [data];
      break;
    }
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
