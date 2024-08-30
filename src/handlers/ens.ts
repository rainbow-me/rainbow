import { formatsByCoinType, formatsByName } from '@ensdomains/address-encoder';
import { getAddress } from '@ethersproject/address';
import { Resolver } from '@ethersproject/providers';
import { captureException } from '@sentry/react-native';
import { Duration, sub } from 'date-fns';
import { isValidAddress, isZeroAddress } from 'ethereumjs-util';
import { BigNumber } from '@ethersproject/bignumber';
import { debounce, isEmpty, sortBy } from 'lodash';
import { fetchENSAvatar, prefetchENSAvatar } from '../hooks/useENSAvatar';
import { prefetchENSCover } from '../hooks/useENSCover';
import { prefetchENSRecords } from '../hooks/useENSRecords';
import { ENSActionParameters, ENSRapActionType } from '@/raps/common';
import { getENSData, getNameFromLabelhash, saveENSData } from './localstorage/ens';
import { estimateGasWithPadding, getProviderForNetwork, TokenStandard } from './web3';
import { ENSRegistrationRecords, Records, UniqueAsset } from '@/entities';
import { Network } from '@/helpers';
import { ENS_DOMAIN, ENS_RECORDS, ENSRegistrationTransactionType, generateSalt, getENSExecutionDetails, getNameOwner } from '@/helpers/ens';
import { add } from '@/helpers/utilities';
import { ImgixImage } from '@/components/images';
import { ENS_NFT_CONTRACT_ADDRESS, ethUnits } from '@/references';
import { labelhash, logger, profileUtils } from '@/utils';
import { AvatarResolver } from '@/ens-avatar/src';
import { ensClient } from '@/graphql';
import { prefetchFirstTransactionTimestamp } from '@/resources/transactions/firstTransactionTimestampQuery';
import { prefetchENSAddress } from '@/resources/ens/ensAddressQuery';
import { ENS_MARQUEE_QUERY_KEY } from '@/resources/metadata/ensMarqueeQuery';
import { queryClient } from '@/react-query';
import { EnsMarqueeAccount } from '@/graphql/__generated__/metadata';
import { MimeType, handleNFTImages } from '@/utils/handleNFTImages';
import store from '@/redux/store';

const DUMMY_RECORDS = {
  description: 'description',
  header:
    'https://cloudflare-ipfs.com/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco/I/m/Vincent_van_Gogh_-_Self-Portrait_-_Google_Art_Project_(454045).jpg',
  name: 'name',
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
  const { highResUrl: imageUrl, lowResUrl } = handleNFTImages({
    originalUrl: imageUrl_,
    previewUrl: undefined,
    mimeType: MimeType.SVG,
  });
  return {
    acquisition_date: undefined,
    animation_url: null,
    asset_contract: {
      address: contractAddress,
      name: 'ENS',
      nft_version: '3.0',
      schema_name: TokenStandard.ERC721,
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
    fullUniqueId: `${Network.mainnet}_${contractAddress}_${tokenId}`,
    id: tokenId,
    image_original_url: imageUrl,
    image_thumbnail_url: lowResUrl,
    image_url: imageUrl,
    isSendable: true,
    last_sale: null,
    lastPrice: null,
    lastPriceUsd: null,
    lastSale: undefined,
    lastSalePaymentToken: null,
    lowResUrl,
    marketplaceCollectionUrl: `https://opensea.io/collection/ens?search[sortAscending]=true&search[sortBy]=PRICE&search[toggles][0]=BUY_NOW`,
    marketplaceId: 'opensea',
    marketplaceName: 'OpenSea',
    name,
    network: Network.mainnet,
    permalink: '',
    sell_orders: [],
    traits: [],
    type: 'nft',
    uniqueId: name,
    urlSuffixForAsset: `${contractAddress}/${tokenId}`,
    // hacky shit
    video_url: null,
    video_properties: null,
    audio_url: null,
    audio_properties: null,
    model_url: null,
    model_properties: null,
  } as UniqueAsset;
};

export const fetchMetadata = async ({
  contractAddress = ENS_NFT_CONTRACT_ADDRESS,
  tokenId,
}: {
  contractAddress?: string;
  tokenId: string;
}) => {
  try {
    const labelhash = BigNumber.from(tokenId).toHexString();

    let name = await getNameFromLabelhash(labelhash);
    if (!name) {
      const data = await ensClient.getNameFromLabelhash({ labelhash });
      name = `${data.domains[0].labelName}.eth`;
    }

    const image_url = `https://metadata.ens.domains/mainnet/${contractAddress}/${tokenId}/image`;
    return { image_url, name };
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
    const data = await ensClient.getRegistrationsByAddress({
      address: address.toLowerCase(),
      registrationDate_gt: Math.floor(sub(new Date(), timeAgo).getTime() / 1000).toString(),
    });

    return (
      data?.account?.registrations
        ?.map(registration => {
          if (!registration.domain) return;

          const tokenId = BigNumber.from(registration.domain.labelhash).toString();
          const token = buildEnsToken({
            contractAddress,
            imageUrl: `https://metadata.ens.domains/mainnet/${contractAddress}/${tokenId}/image`,
            name: registration.domain.name || '',
            tokenId,
          });
          return token;
        })
        .filter(<TToken>(token: TToken | null | undefined): token is TToken => !!token) || []
    );
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
  if (isValidAddress(recipient)) {
    const address = getAddress(recipient);
    const ens = await fetchReverseRecord(address);
    if (!ens) {
      setSuggestions([]);
      setIsFetching(false);
      return [];
    }
    let avatar;
    try {
      avatar = await fetchENSAvatar(ens, {
        cacheFirst: true,
      });
      prefetchENSAddress(
        { name: ens },
        {
          staleTime: 1000 * 60 * 10, // 10 minutes
        }
      );
      prefetchENSCover(ens, { cacheFirst: true });
      prefetchENSRecords(ens, { cacheFirst: true });
      prefetchFirstTransactionTimestamp({ addressOrName: ens });
      // eslint-disable-next-line no-empty
    } catch (e) {}
    const suggestion = [
      {
        address: address,
        color: profileUtils.addressHashedColorIndex(recipient),
        ens: true,
        image: avatar?.imageUrl,
        network: 'mainnet',
        nickname: ens,
        uniqueId: address,
      },
    ];
    setSuggestions(suggestion);
    setIsFetching(false);
    return suggestion;
  }
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
    const result = await ensClient.getSuggestions({
      name: recipient.toLowerCase(),
      first: 8,
    });
    if (!isEmpty(result?.domains)) {
      const domains = await Promise.all(
        result?.domains
          .filter(domain => !isZeroAddress(domain.owner.id))
          .map(async (domain, i) => {
            const hasAvatar = domain?.resolver?.texts?.find(text => text === ENS_RECORDS.avatar);
            if (!!hasAvatar && profilesEnabled && domain.name) {
              try {
                const avatar = await fetchENSAvatar(domain.name, {
                  cacheFirst: true,
                });
                if (i === 0) {
                  prefetchENSAddress(
                    { name: domain.name },
                    {
                      staleTime: 1000 * 60 * 10, // 10 minutes
                    }
                  );
                  prefetchENSCover(domain.name, { cacheFirst: true });
                  prefetchENSRecords(domain.name, { cacheFirst: true });
                  prefetchFirstTransactionTimestamp({
                    addressOrName: domain.name,
                  });
                }
                return {
                  ...domain,
                  avatar: avatar?.imageUrl,
                };
                // eslint-disable-next-line no-empty
              } catch (e) {}
            }
            return domain;
          })
      );
      const ensSuggestions = domains
        .map((ensDomain: any) => ({
          address: ensDomain?.resolver?.addr?.id || ensDomain?.name,
          color: profileUtils.addressHashedColorIndex(ensDomain?.resolver?.addr?.id || ensDomain.name),
          ens: true,
          image: ensDomain?.avatar,
          network: 'mainnet',
          nickname: ensDomain?.name,
          uniqueId: ensDomain?.resolver?.addr?.id || ensDomain.name,
        }))
        .filter(domain => !domain?.nickname?.includes?.('['));
      suggestions = sortBy(ensSuggestions, domain => domain.nickname?.length, ['asc']);
    }
    setSuggestions(suggestions);
    setIsFetching(false);

    return suggestions;
  }
};

export const debouncedFetchSuggestions = debounce(fetchSuggestions, 200);

export const fetchRegistrationDate = async (recipient: string) => {
  if (recipient.length > 2) {
    const { domains } = await ensClient.getDomainsByName({
      name: recipient.toLowerCase(),
    });
    const labelHash = domains?.[0]?.labelhash;
    const { registrations } = await ensClient.getRegistrationsByLabelhash({
      labelHash,
    });
    const { registrationDate } = registrations?.[0] || {
      registrationDate: null,
    };
    return registrationDate;
  }
};

export const fetchAccountDomains = async (address: string) => {
  const domains = await ensClient.getDomainsByAddress({
    address: address?.toLowerCase(),
  });
  return domains;
};

export const fetchImage = async (imageType: 'avatar' | 'header', ensName: string) => {
  let imageUrl;
  const provider = await getProviderForNetwork();
  try {
    const avatarResolver = new AvatarResolver(provider);
    imageUrl = await avatarResolver.getImage(ensName, {
      allowNonOwnerNFTs: true,
      type: imageType,
    });
    ImgixImage.preload([...(imageUrl ? [{ uri: imageUrl }] : [])], 100);
    saveENSData(imageType, ensName, { imageUrl });
  } catch (err) {
    // Fallback to storage images
    const data = await getENSData(imageType, ensName);
    imageUrl = data?.imageUrl as string;
  }

  return { imageUrl };
};

export const fetchRecords = async (ensName: string, { supportedOnly = true }: { supportedOnly?: boolean } = {}) => {
  const response = await ensClient.getTextRecordKeysByName({
    name: ensName,
  });
  const data = response.domains[0] || {};
  const rawRecordKeys = data.resolver?.texts || [];

  const provider = await getProviderForNetwork();
  const resolver = await provider.getResolver(ensName);
  const supportedRecords = Object.values(ENS_RECORDS);
  const recordKeys = (rawRecordKeys as ENS_RECORDS[]).filter(key => (supportedOnly ? supportedRecords.includes(key) : true));
  const recordValues = await Promise.all(recordKeys.map((key: string) => resolver?.getText(key)));
  const records = recordKeys.reduce((records, key, i) => {
    return {
      ...records,
      ...(recordValues[i] ? { [key]: recordValues[i] } : {}),
    };
  }, {}) as Partial<Records>;

  return records;
};

export const fetchCoinAddresses = async (
  ensName: string,
  { supportedOnly = true }: { supportedOnly?: boolean } = {}
): Promise<{ [key in ENS_RECORDS]: string }> => {
  const response = await ensClient.getCoinTypesByName({ name: ensName });
  const data = response.domains[0] || {};
  const supportedRecords = Object.values(ENS_RECORDS);
  const provider = await getProviderForNetwork();
  const resolver = await provider.getResolver(ensName);
  const rawCoinTypes: number[] = data.resolver?.coinTypes || [];
  const rawCoinTypesNames: string[] = rawCoinTypes.map(type => formatsByCoinType[type].name);
  const coinTypes: number[] =
    (rawCoinTypesNames as ENS_RECORDS[])
      .filter(name => (supportedOnly ? supportedRecords.includes(name) : true))
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
        ...(coinAddressValues[i] ? { [formatsByCoinType[coinType].name]: coinAddressValues[i] } : {}),
      };
    },
    {} as { [key in ENS_RECORDS]: string }
  );
  return coinAddresses;
};

export const fetchContenthash = async (ensName: string) => {
  const provider = await getProviderForNetwork();
  const resolver = await provider.getResolver(ensName);
  const contenthash = await resolver?.getContentHash();
  return contenthash;
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
  const response = await ensClient.getRegistration({
    id: labelhash(ensName.replace(ENS_DOMAIN, '')),
  });
  const data = response.registration;

  let registrant: { address?: string; name?: string } = {};
  if (data?.registrant?.id) {
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

export const estimateENSCommitGasLimit = async ({ name, ownerAddress, duration, rentPrice, salt }: ENSActionParameters) =>
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

export const estimateENSRenewGasLimit = async ({ name, duration, rentPrice }: { name: string; duration: number; rentPrice: string }) =>
  estimateENSTransactionGasLimit({
    duration,
    name,
    rentPrice,
    type: ENSRegistrationTransactionType.RENEW,
  });

export const estimateENSSetNameGasLimit = async ({ name, ownerAddress }: { name: string; ownerAddress: string }) =>
  estimateENSTransactionGasLimit({
    name,
    ownerAddress,
    type: ENSRegistrationTransactionType.SET_NAME,
  });

export const estimateENSReclaimGasLimit = async ({
  name,
  ownerAddress,
  toAddress,
}: {
  name: string;
  ownerAddress: string;
  toAddress: string;
}) =>
  estimateENSTransactionGasLimit({
    name,
    ownerAddress,
    toAddress,
    type: ENSRegistrationTransactionType.RECLAIM,
  });

export const estimateENSSetAddressGasLimit = async ({
  name,
  ownerAddress,
  records,
}: {
  name: string;
  ownerAddress?: string;
  records: ENSRegistrationRecords;
}) =>
  estimateENSTransactionGasLimit({
    name,
    ownerAddress,
    records,
    type: ENSRegistrationTransactionType.SET_ADDR,
  });

export const estimateENSSetContenthashGasLimit = async ({
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
    type: ENSRegistrationTransactionType.SET_CONTENTHASH,
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
  toAddress,
  rentPrice,
  duration,
  records,
  salt,
}: {
  name?: string;
  type: ENSRegistrationTransactionType;
  ownerAddress?: string;
  toAddress?: string;
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
    toAddress,
    type,
  });

  const txPayload = {
    ...(ownerAddress ? { from: ownerAddress } : {}),
    ...(value ? { value } : {}),
  };

  const gasLimit = await estimateGasWithPadding(txPayload, contract?.estimateGas[type], methodArguments);
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
  const { selectedGasFee, gasFeeParamsBySpeed } = store.getState().gas;
  const commitGasLimitPromise = estimateENSCommitGasLimit({
    duration,
    name,
    ownerAddress,
    rentPrice,
    salt,
    selectedGasFee,
    gasFeeParamsBySpeed,
  });

  const setRecordsGasLimitPromise = estimateENSSetRecordsGasLimit({
    name: name + ENS_DOMAIN,
    records,
  });

  const setNameGasLimitPromise = estimateENSSetNameGasLimit({
    name,
    ownerAddress,
  });

  const gasLimits = await Promise.all([commitGasLimitPromise, setRecordsGasLimitPromise, setNameGasLimitPromise]);

  let [commitGasLimit, multicallGasLimit, setNameGasLimit] = gasLimits;
  commitGasLimit = commitGasLimit || `${ethUnits.ens_commit}`;
  multicallGasLimit = multicallGasLimit || `${ethUnits.ens_set_multicall}`;
  setNameGasLimit = setNameGasLimit || `${ethUnits.ens_set_name}`;
  // we need to add register gas limit manually since the gas estimation will fail since the commit tx is not sent yet
  const registerWithConfigGasLimit = `${ethUnits.ens_register_with_config}`;

  const totalRegistrationGasLimit =
    [...gasLimits, registerWithConfigGasLimit].reduce((a, b) => add(a || 0, b || 0), '') || `${ethUnits.ens_registration}`;

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
        ownerAddress,
        records,
      })
    );
  }

  const gasLimits = await Promise.all(promises);
  const gasLimit = gasLimits?.reduce((a, b) => add(a || 0, b || 0), '');
  if (!gasLimit) return '0';
  return gasLimit;
};

export const estimateENSSetRecordsGasLimit = async ({
  name,
  records,
  ownerAddress,
  setReverseRecord,
}:
  | {
      name: string;
      records: Records;
      ownerAddress?: string;
      setReverseRecord?: boolean;
    }
  | ENSActionParameters) => {
  const promises = [];
  const ensRegistrationRecords = formatRecordsForTransaction(records);
  const validRecords = recordsForTransactionAreValid(ensRegistrationRecords);
  if (validRecords) {
    const txType = getTransactionTypeForRecords(ensRegistrationRecords);
    switch (txType) {
      case ENSRegistrationTransactionType.MULTICALL:
        promises.push(
          estimateENSMulticallGasLimit({
            name,
            ownerAddress,
            records: ensRegistrationRecords,
          })
        );
        break;
      case ENSRegistrationTransactionType.SET_ADDR:
        promises.push(
          estimateENSSetAddressGasLimit({
            name,
            ownerAddress,
            records: ensRegistrationRecords,
          })
        );
        break;
      case ENSRegistrationTransactionType.SET_TEXT:
        promises.push(
          estimateENSSetTextGasLimit({
            name,
            ownerAddress,
            records: ensRegistrationRecords,
          })
        );
        break;
      case ENSRegistrationTransactionType.SET_CONTENTHASH:
        promises.push(
          estimateENSSetContenthashGasLimit({
            name,
            ownerAddress,
            records: ensRegistrationRecords,
          })
        );
        break;
      default:
    }
  }
  if (setReverseRecord && ownerAddress) {
    promises.push(
      estimateENSSetNameGasLimit({
        name,
        ownerAddress,
      })
    );
  }
  const gasLimits = await Promise.all(promises);
  const gasLimit = gasLimits?.reduce((a, b) => add(a || 0, b || 0), '');
  if (!gasLimit) return '0';
  return gasLimit;
};

export const formatRecordsForTransaction = (records?: Records): ENSRegistrationRecords => {
  const coinAddress = [] as { key: string; address: string }[];
  const text = [] as { key: string; value: string }[];
  let contenthash = null;
  const ensAssociatedAddress = null;
  records &&
    Object.entries(records).forEach(([key, value]) => {
      switch (key) {
        case ENS_RECORDS.header:
        case ENS_RECORDS.twitter:
        case ENS_RECORDS.displayName:
        case ENS_RECORDS.name:
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
        case ENS_RECORDS.contenthash:
          if (value || value === '') {
            contenthash = value;
          }
          return;
      }
    });
  return { coinAddress, contenthash, ensAssociatedAddress, text };
};

export const recordsForTransactionAreValid = (registrationRecords: ENSRegistrationRecords) => {
  const { coinAddress, contenthash, ensAssociatedAddress, text } = registrationRecords;
  if (!coinAddress?.length && typeof contenthash !== 'string' && !ensAssociatedAddress && !text?.length) {
    return false;
  }
  return true;
};

export const getTransactionTypeForRecords = (registrationRecords: ENSRegistrationRecords) => {
  const { coinAddress, contenthash, ensAssociatedAddress, text } = registrationRecords;

  if (ensAssociatedAddress || (text?.length || 0) + (coinAddress?.length || 0) + (typeof contenthash === 'string' ? 1 : 0) > 1) {
    return ENSRegistrationTransactionType.MULTICALL;
  } else if (typeof contenthash === 'string') {
    return ENSRegistrationTransactionType.SET_CONTENTHASH;
  } else if (text?.length) {
    return ENSRegistrationTransactionType.SET_TEXT;
  } else if (coinAddress?.length) {
    return ENSRegistrationTransactionType.SET_ADDR;
  } else {
    return null;
  }
};

export const getRapActionTypeForTxType = (txType: ENSRegistrationTransactionType) => {
  switch (txType) {
    case ENSRegistrationTransactionType.MULTICALL:
      return ENSRapActionType.multicallENS;
    case ENSRegistrationTransactionType.SET_ADDR:
      return ENSRapActionType.setAddrENS;
    case ENSRegistrationTransactionType.SET_TEXT:
      return ENSRapActionType.setTextENS;
    case ENSRegistrationTransactionType.SET_CONTENTHASH:
      return ENSRapActionType.setContenthashENS;
    default:
      return null;
  }
};

export const fetchReverseRecord = async (address: string) => {
  try {
    const checksumAddress = getAddress(address);
    const provider = await getProviderForNetwork();
    const reverseRecord = await provider.lookupAddress(checksumAddress);
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
