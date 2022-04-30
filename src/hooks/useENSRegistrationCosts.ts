import { isEmpty } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueries } from 'react-query';
import { useDebounce } from 'use-debounce';
import useENSRegistration from './useENSRegistration';
import useGas from './useGas';
import usePrevious from './usePrevious';
import { useAccountSettings } from '.';
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
import { ethUnits, timeUnits } from '@rainbow-me/references';
import { ethereumUtils } from '@rainbow-me/utils';

enum QUERY_KEYS {
  GET_COMMIT_GAS_LIMIT = 'GET_COMMIT_GAS_LIMIT',
  GET_RENEW_GAS_LIMIT = 'GET_RENEW_GAS_LIMIT',
  GET_REVERSE_RECORD = 'GET_REVERSE_RECORD',
  GET_REGISTER_RAP_GAS_LIMIT = 'GET_REGISTER_RAP_GAS_LIMIT',
  GET_SET_NAME_GAS_LIMIT = 'GET_SET_NAME_GAS_LIMIT',
  GET_SET_RECORDS_GAS_LIMIT = 'GET_SET_RECORDS_GAS_LIMIT',
}

export default function useENSRegistrationCosts({
  name: inputName,
  rentPrice,
  sendReverseRecord,
  step,
  yearsDuration,
}: {
  name: string;
  rentPrice: { wei: number; perYear: { wei: number } };
  sendReverseRecord: boolean;
  step: keyof typeof REGISTRATION_STEPS;
  yearsDuration: number;
}) {
  const { nativeCurrency, accountAddress } = useAccountSettings();
  const { registrationParameters } = useENSRegistration();
  const duration = yearsDuration * timeUnits.secs.year;
  const name = inputName.replace(ENS_DOMAIN, '');
  const {
    gasFeeParamsBySpeed: useGasGasFeeParamsBySpeed,
    currentBlockParams: useGasCurrentBlockParams,
    updateTxFee,
    startPollingGasFees,
    isSufficientGas: useGasIsSufficientGas,
    isValidGas: useGasIsValidGas,
    gasLimit: useGasGasLimit,
  } = useGas();

  const [gasFeeParams, setGasFeeParams] = useState({
    currentBaseFee: useGasCurrentBlockParams?.baseFeePerGas,
    gasFeeParamsBySpeed: useGasGasFeeParamsBySpeed,
  });

  const nameUpdated = useMemo(() => {
    return registrationParameters?.name !== name && name?.length > 2;
  }, [name, registrationParameters?.name]);

  const changedRecords = useMemo(
    () => registrationParameters?.changedRecords || {},
    [registrationParameters?.changedRecords]
  );
  const [debouncedChangedRecords] = useDebounce(changedRecords, 500);
  const [currentStepGasLimit, setCurrentStepGasLimit] = useState('');

  const [isValidGas, setIsValidGas] = useState(false);
  const [isSufficientGas, setIsSufficientGas] = useState(false);

  const prevIsSufficientGas = usePrevious(isSufficientGas);
  const prevIsValidGas = usePrevious(isValidGas);

  const rentPriceInWei = rentPrice?.wei?.toString();

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
      rentPrice: rentPriceInWei,
      salt,
    });
    return newCommitGasLimit || '';
  }, [accountAddress, duration, name, rentPriceInWei]);

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
    return newRegisterRapGasLimit || '';
  }, [
    accountAddress,
    duration,
    name,
    registrationParameters?.rentPrice,
    registrationParameters?.salt,
    sendReverseRecord,
  ]);

  const getSetRecordsGasLimit = useCallback(async () => {
    if (isEmpty(debouncedChangedRecords)) return '0';
    const newSetRecordsGasLimit = await estimateENSSetRecordsGasLimit({
      name,
      records: debouncedChangedRecords,
    });
    return newSetRecordsGasLimit || '';
  }, [debouncedChangedRecords, name]);

  const getSetNameGasLimit = useCallback(async () => {
    const cleanName = registrationParameters?.name?.replace(ENS_DOMAIN, '');
    const newSetNameGasLimit = await estimateENSSetNameGasLimit({
      name: cleanName,
      ownerAddress: accountAddress,
    });
    return newSetNameGasLimit || '';
  }, [accountAddress, registrationParameters?.name]);

  const getRenewGasLimit = useCallback(async () => {
    const cleanName = registrationParameters?.name?.replace(ENS_DOMAIN, '');
    const rentPrice = await getRentPrice(cleanName, duration);
    const newRenewGasLimit = await estimateENSRenewGasLimit({
      duration,
      name: cleanName,
      rentPrice: rentPrice?.toString(),
    });
    return newRenewGasLimit || '';
  }, [registrationParameters?.name, duration]);

  const getReverseRecord = useCallback(async () => {
    const reverseRecord = await fetchReverseRecord(accountAddress);
    return Boolean(reverseRecord);
  }, [accountAddress]);

  const queries = useQueries([
    {
      enabled: step === REGISTRATION_STEPS.COMMIT && nameUpdated,
      queryFn: getCommitGasLimit,
      queryKey: [QUERY_KEYS.GET_COMMIT_GAS_LIMIT, name],
      staleTime: Infinity,
    },
    {
      enabled:
        (step === REGISTRATION_STEPS.COMMIT ||
          step === REGISTRATION_STEPS.SET_NAME) &&
        nameUpdated,
      queryFn: getSetNameGasLimit,
      queryKey: [QUERY_KEYS.GET_SET_NAME_GAS_LIMIT, name],
      staleTime: Infinity,
    },
    {
      enabled: true,
      // step === REGISTRATION_STEPS.COMMIT || step === REGISTRATION_STEPS.EDIT,
      queryFn: getSetRecordsGasLimit,
      queryKey: [
        QUERY_KEYS.GET_SET_RECORDS_GAS_LIMIT,
        name,
        debouncedChangedRecords,
      ],
      staleTime: Infinity,
    },
    {
      enabled:
        (step === REGISTRATION_STEPS.COMMIT ||
          step === REGISTRATION_STEPS.REGISTER) &&
        nameUpdated,
      queryFn: getReverseRecord,
      queryKey: [QUERY_KEYS.GET_REVERSE_RECORD, name],
      staleTime: Infinity,
    },
    {
      enabled: step === REGISTRATION_STEPS.RENEW,
      queryFn: getRenewGasLimit,
      queryKey: [
        QUERY_KEYS.GET_RENEW_GAS_LIMIT,
        registrationParameters?.name,
        duration,
      ],
      staleTime: Infinity,
    },
    {
      enabled: step === REGISTRATION_STEPS.REGISTER,
      queryFn: getRegisterRapGasLimit,
      queryKey: [QUERY_KEYS.GET_REGISTER_RAP_GAS_LIMIT, sendReverseRecord],
      staleTime: Infinity,
    },
  ]);

  const queriesByKey = useMemo(
    () => ({
      GET_COMMIT_GAS_LIMIT: queries[0],
      GET_REGISTER_RAP_GAS_LIMIT: queries[5],
      GET_RENEW_GAS_LIMIT: queries[4],
      GET_REVERSE_RECORD: queries[3],
      GET_SET_NAME_GAS_LIMIT: queries[1],
      GET_SET_RECORDS_GAS_LIMIT: queries[2],
    }),
    [queries]
  );

  const commitGasLimit = useMemo(
    () => queriesByKey.GET_COMMIT_GAS_LIMIT.data || '',
    [queriesByKey]
  );
  const renewGasLimit = useMemo(
    () => queriesByKey.GET_RENEW_GAS_LIMIT.data || '',
    [queriesByKey]
  );
  const setRecordsGasLimit = useMemo(
    () => queriesByKey.GET_SET_RECORDS_GAS_LIMIT.data || '',
    [queriesByKey.GET_SET_RECORDS_GAS_LIMIT]
  );
  const registerRapGasLimit = useMemo(
    () => queriesByKey.GET_REGISTER_RAP_GAS_LIMIT.data || '',
    [queriesByKey.GET_REGISTER_RAP_GAS_LIMIT]
  );
  const setNameGasLimit = useMemo(
    () => queriesByKey.GET_SET_NAME_GAS_LIMIT.data || '',
    [queriesByKey.GET_SET_NAME_GAS_LIMIT]
  );
  const hasReverseRecord = useMemo(
    () => queriesByKey.GET_REVERSE_RECORD.data || false,
    [queriesByKey.GET_REVERSE_RECORD]
  );

  const stepGasLimit = useMemo(
    () => ({
      [REGISTRATION_STEPS.COMMIT]: commitGasLimit,
      [REGISTRATION_STEPS.RENEW]: renewGasLimit,
      [REGISTRATION_STEPS.EDIT]: setRecordsGasLimit,
      [REGISTRATION_STEPS.REGISTER]: registerRapGasLimit,
      [REGISTRATION_STEPS.SET_NAME]: setNameGasLimit,
      [REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION]: null,
      [REGISTRATION_STEPS.WAIT_ENS_COMMITMENT]: null,
    }),
    [
      commitGasLimit,
      registerRapGasLimit,
      renewGasLimit,
      setNameGasLimit,
      setRecordsGasLimit,
    ]
  );

  const estimatedFee = useMemo(() => {
    const nativeAssetPrice = ethereumUtils.getPriceOfNativeAssetForNetwork(
      Network.mainnet
    );
    const { gasFeeParamsBySpeed, currentBaseFee } = gasFeeParams;

    let estimatedGasLimit = '';
    if (step === REGISTRATION_STEPS.COMMIT) {
      estimatedGasLimit = [
        commitGasLimit,
        setRecordsGasLimit,
        // gas limit estimat for registerWithConfig fails if there's no commit tx sent first
        `${ethUnits.ens_register_with_config}`,
        !hasReverseRecord ? setNameGasLimit : '',
      ].reduce((a, b) => add(a || 0, b || 0));
    } else if (step === REGISTRATION_STEPS.RENEW) {
      estimatedGasLimit = renewGasLimit;
    } else if (step === REGISTRATION_STEPS.SET_NAME) {
      estimatedGasLimit = setNameGasLimit;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    commitGasLimit,
    hasReverseRecord,
    nativeCurrency,
    renewGasLimit,
    setNameGasLimit,
    setRecordsGasLimit,
    step,
  ]);

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

  useEffect(() => {
    if (!currentStepGasLimit) startPollingGasFees();
  }, [currentStepGasLimit, startPollingGasFees, step]);

  useEffect(() => {
    if (
      !isEmpty(useGasGasFeeParamsBySpeed) &&
      gasFeeParams.gasFeeParamsBySpeed !== useGasGasFeeParamsBySpeed &&
      gasFeeParams.currentBaseFee !== useGasCurrentBlockParams.baseFeePerGas &&
      useGasCurrentBlockParams.baseFeePerGas
    ) {
      setGasFeeParams({
        currentBaseFee: useGasCurrentBlockParams.baseFeePerGas,
        gasFeeParamsBySpeed: useGasGasFeeParamsBySpeed,
      });
    }
  }, [
    gasFeeParams.currentBaseFee,
    gasFeeParams.gasFeeParamsBySpeed,
    setGasFeeParams,
    useGasCurrentBlockParams,
    useGasGasFeeParamsBySpeed,
  ]);

  useEffect(() => {
    if (
      stepGasLimit[step] &&
      (!useGasGasLimit || currentStepGasLimit !== stepGasLimit[step]) &&
      !isEmpty(useGasGasFeeParamsBySpeed)
    ) {
      updateTxFee(stepGasLimit?.[step], null);
      setCurrentStepGasLimit(stepGasLimit?.[step] || '');
    }
  }, [
    currentStepGasLimit,
    step,
    stepGasLimit,
    updateTxFee,
    setCurrentStepGasLimit,
    useGasGasFeeParamsBySpeed,
    useGasGasLimit,
  ]);

  const data = useMemo(() => {
    const rentPricePerYearInWei = rentPrice?.perYear?.wei?.toString();
    const nativeAssetPrice = ethereumUtils.getPriceOfNativeAssetForNetwork(
      Network.mainnet
    );

    if (rentPricePerYearInWei) {
      const rentPriceInWei = multiply(rentPricePerYearInWei, yearsDuration);
      const estimatedRentPrice = formatRentPrice(
        rentPriceInWei,
        duration,
        nativeCurrency,
        nativeAssetPrice
      );
      if (
        estimatedFee?.estimatedGasLimit &&
        estimatedFee?.estimatedNetworkFee?.amount
      ) {
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
          gasFeeParamsBySpeed: useGasGasFeeParamsBySpeed,
          hasReverseRecord,
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
    duration,
    estimatedFee,
    hasReverseRecord,
    isSufficientGas,
    isValidGas,
    nativeCurrency,
    rentPrice?.perYear?.wei,
    step,
    stepGasLimit,
    useGasGasFeeParamsBySpeed,
    yearsDuration,
  ]);

  const gasFeeReady = useMemo(
    () =>
      !isEmpty(useGasGasFeeParamsBySpeed) && !isEmpty(useGasCurrentBlockParams),
    [useGasCurrentBlockParams, useGasGasFeeParamsBySpeed]
  );

  const { isSuccess, isLoading, isIdle } = useMemo(() => {
    const statusQueries = queries.slice(0, 2);
    const isSuccess =
      !statusQueries.some(a => a.status !== 'success') &&
      !!data?.estimatedRentPrice &&
      gasFeeReady;
    const isLoading =
      statusQueries
        .map(({ isLoading }) => isLoading)
        .reduce((a, b) => a || b) && !gasFeeReady;
    const isIdle = statusQueries
      .map(({ isIdle }) => ({ isIdle }))
      .reduce((a, b) => a && b);
    return { isIdle, isLoading, isSuccess };
  }, [data?.estimatedRentPrice, gasFeeReady, queries]);

  return {
    data,
    isIdle,
    isLoading,
    isSuccess,
  };
}
