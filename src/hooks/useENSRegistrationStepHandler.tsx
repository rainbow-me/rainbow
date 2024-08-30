import { differenceInSeconds } from 'date-fns';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import usePrevious from './usePrevious';
import { useENSRegistration, useInterval } from '.';
import { RegistrationParameters } from '@/entities';
import { getProviderForNetwork, isHardHat, web3Provider } from '@/handlers/web3';
import {
  ENS_SECONDS_PADDING,
  ENS_SECONDS_WAIT,
  ENS_SECONDS_WAIT_PROVIDER_PADDING,
  ENS_SECONDS_WAIT_WITH_PADDING,
  REGISTRATION_MODES,
  REGISTRATION_STEPS,
} from '@/helpers/ens';
import { updateTransactionRegistrationParameters } from '@/redux/ensRegistration';

const checkRegisterBlockTimestamp = async ({
  registrationParameters,
  secondsSinceCommitConfirmed,
  isTestingHardhat,
}: {
  registrationParameters: RegistrationParameters;
  secondsSinceCommitConfirmed: number;
  isTestingHardhat: boolean;
}) => {
  try {
    const provider = getProviderForNetwork();
    const block = await provider.getBlock('latest');
    const msBlockTimestamp = getBlockMsTimestamp(block);
    const secs = differenceInSeconds(msBlockTimestamp, registrationParameters?.commitTransactionConfirmedAt || msBlockTimestamp);
    if (
      (secs > ENS_SECONDS_WAIT_WITH_PADDING && secondsSinceCommitConfirmed > ENS_SECONDS_WAIT_WITH_PADDING) ||
      // sometimes the provider.getBlock('latest) takes a long time to update to newest block
      secondsSinceCommitConfirmed > ENS_SECONDS_WAIT_PROVIDER_PADDING ||
      isTestingHardhat
    ) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
};

const getBlockMsTimestamp = (block: { timestamp: number }) => block.timestamp * 1000;

export default function useENSRegistrationStepHandler(observer = true) {
  const dispatch = useDispatch();
  const { registrationParameters, mode } = useENSRegistration();
  const commitTransactionHash = registrationParameters?.commitTransactionHash;
  const prevCommitTrasactionHash = usePrevious(commitTransactionHash);
  const [startInterval, stopInterval, timeoutRef] = useInterval();

  const timeout = useRef<NodeJS.Timeout>();

  const [secondsSinceCommitConfirmed, setSecondsSinceCommitConfirmed] = useState(
    (registrationParameters?.commitTransactionConfirmedAt &&
      differenceInSeconds(Date.now(), registrationParameters?.commitTransactionConfirmedAt)) ||
      -1
  );

  const isTestingHardhat = useMemo(() => isHardHat(web3Provider.connection.url), []);

  const [readyToRegister, setReadyToRegister] = useState<boolean>(secondsSinceCommitConfirmed > ENS_SECONDS_WAIT);

  // flag to wait 10 secs before we get the tx block, to be able to simulate not confirmed tx when testing
  const shouldLoopForConfirmation = useRef(isTestingHardhat);

  const registrationStep = useMemo(() => {
    if (mode === REGISTRATION_MODES.EDIT) return REGISTRATION_STEPS.EDIT;
    if (mode === REGISTRATION_MODES.RENEW) return REGISTRATION_STEPS.RENEW;
    if (mode === REGISTRATION_MODES.SET_NAME) return REGISTRATION_STEPS.SET_NAME;
    // still waiting for the COMMIT tx to be sent
    if (!registrationParameters.commitTransactionHash) return REGISTRATION_STEPS.COMMIT;
    // COMMIT tx sent, but not confirmed yet
    if (!registrationParameters.commitTransactionConfirmedAt || secondsSinceCommitConfirmed <= ENS_SECONDS_PADDING)
      return REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION;
    // COMMIT tx was confirmed but 60 secs haven't passed yet
    // or current block is not 60 secs ahead of COMMIT tx block
    if (secondsSinceCommitConfirmed < ENS_SECONDS_WAIT_WITH_PADDING || !readyToRegister) return REGISTRATION_STEPS.WAIT_ENS_COMMITMENT;
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
    const provider = getProviderForNetwork();
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
      setSecondsSinceCommitConfirmed(secondsSinceCommitConfirmed < 0 ? 0 : secs);
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
  }, [observer, commitTransactionHash, isTestingHardhat, secondsSinceCommitConfirmed, dispatch]);

  const startPollingWatchCommitTransaction = useCallback(async () => {
    if (observer) return;
    timeout.current && clearTimeout(timeout.current);
    if (registrationStep !== REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION) return;
    const confirmed = await watchCommitTransaction();
    if (!confirmed) {
      timeout.current = setTimeout(() => {
        startPollingWatchCommitTransaction();
      }, 2000);
    }
  }, [observer, registrationStep, watchCommitTransaction]);

  useEffect(() => {
    // we need to update the loop with new commit transaction hash in case of speed ups
    if (!observer && !!prevCommitTrasactionHash && !!commitTransactionHash && prevCommitTrasactionHash !== commitTransactionHash) {
      timeout.current && clearTimeout(timeout.current);
      startPollingWatchCommitTransaction();
    }
  }, [observer, commitTransactionHash, prevCommitTrasactionHash, startPollingWatchCommitTransaction]);

  useEffect(() => {
    if (!observer && registrationStep === REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION) {
      startPollingWatchCommitTransaction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [observer, registrationStep]);

  useEffect(() => {
    if (
      !observer &&
      !timeoutRef.current &&
      ((registrationParameters.commitTransactionConfirmedAt && registrationStep === REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION) ||
        registrationStep === REGISTRATION_STEPS.WAIT_ENS_COMMITMENT)
    ) {
      startInterval(() => setSecondsSinceCommitConfirmed((seconds: any) => seconds + 1), 1000);
    }
  }, [
    observer,
    readyToRegister,
    registrationParameters.commitTransactionConfirmedAt,
    registrationParameters.commitTransactionHash,
    registrationStep,
    startInterval,
    timeoutRef,
  ]);

  useEffect(() => {
    // we need to check from blocks if the time has passed or not
    if (!observer && secondsSinceCommitConfirmed % 2 === 0 && secondsSinceCommitConfirmed >= ENS_SECONDS_WAIT && !readyToRegister) {
      const checkIfReadyToRegister = async () => {
        const readyToRegister = await checkRegisterBlockTimestamp({
          isTestingHardhat,
          registrationParameters,
          secondsSinceCommitConfirmed,
        });
        setReadyToRegister(readyToRegister);
      };
      checkIfReadyToRegister();
    }
  }, [isTestingHardhat, observer, readyToRegister, registrationParameters, secondsSinceCommitConfirmed]);

  useEffect(
    () => () => {
      !observer && stopInterval();
    },
    [observer, stopInterval]
  );
  return {
    secondsSinceCommitConfirmed,
    step: registrationStep,
  };
}
