import { formatsByName } from '@ensdomains/address-encoder';
import { hash } from '@ensdomains/eth-ens-namehash';
import { BigNumberish, Contract, Wallet } from 'ethers';
import lang from 'i18n-js';
import { atom } from 'recoil';
import { InlineFieldProps } from '../components/inputs/InlineField';
import {
  add,
  addBuffer,
  convertAmountAndPriceToNativeDisplay,
  divide,
  fromWei,
  multiply,
} from './utilities';
import { ENSRegistrationRecords } from '@rainbow-me/entities';
import { toHex, web3Provider } from '@rainbow-me/handlers/web3';
import { gweiToWei } from '@rainbow-me/parsers';
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
import { colors } from '@rainbow-me/styles';
import { labelhash } from '@rainbow-me/utils';

export enum ENSRegistrationTransactionType {
  COMMIT = 'commit',
  REGISTER_WITH_CONFIG = 'registerWithConfig',
  SET_TEXT = 'setText',
  SET_NAME = 'setName',
  MULTICALL = 'multicall',
}

enum ENS_RECORDS {
  ETH = 'ETH',
  BTC = 'BTC',
  LTC = 'LTC',
  DOGE = 'DOGE',
  displayName = 'me.rainbow.displayName',
  cover = 'me.rainbow.cover',
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
  instagram = 'com.instagram',
  snapchat = 'com.snapchat',
  twitter = 'com.twitter',
  telegram = 'com.telegram',
  ensDelegate = 'eth.ens.delegate',
}

export type TextRecordField = {
  id: string;
  key: string;
  label: InlineFieldProps['label'];
  placeholder: InlineFieldProps['placeholder'];
  inputProps?: InlineFieldProps['inputProps'];
  validations?: InlineFieldProps['validations'];
};

const textRecordFields = {
  [ENS_RECORDS.displayName]: {
    id: 'name',
    inputProps: {
      maxLength: 50,
    },
    key: ENS_RECORDS.displayName,
    label: lang.t('profiles.create.name'),
    placeholder: lang.t('profiles.create.name_placeholder'),
  },
  [ENS_RECORDS.description]: {
    id: 'bio',
    inputProps: {
      maxLength: 100,
      multiline: true,
    },
    key: ENS_RECORDS.description,
    label: lang.t('profiles.create.bio'),
    placeholder: lang.t('profiles.create.bio_placeholder'),
  },
  [ENS_RECORDS.twitter]: {
    id: 'twitter',
    inputProps: {
      maxLength: 16,
    },
    key: ENS_RECORDS.twitter,
    label: 'Twitter',
    placeholder: lang.t('profiles.create.username_placeholder'),
    validations: {
      allowCharacterRegex: {
        match: /^@?\w*$/,
      },
    },
  },
  [ENS_RECORDS.email]: {
    id: 'email',
    inputProps: {
      maxLength: 50,
    },
    key: ENS_RECORDS.email,
    label: 'Email',
    placeholder: 'Add your email',
  },
  [ENS_RECORDS.url]: {
    id: 'website',
    inputProps: {
      keyboardType: 'url',
      maxLength: 100,
    },
    key: ENS_RECORDS.url,
    label: lang.t('profiles.create.website'),
    placeholder: lang.t('profiles.create.website_placeholder'),
  },
  [ENS_RECORDS.github]: {
    id: 'github',
    inputProps: {
      maxLength: 20,
    },
    key: ENS_RECORDS.github,
    label: 'Github',
    placeholder: lang.t('profiles.create.username_placeholder'),
  },
  [ENS_RECORDS.instagram]: {
    id: 'instagram',
    inputProps: {
      maxLength: 30,
    },
    key: ENS_RECORDS.instagram,
    label: 'Instagram',
    placeholder: lang.t('profiles.create.username_placeholder'),
    validations: {
      allowCharacterRegex: {
        match: /^@?([\w.])*$/,
      },
    },
  },
  [ENS_RECORDS.snapchat]: {
    id: 'snapchat',
    inputProps: {
      maxLength: 16,
    },
    key: ENS_RECORDS.snapchat,
    label: 'Snapchat',
    placeholder: lang.t('profiles.create.username_placeholder'),
    validations: {
      allowCharacterRegex: {
        match: /^@?([\w.])*$/,
      },
    },
  },
  [ENS_RECORDS.discord]: {
    id: 'discord',
    inputProps: {
      maxLength: 50,
    },
    key: ENS_RECORDS.discord,
    label: 'Discord',
    placeholder: lang.t('profiles.create.username_placeholder'),
  },
} as const;

export const ENS_DOMAIN = '.eth';

const getENSRegistrarControllerContract = (
  wallet?: Wallet,
  registrarAddress?: string
) => {
  return new Contract(
    registrarAddress || ensETHRegistrarControllerAddress,
    ENSETHRegistrarControllerABI,
    wallet || web3Provider
  );
};
const getENSPublicResolverContract = (wallet?: Wallet) => {
  return new Contract(
    ensPublicResolverAddress,
    ENSPublicResolverABI,
    wallet || web3Provider
  );
};

const getENSReverseRegistrarContract = (wallet?: Wallet) => {
  return new Contract(
    ensReverseRegistrarAddress,
    ENSReverseRegistrarABI,
    wallet || web3Provider
  );
};

const getENSBaseRegistrarImplementationContract = (wallet?: Wallet) => {
  return new Contract(
    ensBaseRegistrarImplementationAddress,
    ENSBaseRegistrarImplementationABI,
    wallet || web3Provider
  );
};

const getENSRegistryContract = () => {
  return new Contract(
    ensRegistryAddress,
    ENSRegistryWithFallbackABI,
    web3Provider
  );
};

const getResolver = async (name: string): Promise<string> =>
  getENSRegistryContract().resolver(name);

const getAvailable = async (name: string): Promise<boolean> =>
  getENSRegistrarControllerContract().available(name);

const getNameExpires = async (name: string): Promise<string> =>
  getENSBaseRegistrarImplementationContract().nameExpires(labelhash(name));

const getRentPrice = async (name: string, duration: number): Promise<any> =>
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
      textAssociatedRecord
        .filter(textRecord => Boolean(textRecord.value))
        .map(textRecord => {
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

export const generateSalt = () => {
  const random = new Uint8Array(32);
  crypto.getRandomValues(random);
  const salt =
    '0x' +
    Array.from(random)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  return salt;
};

const getENSExecutionDetails = async ({
  name,
  type,
  ownerAddress,
  salt,
  rentPrice,
  duration,
  records,
  wallet,
}: {
  name?: string;
  type: ENSRegistrationTransactionType;
  ownerAddress?: string;
  rentPrice?: string;
  duration?: number;
  records?: ENSRegistrationRecords;
  wallet?: Wallet;
  salt?: string;
}): Promise<{
  methodArguments: any[] | null;
  value: BigNumberish | null;
  contract: Contract | null;
}> => {
  let args: any[] | null = null;
  let value: string | null = null;
  let contract: Contract | null = null;

  switch (type) {
    case ENSRegistrationTransactionType.COMMIT: {
      if (!name || !ownerAddress) throw new Error('Bad arguments for commit');
      const registrarController = getENSRegistrarControllerContract(wallet);
      const commitment = await registrarController.makeCommitmentWithConfig(
        name.replace(ENS_DOMAIN, ''),
        ownerAddress,
        salt,
        ensPublicResolverAddress,
        ownerAddress
      );
      args = [commitment];
      contract = registrarController;
      break;
    }
    case ENSRegistrationTransactionType.REGISTER_WITH_CONFIG: {
      if (!name || !ownerAddress || !duration || !rentPrice)
        throw new Error('Bad arguments for registerWithConfig');
      value = toHex(addBuffer(rentPrice, 1.2));
      args = [
        name.replace(ENS_DOMAIN, ''),
        ownerAddress,
        duration,
        salt,
        ensPublicResolverAddress,
        ownerAddress,
      ];
      contract = getENSRegistrarControllerContract(wallet);
      break;
    }
    case ENSRegistrationTransactionType.SET_TEXT: {
      if (!name || !records || !records?.text?.[0])
        throw new Error('Bad arguments for setText');
      const record = records?.text[0];
      const namehash = hash(name);
      args = [namehash, record.key, record.value];
      contract = getENSPublicResolverContract(wallet);
      break;
    }
    case ENSRegistrationTransactionType.MULTICALL: {
      if (!name || !records) throw new Error('Bad arguments for multicall');
      contract = getENSPublicResolverContract(wallet);
      const data = setupMulticallRecords(name, records, contract) || [];
      args = [data];
      break;
    }
    case ENSRegistrationTransactionType.SET_NAME:
      if (!name) throw new Error('Bad arguments for setName');
      args = [name];
      contract = getENSReverseRegistrarContract(wallet);
      break;
  }
  return {
    contract,
    methodArguments: args,
    value,
  };
};

const getENSRecordKeys = () => Object.keys(ENS_RECORDS);
const getENSRecordValues = () => Object.values(ENS_RECORDS);

const formatEstimatedNetworkFee = (
  gasLimit: string,
  maxBaseFee: string,
  maxPriorityFee: string,
  nativeCurrency: any,
  nativeAssetPrice: any
) => {
  const networkFeeInWei = multiply(
    gweiToWei(add(maxBaseFee, maxPriorityFee)),
    gasLimit
  );
  const networkFeeInEth = fromWei(networkFeeInWei);

  const { amount, display } = convertAmountAndPriceToNativeDisplay(
    networkFeeInEth,
    nativeAssetPrice,
    nativeCurrency
  );

  return {
    amount,
    display,
    wei: networkFeeInWei,
  };
};

const formatTotalRegistrationCost = (
  wei: string,
  nativeCurrency: any,
  nativeAssetPrice: any,
  skipDecimals: boolean = false
) => {
  const networkFeeInEth = fromWei(wei);

  const { amount, display } = convertAmountAndPriceToNativeDisplay(
    networkFeeInEth,
    nativeAssetPrice,
    nativeCurrency,
    undefined,
    skipDecimals
  );

  return {
    amount,
    display,
    wei,
  };
};

const getRentPricePerYear = (rentPrice: string, duration: number) =>
  divide(rentPrice, duration);

const formatRentPrice = (
  rentPrice: BigNumberish,
  duration: number,
  nativeCurrency: any,
  nativeAssetPrice: any
) => {
  const rentPriceInETH = fromWei(rentPrice.toString());
  const rentPricePerYear = getRentPricePerYear(rentPriceInETH, duration);
  const rentPricePerYearInWei = divide(rentPrice.toString(), duration);

  const { amount, display } = convertAmountAndPriceToNativeDisplay(
    rentPriceInETH,
    nativeAssetPrice,
    nativeCurrency,
    undefined,
    true
  );
  const {
    display: displayPerYear,
    amount: amountPerYear,
  } = convertAmountAndPriceToNativeDisplay(
    rentPricePerYear,
    nativeAssetPrice,
    nativeCurrency,
    undefined,
    true
  );

  return {
    perYear: {
      amount: amountPerYear,
      display: displayPerYear,
      wei: rentPricePerYearInWei,
    },
    total: {
      amount,
      display,
    },
    wei: rentPrice,
  };
};

const accentColorAtom = atom({
  default: colors.appleBlue,
  key: 'ens.accentColor',
});

export {
  ENS_RECORDS,
  getENSRecordKeys,
  getENSRecordValues,
  getENSRegistryContract,
  getENSRegistrarControllerContract,
  getENSBaseRegistrarImplementationContract,
  getENSPublicResolverContract,
  getENSReverseRegistrarContract,
  getResolver,
  getAvailable,
  getNameExpires,
  getRentPrice,
  textRecordFields,
  getENSExecutionDetails,
  formatEstimatedNetworkFee,
  formatTotalRegistrationCost,
  formatRentPrice,
  accentColorAtom,
};
