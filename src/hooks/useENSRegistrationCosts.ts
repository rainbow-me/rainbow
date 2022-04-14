import { isEmpty } from 'lodash';
import { useCallback, useEffect, useMemo } from 'react';
import { useQueries } from 'react-query';
import { atom, useRecoilState } from 'recoil';
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
import { getEIP1559GasParams } from '@rainbow-me/redux/gas';
import { ethUnits, timeUnits } from '@rainbow-me/references';
import { ethereumUtils } from '@rainbow-me/utils';

const commitGasLimitAtom = atom({
  default: '',
  key: 'ens.commitGasLimit',
});

const renewGasLimitAtom = atom({
  default: '',
  key: 'ens.renewGasLimitAtom',
});

const setRecordsGasLimitAtom = atom({
  default: ``,
  key: 'ens.setRecordsGasLimitAtom',
});

const registerRapGasLimitAtom = atom({
  default: ``,
  key: 'ens.registerRapGasLimitAtom',
});

const setNameGasLimitAtom = atom({
  default: '',
  key: 'ens.setNameGasLimitAtom',
});

const hasReverseRecordAtom = atom({
  default: false,
  key: 'ens.hasReverseRecordAtom',
});

const isSufficientGasAtom = atom({
  default: false,
  key: 'ens.iseSufficientGasAtom',
});

const isValidGasAtom = atom({
  default: false,
  key: 'ens.isValidGasAtom',
});

const gasFeeParamsAtom = atom({
  default: {
    currentBaseFee: {} as GasFeeParam,
    gasFeeParamsBySpeed: {} as GasFeeParamsBySpeed,
  },
  key: 'ens.gasFeeParams',
});

const currentStepGasLimitAtom = atom({
  default: '',
  key: 'ens.currentStepGasLimitAtom',
});

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
  const duration = yearsDuration * timeUnits.secs.year;

  const {
    gasFeeParamsBySpeed: useGasGasFeeParamsBySpeed,
    currentBlockParams: useGasCurrentBlockParams,
    updateTxFee,
    startPollingGasFees,
    isSufficientGas: useGasIsSufficientGas,
    isValidGas: useGasIsValidGas,
  } = useGas();

  const nameUpdated = useMemo(() => {
    return registrationParameters?.name !== name && name.length > 2;
  }, [name, registrationParameters?.name]);

  const [debouncedChangedRecords] = useDebounce(
    registrationParameters?.changedRecords || {},
    500
  );
  const recordsUpdated = useMemo(() => {
    return JSON.stringify(debouncedChangedRecords) !== JSON.stringify(records);
  }, [records, debouncedChangedRecords]);

  const [commitGasLimit, setCommitGasLimit] = useRecoilState(
    commitGasLimitAtom
  );
  const [setRecordsGasLimit, setSetRecordsGasLimit] = useRecoilState(
    setRecordsGasLimitAtom
  );
  const [registerRapGasLimit, setRegisterRapGasLimit] = useRecoilState(
    registerRapGasLimitAtom
  );

  const [setNameGasLimit, setSetNameGasLimit] = useRecoilState(
    setNameGasLimitAtom
  );
  const [renewGasLimit, setRenewGasLimit] = useRecoilState(renewGasLimitAtom);
  const [hasReverseRecord, setHasReverseRecord] = useRecoilState(
    hasReverseRecordAtom
  );
  const [currentStepGasLimit, setCurrentStepGasLimit] = useRecoilState(
    currentStepGasLimitAtom
  );
  const [gasFeeParams, setGasFeeParams] = useRecoilState(gasFeeParamsAtom);
  const [isValidGas, setIsValidGas] = useRecoilState(isValidGasAtom);
  const [isSufficientGas, setIsSufficientGas] = useRecoilState(
    isSufficientGasAtom
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

  const prevIsSufficientGas = usePrevious(isSufficientGas);
  const prevIsValidGas = usePrevious(isValidGas);

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
    newCommitGasLimit && setCommitGasLimit(newCommitGasLimit);
    return newCommitGasLimit;
  }, [accountAddress, duration, name, rentPriceInWei, setCommitGasLimit]);

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
    newRegisterRapGasLimit && setRegisterRapGasLimit(newRegisterRapGasLimit);
    return newRegisterRapGasLimit;
  }, [
    accountAddress,
    duration,
    name,
    registrationParameters?.rentPrice,
    registrationParameters?.salt,
    sendReverseRecord,
    setRegisterRapGasLimit,
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
    newSetRecordsGasLimit && setSetRecordsGasLimit(newSetRecordsGasLimit);
    return newSetRecordsGasLimit;
  }, [
    accountAddress,
    debouncedChangedRecords,
    name,
    setSetRecordsGasLimit,
    step,
  ]);

  const getSetNameGasLimit = useCallback(async () => {
    const newSetNameGasLimit = await estimateENSSetNameGasLimit({
      name,
      ownerAddress: accountAddress,
    });
    newSetNameGasLimit && setSetNameGasLimit(newSetNameGasLimit);
    return setNameGasLimit;
  }, [accountAddress, name, setNameGasLimit, setSetNameGasLimit]);

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
    newRenewGasLimit && setRenewGasLimit(newRenewGasLimit);
    return newRenewGasLimit;
  }, [duration, name, setRenewGasLimit]);

  const getReverseRecord = useCallback(async () => {
    const reverseRecord = await fetchReverseRecord(accountAddress);
    setHasReverseRecord(Boolean(reverseRecord));
    return reverseRecord;
  }, [accountAddress, setHasReverseRecord]);

  const getGasParams = useCallback(async () => {
    const { gasFeeParamsBySpeed, currentBaseFee } = await getEIP1559GasParams();
    setGasFeeParams({ currentBaseFee, gasFeeParamsBySpeed });
    return { currentBaseFee, gasFeeParamsBySpeed };
  }, [setGasFeeParams]);

  const estimatedFee = useMemo(() => {
    const nativeAssetPrice = ethereumUtils.getPriceOfNativeAssetForNetwork(
      Network.mainnet
    );
    const { gasFeeParamsBySpeed, currentBaseFee } = gasFeeParams;

    const estimatedGasLimit =
      step === REGISTRATION_STEPS.COMMIT
        ? [
            commitGasLimit,
            setRecordsGasLimit,
            `${ethUnits.ens_register_with_config}`,
            !hasReverseRecord && setNameGasLimit,
          ].reduce((a, b) => add(a || 0, b || 0)) ||
          `${ethUnits.ens_registration}`
        : step === REGISTRATION_STEPS.RENEW
        ? renewGasLimit
        : '';

    const formattedEstimatedNetworkFee = formatEstimatedNetworkFee(
      estimatedGasLimit,
      currentBaseFee.gwei,
      gasFeeParamsBySpeed?.normal?.maxPriorityFeePerGas?.gwei,
      nativeCurrency,
      nativeAssetPrice
    );

    return {
      estimatedGasLimit,
      estimatedNetworkFee: formattedEstimatedNetworkFee,
    };
  }, [
    commitGasLimit,
    gasFeeParams,
    hasReverseRecord,
    nativeCurrency,
    renewGasLimit,
    setNameGasLimit,
    setRecordsGasLimit,
    step,
  ]);

  const queries = useQueries([
    {
      enabled: nameUpdated,
      queryFn: getCommitGasLimit,
      queryKey: ['getCommitGasLimit', name],
    },
    {
      enabled: recordsUpdated || nameUpdated,
      queryFn: getSetRecordsGasLimit,
      queryKey: ['getSetRecordsGasLimit', name, debouncedChangedRecords],
    },
    {
      enabled: nameUpdated,
      queryFn: getSetNameGasLimit,
      queryKey: ['getSetNameGasLimit', name],
    },
    {
      queryFn: getGasParams,
      queryKey: ['getGasParams'],
    },
    {
      enabled: step === REGISTRATION_STEPS.RENEW,
      queryFn: getRenewGasLimit,
      queryKey: ['getRenewGasLimit'],
    },
    {
      enabled: nameUpdated,
      queryFn: getReverseRecord,
      queryKey: ['getReverseRecord', name],
    },
    {
      enabled: step === REGISTRATION_STEPS.REGISTER,
      queryFn: getRegisterRapGasLimit,
      queryKey: ['getRegisterRapGasLimit', sendReverseRecord],
    },
  ]);

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
      currentStepGasLimit !== stepGasLimit[step] &&
      !isEmpty(gasFeeParams?.gasFeeParamsBySpeed)
    ) {
      updateTxFee(stepGasLimit[step], null);
      setCurrentStepGasLimit(stepGasLimit?.[step] || '');
    }
  }, [
    currentStepGasLimit,
    step,
    stepGasLimit,
    updateTxFee,
    setCurrentStepGasLimit,
    gasFeeParams.gasFeeParamsBySpeed,
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
    duration,
    estimatedFee,
    gasFeeParams.gasFeeParamsBySpeed,
    isSufficientGas,
    isValidGas,
    nativeCurrency,
    rentPrice?.perYear?.wei,
    step,
    stepGasLimit,
    yearsDuration,
  ]);

  const statusQueries = queries.slice(0, 4);
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
