import { debounce, isEmpty, sortBy } from 'lodash';
import { ensClient } from '../apollo/client';
import {
  ENS_DOMAINS,
  ENS_GET_OWNER,
  ENS_GET_REGISTRANT,
  ENS_REGISTRATIONS,
  ENS_SUGGESTIONS,
  ENS_TEXT_RECORDS,
} from '../apollo/queries';
import { estimateGasWithPadding, web3Provider } from './web3';
import { Records } from '@rainbow-me/entities';
import {
  ENS_DOMAIN,
  ENSRegistrationRecords,
  ENSRegistrationTransactionType,
  generateSalt,
  getENSExecutionDetails,
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
  const response = await ensClient.query({
    query: ENS_TEXT_RECORDS,
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

export const fetchOwner = async (ensName: string) => {
  const response = await ensClient.query({
    query: ENS_GET_OWNER,
    variables: {
      name: ensName,
    },
  });
  const data = response.data?.domains[0] || {};

  let owner: { address?: string; name?: string } = {};
  if (data.owner?.id) {
    const name = await web3Provider.lookupAddress(data.owner.id);
    owner = {
      address: data.owner.id,
      name,
    };
  }

  return owner;
};

export const fetchRegistrant = async (ensName: string) => {
  const response = await ensClient.query({
    query: ENS_GET_REGISTRANT,
    variables: {
      name: labelhash(ensName.replace(ENS_DOMAIN, '')),
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

  return registrant;
};

export const fetchProfile = async (ensName: any) => {
  const [resolver, records, images, owner, registrant] = await Promise.all([
    web3Provider.getResolver(ensName),
    fetchRecords(ensName),
    fetchImages(ensName),
    fetchOwner(ensName),
    fetchRegistrant(ensName),
  ]);

  const resolverData = {
    address: resolver.address,
    type: resolver.address === ensPublicResolverAddress ? 'default' : 'custom',
  };

  return {
    images,
    owner,
    records,
    registrant,
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
    type: ENSRegistrationTransactionType.COMMIT,
  });

export const estimateENSSetTextGasLimit = async ({
  name,
  recordKey,
  recordValue,
}: {
  name: string;
  recordKey: string;
  recordValue: string;
}) =>
  estimateENSTransactionGasLimit({
    name,
    records: {
      coinAddress: null,
      contentHash: null,
      ensAssociatedAddress: null,
      text: [
        {
          key: recordKey,
          value: recordValue,
        },
      ],
    },
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
  name,
  records,
}: {
  name: string;
  records: ENSRegistrationRecords;
}) =>
  estimateENSTransactionGasLimit({
    name,
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
    name,
    records: {
      coinAddress: null,
      contentHash: null,
      ensAssociatedAddress: ownerAddress,
      text: [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' },
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
}: {
  name: string;
  ownerAddress: string;
  records: ENSRegistrationRecords;
  duration: number;
  rentPrice: string;
  salt: string;
}) => {
  const registerGasLimitPromise = estimateENSRegisterWithConfigGasLimit({
    duration,
    name,
    ownerAddress,
    rentPrice,
    salt,
  });
  // WIP we need to set / unset these values from the UI
  const setReverseRecord = true;
  const setRecords = true;

  const promises = [registerGasLimitPromise];
  if (setReverseRecord) {
    promises.push(
      estimateENSSetNameGasLimit({
        name,
        ownerAddress,
      })
    );
  }
  if (setRecords) {
    promises.push(
      estimateENSMulticallGasLimit({
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
