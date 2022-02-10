import { debounce, isEmpty, sortBy } from 'lodash';
import { ensClient } from '../apollo/client';
import {
  ENS_DOMAINS,
  ENS_REGISTRATIONS,
  ENS_SUGGESTIONS,
} from '../apollo/queries';
import { estimateGasWithPadding } from './web3';
import {
  ENSRegistrationRecords,
  ENSRegistrationTransactionType,
  getENSExecutionDetails,
} from '@rainbow-me/helpers/ens';
import { add } from '@rainbow-me/helpers/utilities';
import { ethUnits } from '@rainbow-me/references';
import { profileUtils } from '@rainbow-me/utils';

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

export const estimateENSRegisterWithConfigGasLimit = async (
  name: string,
  ownerAddress: string,
  duration: number,
  rentPrice: string
) =>
  estimateENSTransactionGasLimit({
    duration,
    name,
    ownerAddress,
    rentPrice,
    type: ENSRegistrationTransactionType.REGISTER_WITH_CONFIG,
  });

export const estimateENSCommitGasLimit = async (
  name: string,
  ownerAddress: string,
  duration: number,
  rentPrice: string
) =>
  estimateENSTransactionGasLimit({
    duration,
    name,
    ownerAddress,
    rentPrice,
    type: ENSRegistrationTransactionType.COMMIT,
  });

export const estimateENSSetTextGasLimit = async (
  name: string,
  recordKey: string,
  recordValue: string
) =>
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

export const estimateENSSetNameGasLimit = async (
  name: string,
  ownerAddress: string
) =>
  estimateENSTransactionGasLimit({
    name,
    ownerAddress,
    type: ENSRegistrationTransactionType.SET_NAME,
  });

export const estimateENSMulticallGasLimit = async (
  name: string,
  records: ENSRegistrationRecords
) =>
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
}: {
  name: string;
  type: ENSRegistrationTransactionType;
  ownerAddress?: string;
  rentPrice?: string;
  duration?: number;
  records?: ENSRegistrationRecords;
}) => {
  const { contract, methodArguments, value } = await getENSExecutionDetails({
    duration,
    name,
    ownerAddress,
    records,
    rentPrice,
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
  const commitGasLimitPromise = estimateENSCommitGasLimit(
    name,
    ownerAddress,
    duration,
    rentPrice
  );
  const setNameGasLimitPromise = estimateENSSetNameGasLimit(name, ownerAddress);
  const multicallGasLimitPromise = estimateENSMulticallGasLimit(name, {
    coinAddress: null,
    contentHash: null,
    ensAssociatedAddress: ownerAddress,
    text: [
      { key: 'key1', value: 'value1' },
      { key: 'key2', value: 'value2' },
      { key: 'key3', value: 'value3' },
    ],
  });
  const gasLimits = await Promise.all([
    commitGasLimitPromise,
    setNameGasLimitPromise,
    multicallGasLimitPromise,
  ]);
  // we need to add register gas limit manually since the gas estimation will fail since the commit tx is not sent yet
  gasLimits.push(`${ethUnits.ens_register_with_config}`);
  const gasLimit = gasLimits.reduce((a, b) => add(a || 0, b || 0));
  if (!gasLimit) return '0';
  return gasLimit;
};
