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
  ENSRegistrationStepType,
  getENSExecutionDetails,
} from '@rainbow-me/helpers/ens';
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

export const estimateENSRegisterGasLimit = async (
  name: string,
  accountAddress: string,
  duration: number,
  rentPrice: string
) => {
  const { contract, methodArguments, value } = getENSExecutionDetails({
    accountAddress,
    duration,
    name,
    rentPrice,
    type: ENSRegistrationStepType.REGISTER_WITH_CONFIG,
  });

  const txPayload = {
    from: accountAddress,
    ...(value ? { value } : {}),
  };

  const gasLimit = await estimateGasWithPadding(
    txPayload,
    contract?.estimateGas[ENSRegistrationStepType.REGISTER_WITH_CONFIG],
    methodArguments
  );
  return gasLimit;
};

export const estimateENSCommitGasLimit = async (
  name: string,
  accountAddress: string,
  duration: number,
  rentPrice: string
) => {
  const { contract, methodArguments } = getENSExecutionDetails({
    accountAddress,
    duration,
    name,
    rentPrice,
    type: ENSRegistrationStepType.COMMIT,
  });

  const txPayload = {
    from: accountAddress,
  };

  const gasLimit = await estimateGasWithPadding(
    txPayload,
    contract?.estimateGas[ENSRegistrationStepType.COMMIT],
    methodArguments
  );

  return gasLimit;
};

export const estimateENSSetTextGasLimit = async (
  name: string,
  accountAddress: string,
  recordKey: string,
  recordValue: string
) => {
  const { contract, methodArguments } = getENSExecutionDetails({
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
    type: ENSRegistrationStepType.SET_TEXT,
  });

  const txPayload = { from: accountAddress };

  const gasLimit = await estimateGasWithPadding(
    txPayload,
    contract?.estimateGas[ENSRegistrationStepType.SET_TEXT],
    methodArguments
  );

  return gasLimit;
};

export const estimateENSMulticallGasLimit = async (
  name: string,
  accountAddress: string,
  records: ENSRegistrationRecords
) => {
  const { contract, methodArguments } = getENSExecutionDetails({
    name,
    records,
    type: ENSRegistrationStepType.MULTICALL,
  });

  const txPayload = { from: accountAddress };

  const gasLimit = await estimateGasWithPadding(
    txPayload,
    contract?.estimateGas[ENSRegistrationStepType.MULTICALL],
    methodArguments
  );

  return gasLimit;
};
