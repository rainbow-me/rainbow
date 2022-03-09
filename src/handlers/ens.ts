import { formatsByCoinType } from '@ensdomains/address-encoder';
import { debounce, isEmpty, sortBy } from 'lodash';
import { ensClient } from '../apollo/client';
import {
  ENS_DOMAINS,
  ENS_GET_COIN_TYPES,
  ENS_GET_RECORDS,
  ENS_GET_REGISTRATION,
  ENS_REGISTRATIONS,
  ENS_SUGGESTIONS,
  EnsGetCoinTypesData,
  EnsGetRecordsData,
  EnsGetRegistrationData,
} from '../apollo/queries';
import { ENSActionParameters } from '../raps/common';
import { estimateGasWithPadding, web3Provider } from './web3';
import { ENSRegistrationRecords, Records } from '@rainbow-me/entities';
import {
  ENS_DOMAIN,
  ENS_RECORDS,
  ENSRegistrationTransactionType,
  generateSalt,
  getENSExecutionDetails,
  getNameOwner,
} from '@rainbow-me/helpers/ens';
import { add } from '@rainbow-me/helpers/utilities';
import { ensPublicResolverAddress, ethUnits } from '@rainbow-me/references';
import { labelhash, profileUtils } from '@rainbow-me/utils';
import { AvatarResolver } from 'ens-avatar';

export const fetchSuggestions = async (
  recipient: any,
  setSuggestions: any,
  setIsFetching = (_unused: any) => {}
) => {
  if (recipient.length > 2) {
    let suggestions = [];
    setIsFetching(true);
    const recpt = recipient.toLowerCase();
    let result = await ensClient.query({
      query: ENS_SUGGESTIONS,
      variables: {
        amount: 75,
        name: recpt,
      },
    });

    if (!isEmpty(result?.data?.domains)) {
      const ensSuggestions = result.data.domains
        .map((ensDomain: any) => ({
          address: ensDomain?.resolver?.addr?.id || ensDomain?.name,

          color: profileUtils.addressHashedColorIndex(
            ensDomain?.resolver?.addr?.id || ensDomain.name
          ),

          ens: true,
          network: 'mainnet',
          nickname: ensDomain?.name,
          uniqueId: ensDomain?.resolver?.addr?.id || ensDomain.name,
        }))
        .filter((domain: any) => !domain?.nickname?.includes?.('['));
      const sortedEnsSuggestions = sortBy(
        ensSuggestions,
        domain => domain.nickname.length,
        ['asc']
      );

      suggestions = sortedEnsSuggestions.slice(0, 3);
    }

    setSuggestions(suggestions);
    setIsFetching(false);

    return suggestions;
  }
};

export const debouncedFetchSuggestions = debounce(fetchSuggestions, 200);

export const fetchRegistrationDate = async (recipient: any) => {
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

export const fetchImages = async (ensName: string) => {
  let avatarUrl;
  let coverUrl;
  try {
    const avatarResolver = new AvatarResolver(web3Provider);
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

  const resolver = await web3Provider.getResolver(ensName);
  const recordKeys: string[] = data.resolver?.texts || [];
  const recordValues = await Promise.all(
    recordKeys.map((key: string) => resolver.getText(key))
  );
  const records = recordKeys.reduce((records, key, i) => {
    return {
      ...records,
      [key]: recordValues[i],
    };
  }, {}) as Partial<Records>;

  return records;
};

export const fetchCoinAddresses = async (ensName: string) => {
  const response = await ensClient.query<EnsGetCoinTypesData>({
    query: ENS_GET_COIN_TYPES,
    variables: {
      name: ensName,
    },
  });
  const data = response.data?.domains[0] || {};

  const resolver = await web3Provider.getResolver(ensName);
  const coinTypes: number[] = data.resolver?.coinTypes || [];
  const coinAddressValues = await Promise.all(
    coinTypes
      .map(async (coinType: number) => {
        try {
          return await resolver.getAddress(coinType);
        } catch (err) {
          return undefined;
        }
      })
      .filter(x => x)
  );
  const coinAddresses = coinTypes.reduce((coinAddresses, coinType, i) => {
    return {
      ...coinAddresses,
      [formatsByCoinType[coinType].name]: coinAddressValues[i],
    };
  }, {});
  return coinAddresses;
};

export const fetchOwner = async (ensName: string) => {
  const ownerAddress = await getNameOwner(ensName);

  let owner: { address?: string; name?: string } = {};
  if (ownerAddress) {
    const name = await web3Provider.lookupAddress(ownerAddress);
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
    const name = await web3Provider.lookupAddress(registrantAddress);
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
  const address = await web3Provider.resolveName(ensName);
  const primaryName = await web3Provider.lookupAddress(address);
  return {
    isPrimary: primaryName === ensName.toLowerCase(),
    primaryName,
  };
};

export const fetchProfile = async (ensName: any) => {
  const [
    resolver,
    records,
    coinAddresses,
    images,
    owner,
    { registrant, registration },
    primary,
  ] = await Promise.all([
    web3Provider.getResolver(ensName),
    fetchRecords(ensName),
    fetchCoinAddresses(ensName),
    fetchImages(ensName),
    fetchOwner(ensName),
    fetchRegistration(ensName),
    fetchPrimary(ensName),
  ]);

  const resolverData = {
    address: resolver.address,
    type: resolver.address === ensPublicResolverAddress ? 'default' : 'custom',
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

export const estimateENSSetTextGasLimit = async ({
  name,
  ownerAddress,
  records,
}: {
  name: string;
  ownerAddress: string;
  records: ENSRegistrationRecords;
}) =>
  estimateENSTransactionGasLimit({
    name,
    ownerAddress,
    records,
    type: ENSRegistrationTransactionType.SET_TEXT,
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

export const estimateENSMulticallGasLimit = async ({
  ownerAddress,
  name,
  records,
}: {
  ownerAddress?: string;
  name: string;
  records: ENSRegistrationRecords;
}) =>
  estimateENSTransactionGasLimit({
    name,
    ownerAddress,
    records,
    type: ENSRegistrationTransactionType.MULTICALL,
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
  rentPrice: string
) => {
  const salt = generateSalt();
  const commitGasLimitPromise = estimateENSCommitGasLimit({
    duration,
    name,
    ownerAddress,
    rentPrice,
    salt,
  });
  const setNameGasLimitPromise = estimateENSSetNameGasLimit({
    name,
    ownerAddress,
  });
  // dummy multicall to estimate gas
  const multicallGasLimitPromise = estimateENSMulticallGasLimit({
    name: name + ENS_DOMAIN,
    records: {
      coinAddress: [],
      contentHash: null,
      ensAssociatedAddress: null,
      text: [
        { key: 'me.rainbow.displayName', value: 'name' },
        { key: 'description', value: 'description' },
        {
          key: 'cover',
          value:
            'https://cloudflare-ipfs.com/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco/I/m/Vincent_van_Gogh_-_Self-Portrait_-_Google_Art_Project_(454045).jpg',
        },
      ],
    },
  });

  const gasLimits = await Promise.all([
    commitGasLimitPromise,
    setNameGasLimitPromise,
    multicallGasLimitPromise,
  ]);

  let [commitGasLimit, setNameGasLimit, multicallGasLimit] = gasLimits;
  commitGasLimit = commitGasLimit || `${ethUnits.ens_commit}`;
  setNameGasLimit = setNameGasLimit || `${ethUnits.ens_set_name}`;
  multicallGasLimit = multicallGasLimit || `${ethUnits.ens_set_multicall}`;
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
  if (validRecords) {
    promises.push(
      estimateENSMulticallGasLimit({
        name,
        ownerAddress,
        records: ensRegistrationRecords,
      })
    );
  }

  const gasLimits = await Promise.all(promises);
  const gasLimit = gasLimits.reduce((a, b) => add(a || 0, b || 0));
  if (!gasLimit) return '0';
  return gasLimit;
};

export const estimateENSRegisterSetRecords = async ({
  name,
  ownerAddress,
  records,
}: ENSActionParameters) => {
  let gasLimit = null;
  const ensRegistrationRecords = formatRecordsForTransaction(records);
  const validRecords = recordsForTransactionAreValid(ensRegistrationRecords);
  if (validRecords) {
    const shouldUseMulticall = shouldUseMulticallTransaction(
      ensRegistrationRecords
    );
    gasLimit = await (shouldUseMulticall
      ? estimateENSMulticallGasLimit
      : estimateENSSetTextGasLimit)({
      name,
      ownerAddress,
      records: ensRegistrationRecords,
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
          Boolean(value) &&
            text.push({
              key,
              value: value,
            });
          return;
        case ENS_RECORDS.ETH:
        case ENS_RECORDS.BTC:
        case ENS_RECORDS.LTC:
        case ENS_RECORDS.DOGE:
          Boolean(value) && coinAddress.push({ address: value, key });
          return;
        case ENS_RECORDS.content:
          if (value) {
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
