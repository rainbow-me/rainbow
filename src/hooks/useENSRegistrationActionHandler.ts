import { differenceInSeconds } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  ENSActionParameters,
  getENSRapEstimationByType,
  RapActionTypes,
} from '../raps/common';
import { useAccountSettings, useCurrentNonce, useENSProfile } from '.';
import { RegistrationParameters } from '@rainbow-me/entities';
import { web3Provider } from '@rainbow-me/handlers/web3';
import {
  ENS_DOMAIN,
  generateSalt,
  getRentPrice,
} from '@rainbow-me/helpers/ens';
import { loadWallet } from '@rainbow-me/model/wallet';
import { executeRap } from '@rainbow-me/raps';
import { updateTransactionRegistrationParameters } from '@rainbow-me/redux/ensRegistration';
import { timeUnits } from '@rainbow-me/references';

enum REGISTRATION_STEPS {
  COMMIT = 'COMMIT',
  WAIT_COMMIT_CONFIRMATION = 'WAIT_COMMIT_CONFIRMATION',
  WAIT_ENS_COMMITMENT = 'WAIT_ENS_COMMITMENT',
  REGISTER = 'REGISTER',
  EDIT = 'EDIT',
}

const ENS_SECONDS_WAIT = 60;

export default function useENSRegistrationActionHandler(
  {
    yearsDuration,
  }: {
    yearsDuration: number;
  } = {} as any
) {
  const dispatch = useDispatch();
  const { accountAddress, network } = useAccountSettings();
  const getNextNonce = useCurrentNonce(accountAddress, network);
  const { registrationParameters, mode } = useENSProfile();
  const [stepGasLimit, setStepGasLimit] = useState<string | null>(null);
  const [
    secondsSinceCommitConfirmed,
    setSecondsSinceCommitConfirmed,
  ] = useState(
    registrationParameters?.commitTransactionConfirmedAt
      ? differenceInSeconds(
          Date.now(),
          registrationParameters.commitTransactionConfirmedAt
        )
      : -1
  );

  const commitAction = useCallback(
    async (callback: () => void) => {
      const wallet = await loadWallet();
      if (!wallet) {
        return;
      }
      const nonce = await getNextNonce();
      const salt = generateSalt();

      const commitEnsRegistrationParameters: ENSActionParameters = {
        ...registrationParameters,
        duration: yearsDuration * timeUnits.secs.year,
        nonce,
        ownerAddress: accountAddress,
        records: registrationParameters.changedRecords,
        salt,
      };

      await executeRap(
        wallet,
        RapActionTypes.commitENS,
        commitEnsRegistrationParameters,
        callback
      );
    },
    [accountAddress, yearsDuration, getNextNonce, registrationParameters]
  );

  const registerAction = useCallback(
    async (callback: () => void) => {
      const {
        name,
        duration,
        changedRecords,
      } = registrationParameters as RegistrationParameters;
      const wallet = await loadWallet();
      if (!wallet) {
        return;
      }

      const nonce = await getNextNonce();
      const rentPrice = await getRentPrice(
        name.replace(ENS_DOMAIN, ''),
        duration
      );

      const registerEnsRegistrationParameters: ENSActionParameters = {
        ...registrationParameters,
        nonce,
        ownerAddress: accountAddress,
        records: changedRecords,
        rentPrice: rentPrice.toString(),
        setReverseRecord: true,
      };

      await executeRap(
        wallet,
        RapActionTypes.registerENS,
        registerEnsRegistrationParameters,
        callback
      );
    },
    [accountAddress, getNextNonce, registrationParameters]
  );

  const setRecordsAction = useCallback(
    async (callback: () => void) => {
      const wallet = await loadWallet();
      if (!wallet) {
        return;
      }
      const nonce = await getNextNonce();

      const setRecordsEnsRegistrationParameters: ENSActionParameters = {
        ...registrationParameters,
        nonce,
        ownerAddress: accountAddress,
        records: registrationParameters.changedRecords,
      };

      await executeRap(
        wallet,
        RapActionTypes.setRecordsENS,
        setRecordsEnsRegistrationParameters,
        callback
      );
    },
    [accountAddress, getNextNonce, registrationParameters]
  );

  const commitEstimateGasLimit = useCallback(async () => {
    const salt = generateSalt();
    const duration = yearsDuration * timeUnits.secs.year;
    const rentPrice = await getRentPrice(
      registrationParameters.name.replace(ENS_DOMAIN, ''),
      duration
    );
    const gasLimit = await getENSRapEstimationByType(RapActionTypes.commitENS, {
      ...registrationParameters,
      duration,
      ownerAddress: accountAddress,
      rentPrice: rentPrice.toString(),
      salt,
    });
    return gasLimit;
  }, [accountAddress, registrationParameters, yearsDuration]);

  const registerEstimateGasLimit = useCallback(async () => {
    const gasLimit = await getENSRapEstimationByType(
      RapActionTypes.registerENS,
      {
        ...registrationParameters,
        duration: yearsDuration * timeUnits.secs.year,
        ownerAddress: accountAddress,
        setReverseRecord: true,
      }
    );
    return gasLimit;
  }, [accountAddress, registrationParameters, yearsDuration]);

  const setRecordsEstimateGasLimit = useCallback(async () => {
    const gasLimit = await getENSRapEstimationByType(
      RapActionTypes.setRecordsENS,
      {
        ...registrationParameters,
        ownerAddress: accountAddress,
      }
    );
    return gasLimit;
  }, [accountAddress, registrationParameters]);

  const registrationStep = useMemo(() => {
    if (mode === 'edit') return REGISTRATION_STEPS.EDIT;
    // still waiting for the COMMIT tx to be sent
    if (!registrationParameters.commitTransactionHash)
      return REGISTRATION_STEPS.COMMIT;
    // COMMIT tx sent, but not confirmed yet
    if (!registrationParameters.commitTransactionConfirmedAt)
      return REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION;
    // COMMIT tx was confirmed but 60 secs haven't passed yet
    if (secondsSinceCommitConfirmed < ENS_SECONDS_WAIT)
      return REGISTRATION_STEPS.WAIT_ENS_COMMITMENT;

    return REGISTRATION_STEPS.REGISTER;
  }, [mode, registrationParameters, secondsSinceCommitConfirmed]);

  const actions = useMemo(
    () => ({
      [REGISTRATION_STEPS.COMMIT]: commitAction,
      [REGISTRATION_STEPS.EDIT]: setRecordsAction,
      [REGISTRATION_STEPS.REGISTER]: registerAction,
      [REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION]: () => null,
      [REGISTRATION_STEPS.WAIT_ENS_COMMITMENT]: () => null,
    }),
    [commitAction, registerAction, setRecordsAction]
  );

  const estimateGasLimitActions = useMemo(
    () => ({
      [REGISTRATION_STEPS.COMMIT]: commitEstimateGasLimit,
      [REGISTRATION_STEPS.REGISTER]: registerEstimateGasLimit,
      [REGISTRATION_STEPS.EDIT]: setRecordsEstimateGasLimit,
      [REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION]: () => null,
      [REGISTRATION_STEPS.WAIT_ENS_COMMITMENT]: () => null,
    }),
    [
      commitEstimateGasLimit,
      registerEstimateGasLimit,
      setRecordsEstimateGasLimit,
    ]
  );

  const watchCommitTransaction = useCallback(async () => {
    let confirmed = false;
    try {
      const tx = await web3Provider.getTransaction(
        registrationParameters?.commitTransactionHash || ''
      );
      const block = await web3Provider.getBlock(tx.blockHash || '');
      const blockTimestamp = block?.timestamp;
      if (blockTimestamp) {
        const commitTransactionConfirmedAt = blockTimestamp * 1000;
        const now = Date.now();
        const secs = differenceInSeconds(now, commitTransactionConfirmedAt);
        setSecondsSinceCommitConfirmed(secs);
        dispatch(
          updateTransactionRegistrationParameters(accountAddress, {
            commitTransactionConfirmedAt,
          })
        );
        confirmed = true;
      }
    } catch (e) {
      //
    }
    return confirmed;
  }, [accountAddress, dispatch, registrationParameters?.commitTransactionHash]);

  const startPollingWatchCommitTransaction = useCallback(async () => {
    if (registrationStep !== REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION)
      return;

    const confirmed = await watchCommitTransaction();
    if (!confirmed) {
      setTimeout(() => startPollingWatchCommitTransaction(), 10000);
    }
  }, [registrationStep, watchCommitTransaction]);

  useEffect(() => {
    const estimateGasLimit = async () => {
      const estimate = estimateGasLimitActions[registrationStep];
      const gasLimit = (await estimate?.()) || null;
      setStepGasLimit(gasLimit);
    };
    estimateGasLimit();
  }, [estimateGasLimitActions, registrationStep]);

  useEffect(() => {
    if (registrationStep === REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION) {
      startPollingWatchCommitTransaction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrationStep]);

  useEffect(() => {
    let interval: NodeJS.Timer;
    if (registrationStep === REGISTRATION_STEPS.WAIT_ENS_COMMITMENT) {
      interval = setInterval(() => {
        setSecondsSinceCommitConfirmed(seconds => seconds + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [registrationStep, secondsSinceCommitConfirmed]);

  return {
    action: actions[registrationStep],
    step: registrationStep,
    stepGasLimit,
  };
}
