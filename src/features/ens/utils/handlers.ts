import { getAddress } from '@ethersproject/address';
import { isValidAddress, isZeroAddress } from 'ethereumjs-util';
import { debounce, isEmpty, sortBy } from 'lodash';
import { getAddress as getViemAddress } from 'viem';

import { ENS_RECORDS } from '@/features/ens/core/records';
import { useEnsImageStore } from '@/features/ens/data/stores/imageStore';
import { useEnsRecordsStore } from '@/features/ens/data/stores/recordsStore';
import { useEnsNameStore } from '@/features/ens/data/useEnsNameStore';
import { ChainId } from '@/features/network/types/backendNetworks';
import { ensClient } from '@/graphql';
import { estimateGasWithPadding, getProvider } from '@/handlers/web3';
import { add } from '@/helpers/utilities';
import { prefetchFirstTransactionTimestamp } from '@/resources/transactions/firstTransactionTimestampQuery';
import profileUtils from '@/utils/profileUtils';

import { useEnsAddressStore } from '../data/useEnsAddressStore';
import { ENSRapActionType, type ENSActionParameters } from '../raps/common';
import type { ENSRegistrationRecords, Records } from '../types/registration';
import { ENSRegistrationTransactionType, getENSExecutionDetails } from './helpers';

export const fetchSuggestions = async (
  recipient: any,
  setSuggestions: any,
  setIsFetching = (_unused: any) => {},
  profilesEnabled = false
) => {
  if (isValidAddress(recipient)) {
    const address = getAddress(recipient);
    const ens = await useEnsNameStore
      .getState()
      .load(getViemAddress(address))
      .catch(() => null);
    if (!ens) {
      setSuggestions([]);
      setIsFetching(false);
      return [];
    }
    let avatar;
    try {
      avatar = await useEnsImageStore.getState().load({ name: ens, field: 'avatar' });
      void useEnsAddressStore
        .getState()
        .load({ addressOrName: ens, chainId: ChainId.mainnet })
        .catch(() => undefined);
      useEnsImageStore
        .getState()
        .load({ name: ens, field: 'header' })
        .catch(() => undefined);
      useEnsRecordsStore
        .getState()
        .load({ name: ens })
        .catch(() => undefined);
      prefetchFirstTransactionTimestamp({ addressOrName: ens });
      // eslint-disable-next-line no-empty
    } catch (e) {}
    const suggestion = [
      {
        address: address,
        color: profileUtils.addressHashedColorIndex(recipient),
        ens: true,
        image: avatar,
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
                const avatar = await useEnsImageStore.getState().load({ name: domain.name, field: 'avatar' });
                if (i === 0) {
                  void useEnsAddressStore
                    .getState()
                    .load({ addressOrName: domain.name, chainId: ChainId.mainnet })
                    .catch(() => undefined);
                  useEnsImageStore
                    .getState()
                    .load({ name: domain.name, field: 'header' })
                    .catch(() => undefined);
                  useEnsRecordsStore
                    .getState()
                    .load({ name: domain.name })
                    .catch(() => undefined);
                  prefetchFirstTransactionTimestamp({
                    addressOrName: domain.name,
                  });
                }
                return {
                  ...domain,
                  avatar: avatar,
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
  const provider = getProvider({ chainId: ChainId.mainnet });
  const gasLimit = await estimateGasWithPadding(txPayload, contract?.estimateGas[type], methodArguments, provider);
  return gasLimit;
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
  if (!duration || !ownerAddress || !rentPrice || !salt) throw new Error('Registration requires a saved commitment');
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
