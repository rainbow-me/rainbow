import { differenceInSeconds } from 'date-fns';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  ENSActionParameters,
  getENSRapEstimationByType,
  RapActionTypes,
} from '../raps/common';
import { useAccountSettings, useCurrentNonce, useENSProfile } from '.';
import { RegistrationParameters } from '@rainbow-me/entities';
import { web3Provider } from '@rainbow-me/handlers/web3';
import { generateSalt, getRentPrice } from '@rainbow-me/helpers/ens';
import { loadWallet } from '@rainbow-me/model/wallet';
import { executeRap } from '@rainbow-me/raps';
import { updateTransactionRegistrationParameters } from '@rainbow-me/redux/ensRegistration';
import { timeUnits } from '@rainbow-me/references';

enum REGISTRATION_STEPS {
  COMMIT = 'COMMIT',
  WAIT_COMMIT_CONFIRMATION = 'WAIT_COMMIT_CONFIRMATION',
  WAIT_ENS_COMMITMENT = 'WAIT_ENS_COMMITMENT',
  REGISTER = 'REGISTER',
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
  const { registrationParameters } = useENSProfile();
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

  let readyToConfirm = useRef(false);

  const commit = useCallback(
    async (callback: () => void) => {
      const { name } = registrationParameters as RegistrationParameters;
      const wallet = await loadWallet();
      if (!wallet) {
        return;
      }

      const salt = generateSalt();
      const nonce = await getNextNonce();
      const rentPrice = await getRentPrice(
        name,
        yearsDuration * timeUnits.secs.year
      );

      const commitEnsRegistrationParameters: ENSActionParameters = {
        duration: yearsDuration * timeUnits.secs.year,
        name,
        nonce,
        ownerAddress: accountAddress,
        rentPrice: rentPrice.toString(),
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

  const register = useCallback(
    async (callback: () => void) => {
      const {
        name,
        duration,
        records,
        salt,
      } = registrationParameters as RegistrationParameters;
      const wallet = await loadWallet();
      if (!wallet) {
        return;
      }

      const nonce = await getNextNonce();
      const rentPrice = await getRentPrice(name, duration);

      const registerEnsRegistrationParameters: ENSActionParameters = {
        duration,
        name,
        nonce,
        ownerAddress: accountAddress,
        records,
        rentPrice: rentPrice.toString(),
        salt,
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

  const registrationStep = useMemo(() => {
    const {
      commitTransactionHash,
      commitTransactionConfirmedAt,
    } = registrationParameters as RegistrationParameters;
    if (!commitTransactionHash) {
      return {
        action: commit,
        step: REGISTRATION_STEPS.COMMIT,
      };
    }

    if (!commitTransactionConfirmedAt) {
      return {
        action: null,
        step: REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION,
      };
    }
    if (secondsSinceCommitConfirmed < ENS_SECONDS_WAIT) {
      return {
        action: null,
        step: REGISTRATION_STEPS.WAIT_ENS_COMMITMENT,
      };
    }

    return {
      action: register,
      step: REGISTRATION_STEPS.REGISTER,
    };
  }, [commit, register, registrationParameters, secondsSinceCommitConfirmed]);

  const watchCommitTransaction = useCallback(async () => {
    let confirmed = false;
    let confirmedAt = undefined;

    const tx = await web3Provider.getTransaction(
      registrationParameters?.commitTransactionHash || ''
    );

    if (readyToConfirm.current && tx?.blockHash) {
      // const block = await web3Provider.getBlock(tx.blockHash || '');
      // confirmedAt = Date.now();
      // confirmedAt = block?.timestamp * 1000;
      const now = Date.now();
      confirmedAt = now;
      // const secs = differenceInSeconds(now, confirmedAt * 1000);
      const secs = differenceInSeconds(now, now);
      setSecondsSinceCommitConfirmed(secs);
      confirmed = true;
      await dispatch(
        updateTransactionRegistrationParameters(accountAddress, {
          commitTransactionConfirmedAt: confirmedAt,
        })
      );
    } else if (!readyToConfirm.current) {
      readyToConfirm.current = true;
    }

    return confirmed;
  }, [
    accountAddress,
    dispatch,
    registrationParameters?.commitTransactionHash,
    readyToConfirm,
  ]);

  const startPollingWatchCommitTransaction = useCallback(async () => {
    if (registrationStep.step !== REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION)
      return;

    const confirmed = await watchCommitTransaction();
    if (!confirmed) {
      setTimeout(() => startPollingWatchCommitTransaction(), 10000);
    }
  }, [registrationStep.step, watchCommitTransaction]);

  useEffect(() => {
    const estimateGasLimit = async () => {
      const step = registrationStep.step;
      const {
        name,
        records,
      } = registrationParameters as RegistrationParameters;
      switch (step) {
        case REGISTRATION_STEPS.COMMIT: {
          const salt = generateSalt();
          const rentPrice = await getRentPrice(name, timeUnits.secs.year);
          const gasLimit = await getENSRapEstimationByType(
            RapActionTypes.commitENS,
            {
              duration: yearsDuration * timeUnits.secs.year,
              name,
              ownerAddress: accountAddress,
              records,
              rentPrice,
              salt,
            }
          );
          setStepGasLimit(gasLimit);
          break;
        }
        case REGISTRATION_STEPS.REGISTER: {
          const {
            name,
            records,
            salt,
            rentPrice,
          } = registrationParameters as RegistrationParameters;
          const gasLimit = await getENSRapEstimationByType(
            RapActionTypes.registerENS,
            {
              duration: yearsDuration * timeUnits.secs.year,
              name,
              ownerAddress: accountAddress,
              records,
              rentPrice,
              salt,
            }
          );
          setStepGasLimit(gasLimit);
          break;
        }
        case REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION:
        case REGISTRATION_STEPS.WAIT_ENS_COMMITMENT:
        default:
          setStepGasLimit(null);
      }
    };
    estimateGasLimit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrationStep.step]);

  useEffect(() => {
    if (registrationStep.step === REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION) {
      startPollingWatchCommitTransaction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrationStep.step]);

  useEffect(() => {
    let interval: NodeJS.Timer;
    const isActive = secondsSinceCommitConfirmed < ENS_SECONDS_WAIT;
    if (isActive) {
      interval = setInterval(() => {
        setSecondsSinceCommitConfirmed(seconds => seconds + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [secondsSinceCommitConfirmed]);

  return {
    ...registrationStep,
    stepGasLimit,
  };
}
