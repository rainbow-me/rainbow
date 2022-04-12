import { isEmpty } from 'lodash';
import { useCallback, useEffect, useMemo } from 'react';
import { useQueries } from 'react-query';
import { atom, useRecoilState } from 'recoil';
import useGas from './useGas';
import { useAccountSettings } from '.';
import {
  GasFeeParam,
  GasFeeParamsBySpeed,
  Records,
} from '@rainbow-me/entities';
import {
  estimateENSCommitGasLimit,
  estimateENSRenewGasLimit,
  estimateENSSetNameGasLimit,
  estimateENSSetRecordsGasLimit,
  fetchReverseRecord,
} from '@rainbow-me/handlers/ens';
import { NetworkTypes } from '@rainbow-me/helpers';
import {
  formatEstimatedNetworkFee,
  formatRentPrice,
  formatTotalRegistrationCost,
  generateSalt,
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
  default: '',
  key: 'ens.setRecordsGasLimitAtom',
});

const registerGasLimitAtom = atom({
  default: `${ethUnits.ens_register_with_config}`,
  key: 'ens.registerGasLimitAtom',
});

const setNameGasLimitAtom = atom({
  default: '',
  key: 'ens.setNameGasLimitAtom',
});

const hasReverseRecordAtom = atom({
  default: false,
  key: 'ens.hasReverseRecordAtom',
});

const gasFeeParamsAtom = atom({
  default: {
    currentBaseFee: {} as GasFeeParam,
    gasFeeParamsBySpeed: {} as GasFeeParamsBySpeed,
  },
  key: 'ens.gasFeeParams',
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
  const duration = yearsDuration * timeUnits.secs.year;

  const {
    gasFeeParamsBySpeed,
    updateTxFee,
    startPollingGasFees,
    isSufficientGas,
    isValidGas,
  } = useGas();

  const [commitGasLimit, setCommitGasLimit] = useRecoilState(
    commitGasLimitAtom
  );
  const [setRecordsGasLimit, setSetRecordsGasLimit] = useRecoilState(
    setRecordsGasLimitAtom
  );
  const [registerGasLimit, setRegisterGasLimit] = useRecoilState(
    registerGasLimitAtom
  );
  const [setNameGasLimit, setSetNameGasLimit] = useRecoilState(
    setNameGasLimitAtom
  );

  const [renewGasLimit, setRenewGasLimit] = useRecoilState(renewGasLimitAtom);

  const [hasReverseRecord, setHasReverseRecord] = useRecoilState(
    hasReverseRecordAtom
  );

  const [gasFeeParams, setGasFeeParams] = useRecoilState(gasFeeParamsAtom);

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
    if (commitGasLimit !== '') return commitGasLimit;
    if (name?.length < 3) return;
    const salt = generateSalt();
    const newCommitGasLimit =
      (await estimateENSCommitGasLimit({
        duration,
        name,
        ownerAddress: accountAddress,
        rentPrice: rentPriceInWei,
        salt,
      })) || '0';
    setCommitGasLimit(newCommitGasLimit);
    return commitGasLimit;
  }, [
    accountAddress,
    commitGasLimit,
    duration,
    name,
    rentPriceInWei,
    setCommitGasLimit,
  ]);

  const getSetRecordsGasLimit = useCallback(async () => {
    if (name?.length < 3 || !records) return;
    const newSetRecordsGasLimit =
      (await estimateENSSetRecordsGasLimit({
        name,
        records,
      })) || '0';
    setSetRecordsGasLimit(newSetRecordsGasLimit);
    return setRecordsGasLimit;
  }, [name, records, setRecordsGasLimit, setSetRecordsGasLimit]);

  const getSetNameGasLimit = useCallback(async () => {
    if (setNameGasLimit !== '') return setNameGasLimit;
    if (name?.length < 3) return;
    const newSetNameGasLimit =
      (await estimateENSSetNameGasLimit({
        name,
        ownerAddress: accountAddress,
      })) || '0';
    setSetNameGasLimit(newSetNameGasLimit);
    return setNameGasLimit;
  }, [accountAddress, name, setNameGasLimit, setSetNameGasLimit]);

  const getRenewGasLimit = useCallback(async () => {
    if (renewGasLimit !== '') return renewGasLimit;
    if (name?.length < 3) return;
    const newRenewGasLimit =
      (await estimateENSRenewGasLimit({
        duration,
        name,
        rentPrice: rentPriceInWei,
      })) || '';

    setRenewGasLimit(newRenewGasLimit);
    return setNameGasLimit;
  }, [
    duration,
    name,
    renewGasLimit,
    rentPriceInWei,
    setNameGasLimit,
    setRenewGasLimit,
  ]);

  const getReverseRecord = useCallback(async () => {
    const reverseRecord = await fetchReverseRecord(accountAddress);
    setHasReverseRecord(Boolean(reverseRecord));
    return reverseRecord;
  }, [accountAddress, setHasReverseRecord]);

  const stepGasLimit = useMemo(
    () => ({
      [REGISTRATION_STEPS.COMMIT]: commitGasLimit,
      [REGISTRATION_STEPS.RENEW]: renewGasLimit,
      [REGISTRATION_STEPS.EDIT]: setRecordsGasLimit,
      [REGISTRATION_STEPS.REGISTER]: registerGasLimit,
      [REGISTRATION_STEPS.SET_NAME]: setNameGasLimit,
      [REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION]: null,
      [REGISTRATION_STEPS.WAIT_ENS_COMMITMENT]: null,
    }),
    [
      commitGasLimit,
      registerGasLimit,
      renewGasLimit,
      setNameGasLimit,
      setRecordsGasLimit,
    ]
  );

  const fetchEIP1559GasParams = useCallback(async () => {
    const { currentBaseFee } = await getEIP1559GasParams();
    setGasFeeParams({ currentBaseFee, gasFeeParamsBySpeed });
    return { currentBaseFee, gasFeeParamsBySpeed };
  }, [setGasFeeParams, gasFeeParamsBySpeed]);

  const estimatedFee = useMemo(() => {
    const nativeAssetPrice = ethereumUtils.getPriceOfNativeAssetForNetwork(
      Network.mainnet
    );
    const { gasFeeParamsBySpeed, currentBaseFee } = gasFeeParams;
    const estimatedGasLimit =
      [
        commitGasLimit,
        setRecordsGasLimit,
        registerGasLimit,
        !hasReverseRecord && setNameGasLimit,
      ].reduce((a, b) => add(a || 0, b || 0)) || `${ethUnits.ens_registration}`;

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
    registerGasLimit,
    setNameGasLimit,
    setRecordsGasLimit,
  ]);

  const queries = useQueries([
    {
      enabled: name.length > 2,
      queryFn: getCommitGasLimit,
      queryKey: ['getCommitGasLimit', name],
    },
    {
      enabled: name.length > 2,
      queryFn: getSetRecordsGasLimit,
      queryKey: ['getSetRecordsGasLimit', name, records],
    },
    {
      enabled: name.length > 2,
      queryFn: getSetNameGasLimit,
      queryKey: ['getSetNameGasLimit', name],
    },
    {
      enabled: step === REGISTRATION_STEPS.RENEW,
      queryFn: getRenewGasLimit,
      queryKey: ['getRenewGasLimit'],
    },
    {
      queryFn: getReverseRecord,
      queryKey: ['getReverseRecord', name],
    },
    {
      queryFn: fetchEIP1559GasParams,
      queryKey: ['fetchEIP1559GasParams'],
    },
  ]);

  useEffect(() => {
    if (
      step === REGISTRATION_STEPS.COMMIT ||
      step === REGISTRATION_STEPS.REGISTER ||
      step === REGISTRATION_STEPS.EDIT ||
      step === REGISTRATION_STEPS.RENEW
    )
      startPollingGasFees();
  }, [startPollingGasFees, step]);

  useEffect(() => {
    if (stepGasLimit[step] && !isEmpty(gasFeeParamsBySpeed)) {
      updateTxFee(stepGasLimit[step], false);
    }
  }, [gasFeeParamsBySpeed, step, stepGasLimit, updateTxFee]);

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

  const isSuccess =
    !queries.map(({ status }) => status).some(a => a !== 'success') &&
    !!data?.estimatedRentPrice;
  const isLoading = queries
    .map(({ isLoading }) => isLoading)
    .reduce((a, b) => a || b);
  const isIdle = queries.map(({ isIdle }) => isIdle).reduce((a, b) => a && b);

  return {
    data,
    isIdle,
    isLoading,
    isSuccess,
  };
}
