import { differenceInSeconds } from 'date-fns';
import { useCallback, useEffect, useMemo } from 'react';
import {
  RapActionTypes,
  RegisterENSActionParameters,
  SwapActionParameters,
} from '../raps/common';
import { useAccountSettings, useCurrentNonce, useENSProfile } from '.';
import { RegistrationParameters } from '@rainbow-me/entities';
import { web3Provider } from '@rainbow-me/handlers/web3';
import { generateSalt } from '@rainbow-me/helpers/ens';
import { loadWallet } from '@rainbow-me/model/wallet';
import { executeRap } from '@rainbow-me/raps';

enum REGISTRATION_STEPS {
  COMMIT = 'COMMIT',
  WAIT_COMMIT_CONFIRMATION = 'WAIT_COMMIT_CONFIRMATION',
  WAIT_ENS_COMMITMENT = 'WAIT_ENS_COMMITMENT',
  REGISTER = 'REGISTER',
}

const ENS_SECONDS_WAIT = 60;

export default function useENSRegistrationActionHandler() {
  const { accountAddress, network } = useAccountSettings();
  const { registrationParameters } = useENSProfile();
  const getNextNonce = useCurrentNonce(accountAddress, network);

  const registrationStep = useMemo(() => {
    const {
      commitTransactionHash,
      commitTransactionConfirmedAt,
    } = registrationParameters as RegistrationParameters;

    if (!commitTransactionHash) {
      return REGISTRATION_STEPS.COMMIT;
    }

    if (!commitTransactionConfirmedAt) {
      return REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION;
    }

    const now = Date.now();
    const secondsSinceConfirmation = differenceInSeconds(
      now,
      commitTransactionConfirmedAt
    );

    if (secondsSinceConfirmation < ENS_SECONDS_WAIT) {
      return REGISTRATION_STEPS.WAIT_ENS_COMMITMENT;
    }

    return REGISTRATION_STEPS.REGISTER;
  }, [registrationParameters]);

  const watchCommitTransaction = useCallback(async () => {
    let confirmed = false;
    let waitRemaining = 0;

    const now = Date.now();
    const txn = await web3Provider.getTransaction(
      registrationParameters?.commitTransactionHash || ''
    );
    confirmed = Boolean(txn?.blockHash);
    if (confirmed) {
      const block = await web3Provider.getBlock(txn.blockHash || '');
      waitRemaining = differenceInSeconds(now, block.timestamp * 1000);
    }
    return {
      confirmed,
      waitRemaining,
    };
  }, [registrationParameters?.commitTransactionHash]);

  const startPollingWatchCommitTransaction = useCallback(async () => {
    if (!registrationParameters?.commitTransactionHash) return;

    const { confirmed } = await watchCommitTransaction();
    if (confirmed) {
      setTimeout(() => startPollingWatchCommitTransaction(), 10000);
    }
  }, [registrationParameters, watchCommitTransaction]);

  useEffect(() => {
    if (registrationStep === REGISTRATION_STEPS.WAIT_ENS_COMMITMENT) {
      startPollingWatchCommitTransaction();
    }
  }, [startPollingWatchCommitTransaction, registrationStep]);

  const commit = useCallback(
    async (callback: () => void) => {
      const {
        name,
        duration,
        records,
        rentPrice,
      } = registrationParameters as RegistrationParameters;
      const wallet = await loadWallet();
      if (!wallet) {
        return;
      }

      const nonce = await getNextNonce();
      const salt = generateSalt();

      const commitEnsRegistrationParameters: RegisterENSActionParameters = {
        duration,
        name,
        nonce,
        ownerAddress: accountAddress,
        records,
        rentPrice,
        salt,
      };

      await executeRap(
        wallet,
        RapActionTypes.commitENS,
        {
          ensRegistrationParameters: commitEnsRegistrationParameters,
          swapParameters: {} as SwapActionParameters,
        },
        callback
      );
    },
    [accountAddress, getNextNonce, registrationParameters]
  );

  const getRegistrationStepAction = useCallback(() => {
    switch (registrationStep) {
      case REGISTRATION_STEPS.COMMIT: {
        return commit;
      }
      case REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION: {
        break;
      }
      case REGISTRATION_STEPS.WAIT_ENS_COMMITMENT: {
        break;
      }
      case REGISTRATION_STEPS.REGISTER: {
        break;
      }
    }
    return () => null;
  }, [commit, registrationStep]);

  return {
    step: registrationStep,
    stepAction: getRegistrationStepAction(),
  };
}
