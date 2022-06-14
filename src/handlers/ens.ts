import { formatsByCoinType, formatsByName } from '@ensdomains/address-encoder';
import { Resolver } from '@ethersproject/providers';
import { captureException } from '@sentry/react-native';
import { Duration, sub } from 'date-fns';
import { isZeroAddress } from 'ethereumjs-util';
import { BigNumber } from 'ethers';
import { debounce, isEmpty, sortBy } from 'lodash';
import { ensClient } from '../apollo/client';
import {
  ENS_ACCOUNT_REGISTRATIONS,
  ENS_ALL_ACCOUNT_REGISTRATIONS,
  ENS_DOMAINS,
  ENS_GET_COIN_TYPES,
  ENS_GET_NAME_FROM_LABELHASH,
  ENS_GET_RECORDS,
  ENS_GET_REGISTRATION,
  ENS_REGISTRATIONS,
  ENS_SUGGESTIONS,
  EnsAccountRegistratonsData,
  EnsGetCoinTypesData,
  EnsGetNameFromLabelhash,
  EnsGetRecordsData,
  EnsGetRegistrationData,
} from '../apollo/queries';
import { ensProfileImagesQueryKey } from '../hooks/useENSProfileImages';
import { ENSActionParameters } from '../raps/common';
import { estimateGasWithPadding, getProviderForNetwork } from './web3';
import {
  ENSRegistrationRecords,
  Records,
  UniqueAsset,
} from '@rainbow-me/entities';
import {
  ENS_DOMAIN,
  ENS_RECORDS,
  ENSRegistrationTransactionType,
  generateSalt,
  getENSExecutionDetails,
  getNameOwner,
} from '@rainbow-me/helpers/ens';
import { add } from '@rainbow-me/helpers/utilities';
import { ImgixImage } from '@rainbow-me/images';
import { handleAndSignImages } from '@rainbow-me/parsers';
import { queryClient } from '@rainbow-me/react-query/queryClient';
import {
  ENS_NFT_CONTRACT_ADDRESS,
  ensPublicResolverAddress,
  ethUnits,
} from '@rainbow-me/references';
import { labelhash, logger, profileUtils } from '@rainbow-me/utils';
import { AvatarResolver } from 'ens-avatar';

const DUMMY_RECORDS = {
  'cover':
    'https://cloudflare-ipfs.com/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco/I/m/Vincent_van_Gogh_-_Self-Portrait_-_Google_Art_Project_(454045).jpg',
  'description': 'description',
  'me.rainbow.displayName': 'name',
};

const buildEnsToken = ({
  contractAddress,
  tokenId,
  name,
  imageUrl: imageUrl_,
}: {
  contractAddress: string;
  tokenId: string;
  name: string;
  imageUrl: string;
}) => {
  // @ts-expect-error JavaScript function
  const { imageUrl, lowResUrl } = handleAndSignImages(imageUrl_);
  return {
    animation_url: null,
    asset_contract: {
      address: contractAddress,
      name: 'ENS',
      nft_version: '3.0',
      schema_name: 'ERC721',
      symbol: 'ENS',
      total_supply: null,
    },
    background: null,
    collection: {
      description:
        'Ethereum Name Service (ENS) domains are secure domain names for the decentralized world. ENS domains provide a way for users to map human readable names to blockchain and non-blockchain resources, like Ethereum addresses, IPFS hashes, or website URLs. ENS domains can be bought and sold on secondary markets.',
      discord_url: null,
      external_url: 'https://ens.domains',
      featured_image_url:
        'https://lh3.googleusercontent.com/BBj09xD7R4bBtg1lgnAAS9_TfoYXKwMtudlk-0fVljlURaK7BWcARCpkM-1LGNGTAcsGO6V1TgrtmQFvCo8uVYW_QEfASK-9j6Nr=s300',
      hidden: false,
      image_url:
        'https://lh3.googleusercontent.com/0cOqWoYA7xL9CkUjGlxsjreSYBdrUBE0c6EO1COG4XE8UeP-Z30ckqUNiL872zHQHQU5MUNMNhfDpyXIP17hRSC5HQ=s60',
      name: 'ENS: Ethereum Name Service',
      short_description: null,
      slug: 'ens',
      twitter_username: 'ensdomains',
    },
    currentPrice: null,
    description: `\`${name}\`, an ENS name.`,
    external_link: `https://app.ens.domains/search/${name}`,
    familyImage:
      'https://lh3.googleusercontent.com/0cOqWoYA7xL9CkUjGlxsjreSYBdrUBE0c6EO1COG4XE8UeP-Z30ckqUNiL872zHQHQU5MUNMNhfDpyXIP17hRSC5HQ=s60',
    familyName: 'ENS',
    id: tokenId,
    image_original_url: imageUrl,
    image_url: imageUrl,
    isSendable: true,
    last_sale: null,
    lastPrice: null,
    lastPriceUsd: null,
    lastSale: undefined,
    lastSalePaymentToken: null,
    lowResUrl,
    name,
    permalink: '',
    sell_orders: [],
    traits: [],
    type: 'nft',
    uniqueId: name,
    urlSuffixForAsset: `${contractAddress}/${tokenId}`,
  } as UniqueAsset;
};

export const isUnknownOpenSeaENS = (asset?: any) =>
  asset?.description?.includes('This is an unknown ENS name with the hash') ||
  !asset?.uniqueId?.includes('.eth') ||
  !asset?.image_url ||
  false;

export const fetchMetadata = async ({
  contractAddress = ENS_NFT_CONTRACT_ADDRESS,
  tokenId,
}: {
  contractAddress?: string;
  tokenId: string;
}) => {
  try {
    const { data } = await ensClient.query<EnsGetNameFromLabelhash>({
      query: ENS_GET_NAME_FROM_LABELHASH,
      variables: {
        labelhash: BigNumber.from(tokenId).toHexString(),
      },
    });
    const name = data.domains[0].labelName;
    const image_url = `https://metadata.ens.domains/mainnet/${contractAddress}/${tokenId}/image`;
    return { image_url, name: `${name}.eth` };
  } catch (error) {
    logger.sentry('ENS: Error getting ENS metadata', error);
    captureException(new Error('ENS: Error getting ENS metadata'));
    throw error;
  }
};

export const fetchEnsTokens = async ({
  address,
  contractAddress = ENS_NFT_CONTRACT_ADDRESS,
  timeAgo,
}: {
  address: string;
  contractAddress?: string;
  timeAgo: Duration;
}) => {
  try {
    const { data } = await ensClient.query<EnsAccountRegistratonsData>({
      query: ENS_ACCOUNT_REGISTRATIONS,
      variables: {
        address: address.toLowerCase(),
        registrationDate_gt: Math.floor(
          sub(new Date(), timeAgo).getTime() / 1000
        ).toString(),
      },
    });
    return data.account.registrations.map(registration => {
      const tokenId = BigNumber.from(registration.domain.labelhash).toString();
      const token = buildEnsToken({
        contractAddress,
        imageUrl: `https://metadata.ens.domains/mainnet/${contractAddress}/${tokenId}/image`,
        name: registration.domain.name,
        tokenId,
      });
      return token;
    });
  } catch (error) {
    logger.sentry('ENS: Error getting ENS unique tokens', error);
    captureException(new Error('ENS: Error getting ENS unique tokens'));
    return [];
  }
};

export const fetchSuggestions = async (
  recipient: any,
  setSuggestions: any,
  setIsFetching = (_unused: any) => {},
  profilesEnabled = false
) => {
  if (recipient.length > 2) {
    let suggestions: {
      address: any;
      color: number | null;
      ens: boolean;
      image: any;
      network: string;
      nickname: any;
      uniqueId: any;
    }[] = [];
    setIsFetching(true);
    const recpt = recipient.toLowerCase();
    let result = await ensClient.query({
      query: ENS_SUGGESTIONS,
      variables: {
        amount: 8,
        name: recpt,
      },
    });
    if (!isEmpty(result?.data?.domains)) {
      const domains = await Promise.all(
        result?.data?.domains
          .filter(
            (domain: { owner: { id: string } }) =>
              !isZeroAddress(domain.owner.id)
          )
          .map(
            async (domain: {
              name: string;
              resolver: { texts: string[] };
              owner: { id: string };
            }) => {
              const hasAvatar = domain?.resolver?.texts?.find(
                text => text === ENS_RECORDS.avatar
              );
              if (!!hasAvatar && profilesEnabled) {
                try {
                  const images = await fetchImages(domain.name);
                  queryClient.setQueryData(
                    ensProfileImagesQueryKey(domain.name),
                    images
                  );
                  return {
                    ...domain,
                    avatar: images.avatarUrl,
                  };
                  // eslint-disable-next-line no-empty
                } catch (e) {}
              }
              return domain;
            }
          )
      );
      const ensSuggestions = domains
        .map((ensDomain: any) => ({
          address: ensDomain?.resolver?.addr?.id || ensDomain?.name,
          color: profileUtils.addressHashedColorIndex(
            ensDomain?.resolver?.addr?.id || ensDomain.name
          ),
          ens: true,
          image: ensDomain?.avatar,
          network: 'mainnet',
          nickname: ensDomain?.name,
          uniqueId: ensDomain?.resolver?.addr?.id || ensDomain.name,
        }))
        .filter((domain: any) => !domain?.nickname?.includes?.('['));
      suggestions = sortBy(ensSuggestions, domain => domain.nickname.length, [
        'asc',
      ]);
    }
    setSuggestions(suggestions);
    setIsFetching(false);

    return suggestions;
  }
};

export const debouncedFetchSuggestions = debounce(fetchSuggestions, 200);

export const fetchRegistrationDate = async (recipient: string) => {
  if (recipient.length > 2) {
    const recpt = recipient.toLowerCase();
    const result = await ensClient.query({
      query: ENS_DOMAINS,
      variables: {
        name: recpt,
      },
    });
    const labelHash = result?.data?.domains?.[0]?.labelhash;
    const registrations = await ensClient.query({
      query: ENS_REGISTRATIONS,
      variables: {
        labelHash,
      },
    });

    const { registrationDate } = registrations?.data?.registrations?.[0] || {
      registrationDate: null,
    };

    return registrationDate;
  }
};

export const fetchAccountRegistrations = async (address: string) => {
  const registrations = await ensClient.query<EnsAccountRegistratonsData>({
    query: ENS_ALL_ACCOUNT_REGISTRATIONS,
    variables: {
      address: address?.toLowerCase(),
    },
  });
  return registrations;
};

export const fetchImages = async (ensName: string) => {
  let avatarUrl;
  let coverUrl;
  const provider = await getProviderForNetwork();
  try {
    const avatarResolver = new AvatarResolver(provider);
    [avatarUrl, coverUrl] = await Promise.all([
      avatarResolver.getImage(ensName, {
        allowNonOwnerNFTs: true,
        type: 'avatar',
      }),
      avatarResolver.getImage(ensName, {
        allowNonOwnerNFTs: true,
        type: 'cover',
      }),
    ]);
    ImgixImage.preload([
      ...(avatarUrl ? [{ uri: avatarUrl }] : []),
      ...(coverUrl ? [{ uri: coverUrl }] : []),
    ]);
    // eslint-disable-next-line no-empty
  } catch (err) {}

  return {
    avatarUrl,
    coverUrl,
  };
};

export const fetchRecords = async (ensName: string) => {
  const response = await ensClient.query<EnsGetRecordsData>({
    query: ENS_GET_RECORDS,
    variables: {
      name: ensName,
    },
  });
  const data = response.data?.domains[0] || {};

  const provider = await getProviderForNetwork();
  const resolver = await provider.getResolver(ensName);
  const supportedRecords = Object.values(ENS_RECORDS);
  const rawRecordKeys: string[] = data.resolver?.texts || [];
  const recordKeys = (rawRecordKeys as ENS_RECORDS[]).filter(key =>
    supportedRecords.includes(key)
  );
  const recordValues = await Promise.all(
    recordKeys.map((key: string) => resolver?.getText(key))
  );
  const records = recordKeys.reduce((records, key, i) => {
    return {
      ...records,
      ...(recordValues[i] ? { [key]: recordValues[i] } : {}),
    };
  }, {}) as Partial<Records>;

  return records;
};

export const fetchCoinAddresses = async (
  ensName: string
): Promise<{ [key in ENS_RECORDS]: string }> => {
  const response = await ensClient.query<EnsGetCoinTypesData>({
    query: ENS_GET_COIN_TYPES,
    variables: {
      name: ensName,
    },
  });
  const data = response.data?.domains[0] || {};
  const supportedRecords = Object.values(ENS_RECORDS);
  const provider = await getProviderForNetwork();
  const resolver = await provider.getResolver(ensName);
  const rawCoinTypes: number[] = data.resolver?.coinTypes || [];
  const rawCoinTypesNames: string[] = rawCoinTypes.map(
    type => formatsByCoinType[type].name
  );
  const coinTypes: number[] =
    (rawCoinTypesNames as ENS_RECORDS[])
      .filter(name => supportedRecords.includes(name))
      .map(name => formatsByName[name].coinType) || [];

  const coinAddressValues = await Promise.all(
    coinTypes
      .map(async (coinType: number) => {
        try {
          return await resolver?.getAddress(coinType);
        } catch (err) {
          return undefined;
        }
      })
      .filter(Boolean)
  );
  const coinAddresses: { [key in ENS_RECORDS]: string } = coinTypes.reduce(
    (coinAddresses, coinType, i) => {
      return {
        ...coinAddresses,
        ...(coinAddressValues[i]
          ? { [formatsByCoinType[coinType].name]: coinAddressValues[i] }
          : {}),
      };
    },
    {} as { [key in ENS_RECORDS]: string }
  );
  return coinAddresses;
};

export const fetchOwner = async (ensName: string) => {
  const ownerAddress = await getNameOwner(ensName);

  let owner: { address?: string; name?: string } = {};
  if (ownerAddress) {
    const name = await fetchReverseRecord(ownerAddress);
    owner = {
      address: ownerAddress,
      name,
    };
  }

  return owner;
};

export const fetchRegistration = async (ensName: string) => {
  const response = await ensClient.query<EnsGetRegistrationData>({
    query: ENS_GET_REGISTRATION,
    variables: {
      id: labelhash(ensName.replace(ENS_DOMAIN, '')),
    },
  });
  const data = response.data?.registration || {};

  let registrant: { address?: string; name?: string } = {};
  if (data.registrant?.id) {
    const registrantAddress = data.registrant?.id;
    const name = await fetchReverseRecord(registrantAddress);
    registrant = {
      address: registrantAddress,
      name,
    };
  }

  return {
    registrant,
    registration: {
      expiryDate: data?.expiryDate,
      registrationDate: data?.registrationDate,
    },
  };
};

export const fetchPrimary = async (ensName: string) => {
  const provider = await getProviderForNetwork();
  const address = await provider.resolveName(ensName);
  return {
    address,
  };
};

export const fetchAccountPrimary = async (accountAddress: string) => {
  const ensName = await fetchReverseRecord(accountAddress);
  return {
    ensName,
  };
};

export const fetchProfile = async (ensName: string) => {
  const [
    resolver,
    records,
    coinAddresses,
    images,
    owner,
    { registrant, registration },
    primary,
  ] = await Promise.all([
    fetchResolver(ensName),
    fetchRecords(ensName),
    fetchCoinAddresses(ensName),
    fetchImages(ensName),
    fetchOwner(ensName),
    fetchRegistration(ensName),
    fetchPrimary(ensName),
  ]);

  const resolverData = {
    address: resolver?.address,
    type: resolver?.address === ensPublicResolverAddress ? 'default' : 'custom',
  };

  return {
    coinAddresses,
    images,
    owner,
    primary,
    records,
    registrant,
    registration,
    resolver: resolverData,
  };
};

export const fetchProfileRecords = async (ensName: string) => {
  const [records, coinAddresses, images] = await Promise.all([
    fetchRecords(ensName),
    fetchCoinAddresses(ensName),
    fetchImages(ensName),
  ]);

  return {
    coinAddresses,
    images,
    records,
  };
};

export const estimateENSCommitGasLimit = async ({
  name,
  ownerAddress,
  duration,
  rentPrice,
  salt,
}: ENSActionParameters) =>
  estimateENSTransactionGasLimit({
    duration,
    name,
    ownerAddress,
    rentPrice,
    salt,
    type: ENSRegistrationTransactionType.COMMIT,
  });

export const estimateENSMulticallGasLimit = async ({
  name,
  records,
  ownerAddress,
}: {
  name: string;
  records: ENSRegistrationRecords;
  ownerAddress?: string;
}) =>
  estimateENSTransactionGasLimit({
    name,
    ownerAddress,
    records,
    type: ENSRegistrationTransactionType.MULTICALL,
  });

export const estimateENSRegisterWithConfigGasLimit = async ({
  name,
  ownerAddress,
  duration,
  rentPrice,
  salt,
}: {
  name: string;
  ownerAddress: string;
  duration: number;
  rentPrice: string;
  salt: string;
}) =>
  estimateENSTransactionGasLimit({
    duration,
    name,
    ownerAddress,
    rentPrice,
    salt,
    type: ENSRegistrationTransactionType.REGISTER_WITH_CONFIG,
  });

export const estimateENSRenewGasLimit = async ({
  name,
  duration,
  rentPrice,
}: {
  name: string;
  duration: number;
  rentPrice: string;
}) =>
  estimateENSTransactionGasLimit({
    duration,
    name,
    rentPrice,
    type: ENSRegistrationTransactionType.RENEW,
  });

export const estimateENSSetNameGasLimit = async ({
  name,
  ownerAddress,
}: {
  name: string;
  ownerAddress: string;
}) =>
  estimateENSTransactionGasLimit({
    name,
    ownerAddress,
    type: ENSRegistrationTransactionType.SET_NAME,
  });

export const estimateENSSetTextGasLimit = async ({
  name,
  records,
  ownerAddress,
}: {
  name: string;
  ownerAddress?: string;
  records: ENSRegistrationRecords;
}) =>
  estimateENSTransactionGasLimit({
    name,
    ownerAddress,
    records,
    type: ENSRegistrationTransactionType.SET_TEXT,
  });

export const estimateENSTransactionGasLimit = async ({
  name,
  type,
  ownerAddress,
  rentPrice,
  duration,
  records,
  salt,
}: {
  name?: string;
  type: ENSRegistrationTransactionType;
  ownerAddress?: string;
  rentPrice?: string;
  duration?: number;
  salt?: string;
  records?: ENSRegistrationRecords;
}): Promise<string | null> => {
  const { contract, methodArguments, value } = await getENSExecutionDetails({
    duration,
    name,
    ownerAddress,
    records,
    rentPrice,
    salt,
    type,
  });

  const txPayload = {
    ...(ownerAddress ? { from: ownerAddress } : {}),
    ...(value ? { value } : {}),
  };

  const gasLimit = await estimateGasWithPadding(
    txPayload,
    contract?.estimateGas[type],
    methodArguments
  );
  return gasLimit;
};

export const estimateENSRegistrationGasLimit = async (
  name: string,
  ownerAddress: string,
  duration: number,
  rentPrice: string,
  records: Records = DUMMY_RECORDS
) => {
  const salt = generateSalt();
  const commitGasLimitPromise = estimateENSCommitGasLimit({
    duration,
    name,
    ownerAddress,
    rentPrice,
    salt,
  });

  const setRecordsGasLimitPromise = estimateENSSetRecordsGasLimit({
    name: name + ENS_DOMAIN,
    records,
  });

  const setNameGasLimitPromise = estimateENSSetNameGasLimit({
    name,
    ownerAddress,
  });

  const gasLimits = await Promise.all([
    commitGasLimitPromise,
    setRecordsGasLimitPromise,
    setNameGasLimitPromise,
  ]);

  let [commitGasLimit, multicallGasLimit, setNameGasLimit] = gasLimits;
  commitGasLimit = commitGasLimit || `${ethUnits.ens_commit}`;
  multicallGasLimit = multicallGasLimit || `${ethUnits.ens_set_multicall}`;
  setNameGasLimit = setNameGasLimit || `${ethUnits.ens_set_name}`;
  // we need to add register gas limit manually since the gas estimation will fail since the commit tx is not sent yet
  const registerWithConfigGasLimit = `${ethUnits.ens_register_with_config}`;

  const totalRegistrationGasLimit =
    [...gasLimits, registerWithConfigGasLimit].reduce((a, b) =>
      add(a || 0, b || 0)
    ) || `${ethUnits.ens_registration}`;

  return {
    commitGasLimit,
    multicallGasLimit,
    registerWithConfigGasLimit,
    setNameGasLimit,
    totalRegistrationGasLimit,
  };
};

export const estimateENSRegisterSetRecordsAndNameGasLimit = async ({
  name,
  ownerAddress,
  records,
  duration,
  rentPrice,
  salt,
  setReverseRecord,
}: ENSActionParameters) => {
  const registerGasLimitPromise = estimateENSRegisterWithConfigGasLimit({
    duration,
    name,
    ownerAddress,
    rentPrice,
    salt,
  });
  const promises = [registerGasLimitPromise];

  if (setReverseRecord) {
    promises.push(
      estimateENSSetNameGasLimit({
        name,
        ownerAddress,
      })
    );
  }

  const ensRegistrationRecords = formatRecordsForTransaction(records);
  const validRecords = recordsForTransactionAreValid(ensRegistrationRecords);
  if (validRecords && records) {
    promises.push(
      estimateENSSetRecordsGasLimit({
        name,
        records,
      })
    );
  }

  const gasLimits = await Promise.all(promises);
  const gasLimit = gasLimits.reduce((a, b) => add(a || 0, b || 0));
  if (!gasLimit) return '0';
  return gasLimit;
};

export const estimateENSSetRecordsGasLimit = async ({
  name,
  records,
  ownerAddress,
}:
  | { name: string; records: Records; ownerAddress?: string }
  | ENSActionParameters) => {
  let gasLimit: string | null = '0';
  const ensRegistrationRecords = formatRecordsForTransaction(records);
  const validRecords = recordsForTransactionAreValid(ensRegistrationRecords);
  if (validRecords) {
    const shouldUseMulticall = shouldUseMulticallTransaction(
      ensRegistrationRecords
    );
    gasLimit = await (shouldUseMulticall
      ? estimateENSMulticallGasLimit
      : estimateENSSetTextGasLimit)({
      ...{ name, ownerAddress, records: ensRegistrationRecords },
    });
  }
  return gasLimit;
};

export const formatRecordsForTransaction = (
  records?: Records
): ENSRegistrationRecords => {
  const coinAddress = [] as { key: string; address: string }[];
  const text = [] as { key: string; value: string }[];
  let contentHash = null;
  const ensAssociatedAddress = null;
  records &&
    Object.entries(records).forEach(([key, value]) => {
      switch (key) {
        case ENS_RECORDS.cover:
        case ENS_RECORDS.twitter:
        case ENS_RECORDS.displayName:
        case ENS_RECORDS.email:
        case ENS_RECORDS.url:
        case ENS_RECORDS.avatar:
        case ENS_RECORDS.description:
        case ENS_RECORDS.notice:
        case ENS_RECORDS.keywords:
        case ENS_RECORDS.discord:
        case ENS_RECORDS.github:
        case ENS_RECORDS.reddit:
        case ENS_RECORDS.instagram:
        case ENS_RECORDS.snapchat:
        case ENS_RECORDS.telegram:
        case ENS_RECORDS.ensDelegate:
          if (value || value === '') {
            text.push({
              key,
              value: value,
            });
          }
          return;
        case ENS_RECORDS.ETH:
        case ENS_RECORDS.BTC:
        case ENS_RECORDS.LTC:
        case ENS_RECORDS.DOGE:
          if (value || value === '') {
            coinAddress.push({ address: value, key });
          }
          return;
        case ENS_RECORDS.content:
          if (value || value === '') {
            contentHash = value;
          }
          return;
      }
    });
  return { coinAddress, contentHash, ensAssociatedAddress, text };
};

export const recordsForTransactionAreValid = (
  registrationRecords: ENSRegistrationRecords
) => {
  const {
    coinAddress,
    contentHash,
    ensAssociatedAddress,
    text,
  } = registrationRecords;
  if (
    !coinAddress?.length &&
    !contentHash &&
    !ensAssociatedAddress &&
    !text?.length
  ) {
    return false;
  }
  return true;
};

export const shouldUseMulticallTransaction = (
  registrationRecords: ENSRegistrationRecords
) => {
  const {
    coinAddress,
    contentHash,
    ensAssociatedAddress,
    text,
  } = registrationRecords;
  if (
    !coinAddress?.length &&
    !contentHash &&
    !ensAssociatedAddress &&
    text?.length === 1
  ) {
    return false;
  }
  return true;
};

export const fetchReverseRecord = async (address: string) => {
  try {
    const provider = await getProviderForNetwork();
    const reverseRecord = await provider.lookupAddress(address);
    return reverseRecord ?? '';
  } catch (e) {
    return '';
  }
};

export const fetchResolver = async (ensName: string) => {
  try {
    const provider = await getProviderForNetwork();
    const resolver = await provider.getResolver(ensName);
    return resolver ?? ({} as Resolver);
  } catch (e) {
    return {} as Resolver;
  }
};
