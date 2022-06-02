import { formatsByName } from '@ensdomains/address-encoder';
import { hash } from '@ensdomains/eth-ens-namehash';
import { Wallet } from '@ethersproject/wallet';
import { BigNumberish, Contract } from 'ethers';
import lang from 'i18n-js';
import { atom } from 'recoil';
import { InlineFieldProps } from '../components/inputs/InlineField';
import {
  add,
  addBuffer,
  convertAmountAndPriceToNativeDisplay,
  divide,
  fromWei,
  handleSignificantDecimals,
  multiply,
} from './utilities';
import { ENSRegistrationRecords, EthereumAddress } from '@rainbow-me/entities';
import { getProviderForNetwork, toHex } from '@rainbow-me/handlers/web3';
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
import {
  encodeContenthash,
  isValidContenthash,
} from '@rainbow-me/utils/contenthash';

export const ENS_SECONDS_WAIT = 60;

export enum ENSRegistrationTransactionType {
  COMMIT = 'commit',
  REGISTER_WITH_CONFIG = 'registerWithConfig',
  RENEW = 'renew',
  SET_TEXT = 'setText',
  SET_NAME = 'setName',
  MULTICALL = 'multicall',
}

export enum ENS_RECORDS {
  ETH = 'ETH',
  BTC = 'BTC',
  LTC = 'LTC',
  DOGE = 'DOGE',
  displayName = 'me.rainbow.displayName',
  cover = 'cover',
  content = 'content',
  url = 'url',
  email = 'email',
  website = 'website',
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
  telegram = 'org.telegram',
  ensDelegate = 'eth.ens.delegate',
  pronouns = 'pronouns',
}

export enum REGISTRATION_STEPS {
  COMMIT = 'COMMIT',
  EDIT = 'EDIT',
  REGISTER = 'REGISTER',
  RENEW = 'RENEW',
  SET_NAME = 'SET_NAME',
  WAIT_COMMIT_CONFIRMATION = 'WAIT_COMMIT_CONFIRMATION',
  WAIT_ENS_COMMITMENT = 'WAIT_ENS_COMMITMENT',
}

export enum REGISTRATION_MODES {
  CREATE = 'CREATE',
  EDIT = 'EDIT',
  RENEW = 'RENEW',
  SET_NAME = 'SET_NAME',
}

export type TextRecordField = {
  id: string;
  key: ENS_RECORDS;
  label: InlineFieldProps['label'];
  placeholder: InlineFieldProps['placeholder'];
  inputProps?: InlineFieldProps['inputProps'];
  validations?: InlineFieldProps['validations'] & {
    onSubmit?: {
      match?: {
        value: RegExp;
        message: string;
      };
      validate?: {
        callback: (value: string) => boolean;
        message: string;
      };
    };
  };
  startsWith?: string;
};

export const textRecordFields = {
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
  [ENS_RECORDS.url]: {
    id: 'website',
    inputProps: {
      keyboardType: 'url',
      maxLength: 100,
    },
    key: ENS_RECORDS.url,
    label: lang.t('profiles.create.website'),
    placeholder: lang.t('profiles.create.website_placeholder'),
    validations: {
      onSubmit: {
        match: {
          message: lang.t('profiles.create.website_submit_message'),
          value: /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/,
        },
      },
    },
  },
  [ENS_RECORDS.twitter]: {
    id: 'twitter',
    inputProps: {
      maxLength: 16,
    },
    key: ENS_RECORDS.twitter,
    label: lang.t('profiles.create.twitter'),
    placeholder: lang.t('profiles.create.username_placeholder'),
    startsWith: '@',
    validations: {
      onChange: {
        match: /^\w*$/,
      },
    },
  },
  [ENS_RECORDS.email]: {
    id: 'email',
    inputProps: {
      maxLength: 50,
    },
    key: ENS_RECORDS.email,
    label: lang.t('profiles.create.email'),
    placeholder: lang.t('profiles.create.email_placeholder'),
    validations: {
      onSubmit: {
        match: {
          message: lang.t('profiles.create.email_submit_message'),
          value: /^\S+@\S+\.\S+$/,
        },
      },
    },
  },
  [ENS_RECORDS.instagram]: {
    id: 'instagram',
    inputProps: {
      maxLength: 30,
    },
    key: ENS_RECORDS.instagram,
    label: lang.t('profiles.create.instagram'),
    placeholder: lang.t('profiles.create.username_placeholder'),
    startsWith: '@',
    validations: {
      onChange: {
        match: /^([\w.])*$/,
      },
    },
  },
  [ENS_RECORDS.discord]: {
    id: 'discord',
    inputProps: {
      maxLength: 50,
    },
    key: ENS_RECORDS.discord,
    label: lang.t('profiles.create.discord'),
    placeholder: lang.t('profiles.create.username_placeholder'),
    startsWith: '@',
  },
  [ENS_RECORDS.github]: {
    id: 'github',
    inputProps: {
      maxLength: 20,
    },
    key: ENS_RECORDS.github,
    label: lang.t('profiles.create.github'),
    placeholder: lang.t('profiles.create.username_placeholder'),
  },
  [ENS_RECORDS.BTC]: {
    id: 'btc',
    inputProps: {
      maxLength: 42,
      multiline: true,
    },
    key: ENS_RECORDS.BTC,
    label: lang.t('profiles.create.btc'),
    placeholder: lang.t('profiles.create.wallet_placeholder', {
      coin: lang.t('profiles.create.btc'),
    }),
    validations: {
      onSubmit: {
        validate: {
          callback: value => validateCoinRecordValue(value, ENS_RECORDS.BTC),
          message: lang.t('profiles.create.invalid_asset', {
            coin: ENS_RECORDS.BTC,
          }),
        },
      },
    },
  },
  [ENS_RECORDS.snapchat]: {
    id: 'snapchat',
    inputProps: {
      maxLength: 16,
    },
    key: ENS_RECORDS.snapchat,
    label: lang.t('profiles.create.snapchat'),
    placeholder: lang.t('profiles.create.username_placeholder'),
    startsWith: '@',
    validations: {
      onChange: {
        match: /^([\w.])*$/,
      },
    },
  },
  [ENS_RECORDS.telegram]: {
    id: 'telegram',
    inputProps: {
      maxLength: 30,
    },
    key: ENS_RECORDS.telegram,
    label: lang.t('profiles.create.telegram'),
    placeholder: lang.t('profiles.create.username_placeholder'),
    startsWith: '@',
  },
  [ENS_RECORDS.reddit]: {
    id: 'reddit',
    inputProps: {
      maxLength: 30,
    },
    key: ENS_RECORDS.reddit,
    label: lang.t('profiles.create.reddit'),
    placeholder: lang.t('profiles.create.username_placeholder'),
    startsWith: '@',
  },
  [ENS_RECORDS.pronouns]: {
    id: 'pronouns',
    inputProps: {
      maxLength: 42,
    },
    key: ENS_RECORDS.pronouns,
    label: lang.t('profiles.create.pronouns'),
    placeholder: lang.t('profiles.create.pronouns_placeholder'),
  },
  [ENS_RECORDS.notice]: {
    id: 'notice',
    inputProps: {
      maxLength: 100,
    },
    key: ENS_RECORDS.notice,
    label: lang.t('profiles.create.notice'),
    placeholder: lang.t('profiles.create.notice_placeholder'),
  },
  [ENS_RECORDS.keywords]: {
    id: 'keywords',
    inputProps: {
      maxLength: 100,
    },
    key: ENS_RECORDS.keywords,
    label: lang.t('profiles.create.keywords'),
    placeholder: lang.t('profiles.create.keywords_placeholder'),
  },
  [ENS_RECORDS.LTC]: {
    id: 'ltc',
    inputProps: {
      maxLength: 64,
    },
    key: ENS_RECORDS.LTC,
    label: lang.t('profiles.create.ltc'),
    placeholder: lang.t('profiles.create.wallet_placeholder', {
      coin: lang.t('profiles.create.ltc'),
    }),
    validations: {
      onSubmit: {
        validate: {
          callback: value => validateCoinRecordValue(value, ENS_RECORDS.LTC),
          message: lang.t('profiles.create.invalid_asset', {
            coin: ENS_RECORDS.LTC,
          }),
        },
      },
    },
  },
  [ENS_RECORDS.DOGE]: {
    id: 'doge',
    inputProps: {
      maxLength: 34,
    },
    key: ENS_RECORDS.DOGE,
    label: lang.t('profiles.create.doge'),
    placeholder: lang.t('profiles.create.wallet_placeholder', {
      coin: lang.t('profiles.create.doge'),
    }),
    validations: {
      onSubmit: {
        validate: {
          callback: value => validateCoinRecordValue(value, ENS_RECORDS.DOGE),
          message: lang.t('profiles.create.invalid_asset', {
            coin: ENS_RECORDS.DOGE,
          }),
        },
      },
    },
  },
  [ENS_RECORDS.content]: {
    id: 'content',
    inputProps: {},
    key: ENS_RECORDS.content,
    label: lang.t('profiles.create.content'),
    placeholder: lang.t('profiles.create.content_placeholder'),
    validations: {
      onSubmit: {
        validate: {
          callback: value => validateContentHashRecordValue(value),
          message: lang.t('profiles.create.invalid_content_hash'),
        },
      },
    },
  },
} as {
  [key in ENS_RECORDS]?: TextRecordField;
};

export const ENS_DOMAIN = '.eth';

const getENSRegistrarControllerContract = async (
  wallet?: Wallet,
  registrarAddress?: string
) => {
  const signerOrProvider = wallet || (await getProviderForNetwork());
  return new Contract(
    registrarAddress || ensETHRegistrarControllerAddress,
    ENSETHRegistrarControllerABI,
    signerOrProvider
  );
};

const getENSPublicResolverContract = async (
  wallet?: Wallet,
  resolverAddress?: EthereumAddress
) => {
  const signerOrProvider = wallet || (await getProviderForNetwork());
  return new Contract(
    resolverAddress || ensPublicResolverAddress,
    ENSPublicResolverABI,
    signerOrProvider
  );
};

const getENSReverseRegistrarContract = async (wallet?: Wallet) => {
  const signerOrProvider = wallet || (await getProviderForNetwork());
  return new Contract(
    ensReverseRegistrarAddress,
    ENSReverseRegistrarABI,
    signerOrProvider
  );
};

const getENSBaseRegistrarImplementationContract = async (wallet?: Wallet) => {
  const signerOrProvider = wallet || (await getProviderForNetwork());
  return new Contract(
    ensBaseRegistrarImplementationAddress,
    ENSBaseRegistrarImplementationABI,
    signerOrProvider
  );
};

const getENSRegistryContract = async () => {
  const provider = await getProviderForNetwork();
  return new Contract(ensRegistryAddress, ENSRegistryWithFallbackABI, provider);
};

const getAvailable = async (name: string): Promise<boolean> => {
  const contract = await getENSRegistrarControllerContract();
  return contract.available(name);
};

const getNameExpires = async (name: string): Promise<string> => {
  const contract = await getENSBaseRegistrarImplementationContract();
  return contract.nameExpires(labelhash(name));
};

const getNameOwner = async (name: string): Promise<string> => {
  const contract = await getENSRegistryContract();
  return contract.owner(hash(name));
};

const getRentPrice = async (name: string, duration: number): Promise<any> => {
  const contract = await getENSRegistrarControllerContract();
  return contract.rentPrice(name, duration);
};

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

const getENSExecutionDetails = async ({
  name,
  type,
  ownerAddress,
  salt,
  rentPrice,
  duration,
  records,
  wallet,
  resolverAddress,
}: {
  name?: string;
  type: ENSRegistrationTransactionType;
  ownerAddress?: string;
  rentPrice?: string;
  duration?: number;
  records?: ENSRegistrationRecords;
  wallet?: Wallet;
  salt?: string;
  resolverAddress?: EthereumAddress;
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
      const registrarController = await getENSRegistrarControllerContract(
        wallet
      );
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
    case ENSRegistrationTransactionType.MULTICALL: {
      if (!name || !records) throw new Error('Bad arguments for multicall');
      contract = await getENSPublicResolverContract(wallet, resolverAddress);
      const data = setupMulticallRecords(name, records, contract) || [];
      args = [data];
      break;
    }
    case ENSRegistrationTransactionType.REGISTER_WITH_CONFIG: {
      if (!name || !ownerAddress || !duration || !rentPrice)
        throw new Error('Bad arguments for registerWithConfig');
      value = toHex(addBuffer(rentPrice, 1.1));
      args = [
        name.replace(ENS_DOMAIN, ''),
        ownerAddress,
        duration,
        salt,
        ensPublicResolverAddress,
        ownerAddress,
      ];
      contract = await getENSRegistrarControllerContract(wallet);
      break;
    }
    case ENSRegistrationTransactionType.RENEW: {
      if (!name || !duration || !rentPrice)
        throw new Error('Bad arguments for renew');
      value = toHex(addBuffer(rentPrice, 1.1));
      args = [name.replace(ENS_DOMAIN, ''), duration];
      contract = await getENSRegistrarControllerContract(wallet);
      break;
    }
    case ENSRegistrationTransactionType.SET_NAME:
      if (!name) throw new Error('Bad arguments for setName');
      args = [name];
      contract = await getENSReverseRegistrarContract(wallet);
      break;
    case ENSRegistrationTransactionType.SET_TEXT: {
      if (!name || !records || !records?.text?.[0])
        throw new Error('Bad arguments for setText');
      const record = records?.text[0];
      const namehash = hash(name);
      args = [namehash, record.key, record.value];
      contract = await getENSPublicResolverContract(wallet, resolverAddress);
      break;
    }
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
  const eth = handleSignificantDecimals(networkFeeInEth, 3);

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
    eth,
    wei,
  };
};

const validateCoinRecordValue = (value: string, coin: string) => {
  try {
    formatsByName[coin].decoder(value);
    return true;
  } catch (e) {
    return false;
  }
};

const validateContentHashRecordValue = (value: string) => {
  const { encoded, error: encodeError } = encodeContenthash(value);
  if (!encodeError && encoded) {
    return isValidContenthash(encoded);
  } else {
    return false;
  }
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
  default: colors.purple,
  key: 'ens.accentColor',
});

export {
  generateSalt,
  getENSRecordKeys,
  getENSRecordValues,
  getENSRegistryContract,
  getENSRegistrarControllerContract,
  getENSBaseRegistrarImplementationContract,
  getENSPublicResolverContract,
  getENSReverseRegistrarContract,
  getAvailable,
  getNameExpires,
  getNameOwner,
  getRentPrice,
  getENSExecutionDetails,
  formatEstimatedNetworkFee,
  formatTotalRegistrationCost,
  formatRentPrice,
  accentColorAtom,
};
