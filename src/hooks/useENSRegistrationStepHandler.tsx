import { differenceInSeconds } from 'date-fns';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  // @ts-ignore
  IS_TESTING,
} from 'react-native-dotenv';
import { useDispatch } from 'react-redux';
import usePrevious from './usePrevious';
import { useENSRegistration } from '.';
import {
  getProviderForNetwork,
  isHardHat,
  web3Provider,
} from '@rainbow-me/handlers/web3';
import {
  ENS_SECONDS_WAIT,
  REGISTRATION_MODES,
  REGISTRATION_STEPS,
} from '@rainbow-me/helpers/ens';
import { updateTransactionRegistrationParameters } from '@rainbow-me/redux/ensRegistration';

const getBlockMsTimestamp = (block: { timestamp: number }) =>
  block.timestamp * 1000;

export default function useENSRegistrationStepHandler(observer = true) {
  const dispatch = useDispatch();
  const { registrationParameters, mode } = useENSRegistration();
  const commitTransactionHash = registrationParameters?.commitTransactionHash;
  const prevCommitTrasactionHash = usePrevious(commitTransactionHash);

  const timeout = useRef<NodeJS.Timeout>();

  const [
    secondsSinceCommitConfirmed,
    setSecondsSinceCommitConfirmed,
  ] = useState(
    (registrationParameters?.commitTransactionConfirmedAt &&
      differenceInSeconds(
        Date.now(),
        registrationParameters?.commitTransactionConfirmedAt
      )) ||
      -1
  );

  const isTestingHardhat = useMemo(
    () => IS_TESTING === 'true' && isHardHat(web3Provider.connection.url),
    []
  );

  const [readyToRegister, setReadyToRegister] = useState<boolean>(
    isTestingHardhat || secondsSinceCommitConfirmed > 60
  );

  // flag to wait 10 secs before we get the tx block, to be able to simulate not confirmed tx when testing
  const shouldLoopForConfirmation = useRef(isTestingHardhat);

  const registrationStep = useMemo(() => {
    if (mode === REGISTRATION_MODES.EDIT) return REGISTRATION_STEPS.EDIT;
    if (mode === REGISTRATION_MODES.RENEW) return REGISTRATION_STEPS.RENEW;
    if (mode === REGISTRATION_MODES.SET_NAME)
      return REGISTRATION_STEPS.SET_NAME;
    // still waiting for the COMMIT tx to be sent
    if (!registrationParameters.commitTransactionHash)
      return REGISTRATION_STEPS.COMMIT;
    // COMMIT tx sent, but not confirmed yet
    if (!registrationParameters.commitTransactionConfirmedAt)
      return REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION;
    // COMMIT tx was confirmed but 60 secs haven't passed yet
    // or current block is not 60 secs ahead of COMMIT tx block
    if (secondsSinceCommitConfirmed < ENS_SECONDS_WAIT || !readyToRegister)
      return REGISTRATION_STEPS.WAIT_ENS_COMMITMENT;
    return REGISTRATION_STEPS.REGISTER;
  }, [
    registrationParameters.commitTransactionHash,
    registrationParameters.commitTransactionConfirmedAt,
    mode,
    secondsSinceCommitConfirmed,
    readyToRegister,
  ]);

  const watchCommitTransaction = useCallback(async () => {
    if (observer) return;
    const provider = await getProviderForNetwork();
    let confirmed = false;
    const tx = await provider.getTransaction(commitTransactionHash || '');
    if (!tx?.blockHash) return confirmed;
    const block = await provider.getBlock(tx.blockHash || '');
    if (!shouldLoopForConfirmation.current && block?.timestamp) {
      const now = Date.now();
      const msBlockTimestamp = getBlockMsTimestamp(block);
      // hardhat block timestamp is behind
      const timeDifference = isTestingHardhat ? now - msBlockTimestamp : 0;
      const commitTransactionConfirmedAt = msBlockTimestamp + timeDifference;
      const secs = differenceInSeconds(now, commitTransactionConfirmedAt);
      setSecondsSinceCommitConfirmed(secs);
      dispatch(
        updateTransactionRegistrationParameters({
          commitTransactionConfirmedAt,
        })
      );
      confirmed = true;
    } else if (shouldLoopForConfirmation.current) {
      shouldLoopForConfirmation.current = false;
    }
    return confirmed;
  }, [observer, dispatch, isTestingHardhat, commitTransactionHash]);

  const startPollingWatchCommitTransaction = useCallback(async () => {
    if (observer) return;
    timeout.current && clearTimeout(timeout.current);
    if (registrationStep !== REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION)
      return;
    const confirmed = await watchCommitTransaction();
    if (!confirmed) {
      timeout.current = setTimeout(() => {
        startPollingWatchCommitTransaction();
      }, 2000);
    }
  }, [observer, registrationStep, watchCommitTransaction]);

  useEffect(() => {
    // we need to update the loop with new commit transaction hash in case of speed ups
    if (
      !observer &&
      !!prevCommitTrasactionHash &&
      !!commitTransactionHash &&
      prevCommitTrasactionHash !== commitTransactionHash
    ) {
      timeout.current && clearTimeout(timeout.current);
      startPollingWatchCommitTransaction();
    }
  }, [
    observer,
    commitTransactionHash,
    prevCommitTrasactionHash,
    startPollingWatchCommitTransaction,
  ]);

  useEffect(() => {
    if (observer) return;
    if (registrationStep === REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION) {
      startPollingWatchCommitTransaction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [observer, registrationStep]);

  useEffect(() => {
    if (observer) return;
    let interval: NodeJS.Timer;
    if (registrationStep === REGISTRATION_STEPS.WAIT_ENS_COMMITMENT) {
      interval = setInterval(() => {
        setSecondsSinceCommitConfirmed(seconds => seconds + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [observer, registrationStep, secondsSinceCommitConfirmed]);

  useEffect(() => {
    if (observer) return;
    // we need to check from blocks if the time has passed or not
    const checkRegisterBlockTimestamp = async () => {
      try {
        const provider = await getProviderForNetwork();
        const block = await provider.getBlock('latest');
        const msBlockTimestamp = getBlockMsTimestamp(block);
        const secs = differenceInSeconds(
          msBlockTimestamp,
          registrationParameters?.commitTransactionConfirmedAt ||
            msBlockTimestamp
        );
        if (secs > ENS_SECONDS_WAIT) setReadyToRegister(true);
        // eslint-disable-next-line no-empty
      } catch (e) {}
    };
    if (secondsSinceCommitConfirmed >= ENS_SECONDS_WAIT) {
      checkRegisterBlockTimestamp();
    }
  }, [
    isTestingHardhat,
    observer,
    registrationParameters?.commitTransactionConfirmedAt,
    registrationStep,
    secondsSinceCommitConfirmed,
  ]);

  useEffect(
    () => () => {
      !observer && timeout.current && clearTimeout(timeout.current);
    },
    [observer]
  );
  return {
    secondsSinceCommitConfirmed,
    step: registrationStep,
  };
}
