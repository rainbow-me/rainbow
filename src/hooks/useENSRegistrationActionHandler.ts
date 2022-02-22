import { differenceInSeconds } from 'date-fns';
import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { RapActionTypes, RegisterENSActionParameters } from '../raps/common';
import { useAccountSettings, useCurrentNonce, useENSProfile } from '.';
import { RegistrationParameters } from '@rainbow-me/entities';
import { web3Provider } from '@rainbow-me/handlers/web3';
import { generateSalt } from '@rainbow-me/helpers/ens';
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

export default function useENSRegistrationActionHandler() {
  const { accountAddress, network } = useAccountSettings();
  const { registrationParameters } = useENSProfile();
  const getNextNonce = useCurrentNonce(accountAddress, network);
  const dispatch = useDispatch();

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
      confirmedAt = block?.timestamp;
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
        commitEnsRegistrationParameters,
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

  const registrationStepAction = useMemo(() => {
    switch (registrationStep) {
      case REGISTRATION_STEPS.COMMIT: {
        return commit;
      }
      case REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION: {
        return () => null;
      }
      case REGISTRATION_STEPS.WAIT_ENS_COMMITMENT: {
        return () => null;
      }
      case REGISTRATION_STEPS.REGISTER: {
        return () => null;
      }
    }
  }, [commit, registrationStep]);

  useEffect(() => {
    if (
      registrationStep === REGISTRATION_STEPS.WAIT_ENS_COMMITMENT ||
      registrationStep === REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION
    ) {
      startPollingWatchCommitTransaction();
    }
  }, [startPollingWatchCommitTransaction, registrationStep]);

  return {
    step: registrationStep,
    stepAction: registrationStepAction,
  };
}
