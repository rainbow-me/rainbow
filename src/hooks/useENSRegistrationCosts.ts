import { isEmpty } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { QueryCache, useQueries } from 'react-query';
import { useDebounce } from 'use-debounce';
import useENSRegistration from './useENSRegistration';
import useGas from './useGas';
import usePrevious from './usePrevious';
import { useAccountSettings } from '.';
import {
  GasFeeParam,
  GasFeeParamsBySpeed,
  Records,
} from '@rainbow-me/entities';
import {
  estimateENSCommitGasLimit,
  estimateENSRegisterSetRecordsAndNameGasLimit,
  estimateENSRenewGasLimit,
  estimateENSSetNameGasLimit,
  estimateENSSetRecordsGasLimit,
  fetchReverseRecord,
} from '@rainbow-me/handlers/ens';
import { NetworkTypes } from '@rainbow-me/helpers';
import {
  ENS_DOMAIN,
  formatEstimatedNetworkFee,
  formatRentPrice,
  formatTotalRegistrationCost,
  generateSalt,
  getRentPrice,
  REGISTRATION_STEPS,
} from '@rainbow-me/helpers/ens';
import { Network } from '@rainbow-me/helpers/networkTypes';
import {
  add,
  addBuffer,
  addDisplay,
  fromWei,
  greaterThanOrEqualTo,
  multiply,
} from '@rainbow-me/helpers/utilities';
import { queryClient } from '@rainbow-me/react-query/queryClient';
import { getEIP1559GasParams } from '@rainbow-me/redux/gas';
import { ethUnits, timeUnits } from '@rainbow-me/references';
import { ethereumUtils } from '@rainbow-me/utils';

enum QUERY_KEYS {
  GET_COMMIT_GAS_LIMIT = 'getCommitGasLimit',
  GET_GAS_PARAMS = 'getGasParams',
  GET_SET_RECORDS_GAS_LIMIT = 'getSetRecordsGasLimit',
  GET_SET_NAME_GAS_LIMIT = 'getSetNameGasLimit',
  GET_RENEW_GAS_LIMIT = 'getRenewGasLimit',
  GET_REGISTER_RAP_GAS_LIMIT = 'getRegisterRapGasLimit',
  GET_REVERSE_RECORD = 'getReverseRecord',
}

export default function useENSRegistrationCosts({
  yearsDuration,
  name,
  rentPrice,
  sendReverseRecord,
  records,
  step,
}: {
  yearsDuration: number;
  name: string;
  step: keyof typeof REGISTRATION_STEPS;
  sendReverseRecord: boolean;
  rentPrice: { wei: number; perYear: { wei: number } };
  records?: Records;
}) {
  const { nativeCurrency, accountAddress } = useAccountSettings();
  const { registrationParameters } = useENSRegistration();
  const [currentStepGasLimit, setCurrentStepGasLimit] = useState('');

  const [debouncedChangedRecords] = useDebounce(
    registrationParameters?.changedRecords || {},
    500
  );

  const {
    gasFeeParamsBySpeed,
    currentBlockParams,
    updateTxFee,
    startPollingGasFees,
    isSufficientGas: useGasIsSufficientGas,
    isValidGas: useGasIsValidGas,
  } = useGas();

  const [isValidGas, setIsValidGas] = useState(useGasIsValidGas);
  const [isSufficientGas, setIsSufficientGas] = useState(useGasIsSufficientGas);

  const prevIsSufficientGas = usePrevious(isSufficientGas);
  const prevIsValidGas = usePrevious(isValidGas);

  const duration = useMemo(() => yearsDuration * timeUnits.secs.year, [
    yearsDuration,
  ]);

  const nameUpdated = useMemo(() => {
    return registrationParameters?.name !== name && name.length > 2;
  }, [name, registrationParameters?.name]);

  const recordsUpdated = useMemo(() => {
    return JSON.stringify(debouncedChangedRecords) !== JSON.stringify(records);
  }, [records, debouncedChangedRecords]);

  const stepGasLimit = useMemo(
    () => ({
      [REGISTRATION_STEPS.COMMIT]: queryClient.getQueryData(
        QUERY_KEYS.GET_COMMIT_GAS_LIMIT
      ) as string,
      [REGISTRATION_STEPS.RENEW]: queryClient.getQueryData(
        QUERY_KEYS.GET_RENEW_GAS_LIMIT
      ) as string,
      [REGISTRATION_STEPS.EDIT]: queryClient.getQueryData(
        QUERY_KEYS.GET_SET_RECORDS_GAS_LIMIT
      ) as string,
      [REGISTRATION_STEPS.REGISTER]: queryClient.getQueryData(
        QUERY_KEYS.GET_REGISTER_RAP_GAS_LIMIT
      ) as string,
      [REGISTRATION_STEPS.SET_NAME]: queryClient.getQueryData(
        QUERY_KEYS.GET_SET_NAME_GAS_LIMIT
      ) as string,
      [REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION]: null,
      [REGISTRATION_STEPS.WAIT_ENS_COMMITMENT]: null,
    }),
    []
  );

  useEffect(() => {
    if (
      useGasIsSufficientGas !== null &&
      useGasIsSufficientGas !== prevIsSufficientGas
    ) {
      setIsSufficientGas(useGasIsSufficientGas);
    }
  }, [prevIsSufficientGas, setIsSufficientGas, useGasIsSufficientGas]);

  useEffect(() => {
    if (useGasIsValidGas !== null && useGasIsValidGas !== prevIsValidGas) {
      setIsValidGas(useGasIsValidGas);
    }
  }, [prevIsSufficientGas, prevIsValidGas, setIsValidGas, useGasIsValidGas]);

  const checkIfSufficientEth = useCallback((wei: string) => {
    const nativeAsset = ethereumUtils.getNetworkNativeAsset(
      NetworkTypes.mainnet
    );
    const balanceAmount = nativeAsset?.balance?.amount || 0;
    const txFeeAmount = fromWei(wei);
    const isSufficientGas = greaterThanOrEqualTo(balanceAmount, txFeeAmount);
    return isSufficientGas;
  }, []);

  const getCommitGasLimit = useCallback(async () => {
    const salt = generateSalt();
    const newCommitGasLimit = await estimateENSCommitGasLimit({
      duration,
      name,
      ownerAddress: accountAddress,
      rentPrice: rentPrice?.wei?.toString(),
      salt,
    });
    return newCommitGasLimit;
  }, [accountAddress, duration, name, rentPrice?.wei]);

  const getRegisterRapGasLimit = useCallback(async () => {
    const newRegisterRapGasLimit = await estimateENSRegisterSetRecordsAndNameGasLimit(
      {
        duration,
        name,
        ownerAddress: accountAddress,
        rentPrice: registrationParameters?.rentPrice,
        salt: registrationParameters?.salt,
        setReverseRecord: sendReverseRecord,
      }
    );
    return newRegisterRapGasLimit;
  }, [
    accountAddress,
    duration,
    name,
    registrationParameters?.rentPrice,
    registrationParameters?.salt,
    sendReverseRecord,
  ]);

  const getSetRecordsGasLimit = useCallback(async () => {
    if (name?.length < 3 || !debouncedChangedRecords) return;
    const newSetRecordsGasLimit = await estimateENSSetRecordsGasLimit({
      ...(step === REGISTRATION_STEPS.EDIT
        ? { ownerAddress: accountAddress }
        : {}),
      name,
      records: debouncedChangedRecords,
    });
    return newSetRecordsGasLimit;
  }, [accountAddress, debouncedChangedRecords, name, step]);

  const getSetNameGasLimit = useCallback(async () => {
    const newSetNameGasLimit = await estimateENSSetNameGasLimit({
      name,
      ownerAddress: accountAddress,
    });
    return newSetNameGasLimit;
  }, [accountAddress, name]);

  const getRenewGasLimit = useCallback(async () => {
    const rentPrice = await getRentPrice(
      name.replace(ENS_DOMAIN, ''),
      duration
    );
    const newRenewGasLimit = await estimateENSRenewGasLimit({
      duration,
      name,
      rentPrice: rentPrice?.toString(),
    });
    return newRenewGasLimit;
  }, [duration, name]);

  const getReverseRecord = useCallback(async () => {
    const reverseRecord = await fetchReverseRecord(accountAddress);
    return Boolean(reverseRecord);
  }, [accountAddress]);

  const getGasParams = useCallback(async () => {
    const { gasFeeParamsBySpeed, currentBaseFee } = await getEIP1559GasParams();
    return { currentBaseFee, gasFeeParamsBySpeed };
  }, []);

  const estimatedFee = useMemo(() => {
    const nativeAssetPrice = ethereumUtils.getPriceOfNativeAssetForNetwork(
      Network.mainnet
    );
    const { gasFeeParamsBySpeed, currentBaseFee } = queryClient.getQueryData(
      QUERY_KEYS.GET_GAS_PARAMS
    ) as {
      gasFeeParamsBySpeed: GasFeeParamsBySpeed;
      currentBaseFee: GasFeeParam;
    };

    let estimatedGasLimit = '';
    if (step === REGISTRATION_STEPS.COMMIT) {
      const commitGasLimit = queryClient.getQueryData(
        QUERY_KEYS.GET_COMMIT_GAS_LIMIT
      ) as string;
      const setRecordsGasLimit = queryClient.getQueryData(
        QUERY_KEYS.GET_SET_RECORDS_GAS_LIMIT
      ) as string;
      const hasReverseRecord = queryClient.getQueryData(
        QUERY_KEYS.GET_REVERSE_RECORD
      ) as boolean;
      const setNameGasLimit = queryClient.getQueryData(
        QUERY_KEYS.GET_SET_NAME_GAS_LIMIT
      ) as string;
      estimatedGasLimit = [
        commitGasLimit,
        setRecordsGasLimit,
        `${ethUnits.ens_register_with_config}`,
        !hasReverseRecord ? setNameGasLimit : '',
      ].reduce((a, b) => add(a || 0, b || 0));
    } else if (step === REGISTRATION_STEPS.RENEW) {
      estimatedGasLimit = queryClient.getQueryData(
        QUERY_KEYS.GET_RENEW_GAS_LIMIT
      ) as string;
    }

    const formattedEstimatedNetworkFee = formatEstimatedNetworkFee(
      estimatedGasLimit,
      currentBaseFee?.gwei,
      gasFeeParamsBySpeed?.normal?.maxPriorityFeePerGas?.gwei,
      nativeCurrency,
      nativeAssetPrice
    );

    return {
      estimatedGasLimit,
      estimatedNetworkFee: formattedEstimatedNetworkFee,
    };
  }, [step, nativeCurrency]);

  const queries = useQueries([
    {
      enabled: nameUpdated,
      queryFn: getCommitGasLimit,
      queryKey: [QUERY_KEYS.GET_COMMIT_GAS_LIMIT, name],
    },
    {
      enabled: recordsUpdated || nameUpdated,
      queryFn: getSetRecordsGasLimit,
      queryKey: [
        QUERY_KEYS.GET_SET_RECORDS_GAS_LIMIT,
        name,
        debouncedChangedRecords,
      ],
    },
    {
      enabled: nameUpdated,
      queryFn: getSetNameGasLimit,
      queryKey: [QUERY_KEYS.GET_SET_NAME_GAS_LIMIT, name],
    },
    {
      queryFn: getGasParams,
      queryKey: [QUERY_KEYS.GET_GAS_PARAMS, name, records],
    },
    {
      enabled: step === REGISTRATION_STEPS.RENEW,
      queryFn: getRenewGasLimit,
      queryKey: [QUERY_KEYS.GET_RENEW_GAS_LIMIT],
    },
    {
      enabled: nameUpdated,
      queryFn: getReverseRecord,
      queryKey: [QUERY_KEYS.GET_REVERSE_RECORD, name],
    },
    {
      enabled: step === REGISTRATION_STEPS.REGISTER,
      queryFn: getRegisterRapGasLimit,
      queryKey: [QUERY_KEYS.GET_REGISTER_RAP_GAS_LIMIT, sendReverseRecord],
    },
  ]);

  useEffect(() => {
    if (!currentStepGasLimit) startPollingGasFees();
  }, [currentStepGasLimit, startPollingGasFees, step]);

  useEffect(() => {
    if (
      stepGasLimit[step] &&
      currentStepGasLimit !== stepGasLimit[step] &&
      !isEmpty(gasFeeParamsBySpeed)
    ) {
      updateTxFee(stepGasLimit[step], null);
      setCurrentStepGasLimit(stepGasLimit?.[step] || '');
    }
  }, [
    gasFeeParamsBySpeed,
    currentStepGasLimit,
    step,
    stepGasLimit,
    updateTxFee,
    setCurrentStepGasLimit,
  ]);

  const data = useMemo(() => {
    const rentPricePerYearInWei = rentPrice?.perYear?.wei?.toString();
    const nativeAssetPrice = ethereumUtils.getPriceOfNativeAssetForNetwork(
      Network.mainnet
    );

    const gasFeeParams = {
      currentBaseFee: currentBlockParams?.baseFeePerGas,
      gasFeeParamsBySpeed,
    };

    if (rentPricePerYearInWei) {
      const rentPriceInWei = multiply(rentPricePerYearInWei, yearsDuration);
      const estimatedRentPrice = formatRentPrice(
        rentPriceInWei,
        duration,
        nativeCurrency,
        nativeAssetPrice
      );

      if (estimatedFee) {
        const weiEstimatedTotalCost = add(
          estimatedFee.estimatedNetworkFee.wei,
          estimatedRentPrice.wei.toString()
        );
        const displayEstimatedTotalCost = addDisplay(
          estimatedFee.estimatedNetworkFee.display,
          estimatedRentPrice.total.display
        );
        const estimatedTotalRegistrationCost = formatTotalRegistrationCost(
          weiEstimatedTotalCost,
          nativeCurrency,
          nativeAssetPrice
        );

        const isSufficientGasForRegistration = checkIfSufficientEth(
          addBuffer(
            add(
              estimatedFee?.estimatedNetworkFee?.wei,
              estimatedRentPrice?.wei?.toString()
            ),
            1.1
          )
        );

        return {
          estimatedGasLimit: estimatedFee.estimatedGasLimit,
          estimatedNetworkFee: estimatedFee.estimatedNetworkFee,
          estimatedRentPrice,
          estimatedTotalRegistrationCost: {
            ...estimatedTotalRegistrationCost,
            display: displayEstimatedTotalCost,
          },
          gasFeeParamsBySpeed: gasFeeParams.gasFeeParamsBySpeed,
          isSufficientGas,
          isSufficientGasForRegistration,
          isSufficientGasForStep:
            stepGasLimit[step] && isValidGas && isSufficientGas,
          isValidGas,
          stepGasLimit: stepGasLimit[step],
        };
      }

      return { estimatedRentPrice };
    }
  }, [
    checkIfSufficientEth,
    currentBlockParams?.baseFeePerGas,
    duration,
    estimatedFee,
    gasFeeParamsBySpeed,
    isSufficientGas,
    isValidGas,
    nativeCurrency,
    rentPrice?.perYear?.wei,
    step,
    stepGasLimit,
    yearsDuration,
  ]);

  const statusQueries = queries.slice(0, 3);
  const isSuccess =
    !statusQueries.some(a => a.status !== 'success') &&
    !!data?.estimatedRentPrice;
  const isLoading = statusQueries
    .map(({ isLoading }) => isLoading)
    .reduce((a, b) => a || b);
  const isIdle = statusQueries
    .map(({ isIdle }) => ({ isIdle }))
    .reduce((a, b) => a && b);

  return {
    data,
    isIdle,
    isLoading,
    isSuccess,
  };
}
