import { differenceInSeconds } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  getENSRapEstimationByType,
  RapActionTypes,
  RegisterENSActionParameters,
} from '../raps/common';
import { useAccountSettings, useCurrentNonce, useENSProfile } from '.';
import { RegistrationParameters } from '@rainbow-me/entities';
import { web3Provider } from '@rainbow-me/handlers/web3';
import { generateSalt, getRentPrice } from '@rainbow-me/helpers/ens';
import { loadWallet } from '@rainbow-me/model/wallet';
import { executeRap } from '@rainbow-me/raps';
import { updateCommitRegistrationParameters } from '@rainbow-me/redux/ensRegistration';

enum REGISTRATION_STEPS {
  COMMIT = 'COMMIT',
  WAIT_COMMIT_CONFIRMATION = 'WAIT_COMMIT_CONFIRMATION',
  WAIT_ENS_COMMITMENT = 'WAIT_ENS_COMMITMENT',
  REGISTER = 'REGISTER',
}

const ENS_SECONDS_WAIT = 60;
const secsInYear = 31536000;

export default function useENSRegistrationActionHandler(
  {
    duration,
  }: {
    duration: number;
  } = {} as any
) {
  const { accountAddress, network } = useAccountSettings();
  const { registrationParameters } = useENSProfile();
  const getNextNonce = useCurrentNonce(accountAddress, network);
  const dispatch = useDispatch();

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

  const commit = useCallback(
    async (callback: () => void) => {
      const { name } = registrationParameters as RegistrationParameters;
      const wallet = await loadWallet();
      if (!wallet) {
        return;
      }

      const salt = generateSalt();
      const nonce = await getNextNonce();
      const rentPrice = await getRentPrice(name, duration * secsInYear);

      const commitEnsRegistrationParameters: RegisterENSActionParameters = {
        duration: duration * secsInYear,
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
    [accountAddress, duration, getNextNonce, registrationParameters]
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
      const rentPrice = await getRentPrice(name, duration * secsInYear);

      const registerEnsRegistrationParameters: RegisterENSActionParameters = {
        duration: duration * secsInYear,
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

    let txHash;
    let confirmedAt;

    const tx = await web3Provider.getTransaction(
      registrationParameters?.commitTransactionHash || ''
    );
    if (tx?.blockHash) {
      txHash = tx?.hash;
      const block = await web3Provider.getBlock(tx.blockHash || '');
      // confirmedAt = Date.now();
      confirmedAt = block?.timestamp;
      const now = Date.now();
      // const secs = differenceInSeconds(now, confirmedAt * 1000 + 80000);
      const secs = differenceInSeconds(now, now);
      setSecondsSinceCommitConfirmed(secs);
    }

    await dispatch(
      updateCommitRegistrationParameters(accountAddress, {
        commitTransactionConfirmedAt: confirmedAt,
        commitTransactionHash: txHash,
      })
    );

    return confirmed;
  }, [accountAddress, dispatch, registrationParameters?.commitTransactionHash]);

  const startPollingWatchCommitTransaction = useCallback(async () => {
    if (!registrationParameters?.commitTransactionHash) return;

    const confirmed = await watchCommitTransaction();
    if (confirmed) {
      setTimeout(() => startPollingWatchCommitTransaction(), 10000);
    }
  }, [registrationParameters, watchCommitTransaction]);

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
          const rentPrice = await getRentPrice(name, secsInYear);
          const gasLimit = await getENSRapEstimationByType(
            RapActionTypes.commitENS,
            {
              duration: duration * secsInYear,
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
              duration: duration * secsInYear,
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
  }, [startPollingWatchCommitTransaction, registrationStep]);

  useEffect(() => {
    let interval: NodeJS.Timer;
    const isActive =
      secondsSinceCommitConfirmed >= 0 && secondsSinceCommitConfirmed < 80;
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
