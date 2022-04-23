import { differenceInSeconds } from 'date-fns';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  // @ts-ignore
  IS_TESTING,
} from 'react-native-dotenv';
import { useDispatch } from 'react-redux';
import { useAccountSettings, useENSRegistration } from '.';
import { isHardHat, web3Provider } from '@rainbow-me/handlers/web3';
import {
  REGISTRATION_MODES,
  REGISTRATION_STEPS,
} from '@rainbow-me/helpers/ens';
import { updateTransactionRegistrationParameters } from '@rainbow-me/redux/ensRegistration';

// add waiting buffer
const ENS_SECONDS_WAIT = 60;

const getBlockMsTimestamp = (block: { timestamp: number }) =>
  block.timestamp * 1000;

export default function useENSRegistrationStepHandler(observer = true) {
  const dispatch = useDispatch();
  const { accountAddress } = useAccountSettings();
  const { registrationParameters, mode } = useENSRegistration();

  const timeout = useRef<NodeJS.Timeout>();

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

  const isTesting = useMemo(
    () => IS_TESTING === 'true' && isHardHat(web3Provider.connection.url),
    []
  );

  const [readyToRegister, setReadyToRegister] = useState<boolean>(
    isTesting || secondsSinceCommitConfirmed > 60
  );
  // flag to wait 10 secs before we get the tx block, to be able to simulate not confirmed tx when testing
  const shouldLoopForConfirmation = useRef(isTesting);

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
    let confirmed = false;
    const tx = await web3Provider.getTransaction(
      registrationParameters?.commitTransactionHash || ''
    );
    const block = await web3Provider.getBlock(tx.blockHash || '');
    if (!shouldLoopForConfirmation.current && block?.timestamp) {
      const now = Date.now();
      const msBlockTimestamp = getBlockMsTimestamp(block);
      // hardhat block timestamp is behind
      const timeDifference = isTesting ? now - msBlockTimestamp : 0;
      const commitTransactionConfirmedAt = msBlockTimestamp + timeDifference;
      const secs = differenceInSeconds(now, commitTransactionConfirmedAt);
      setSecondsSinceCommitConfirmed(secs);
      dispatch(
        updateTransactionRegistrationParameters(accountAddress, {
          commitTransactionConfirmedAt,
        })
      );
      confirmed = true;
    } else if (shouldLoopForConfirmation.current) {
      shouldLoopForConfirmation.current = false;
    }
    return confirmed;
  }, [
    accountAddress,
    dispatch,
    isTesting,
    registrationParameters?.commitTransactionHash,
  ]);

  const startPollingWatchCommitTransaction = useCallback(async () => {
    timeout.current && clearTimeout(timeout.current);
    if (registrationStep !== REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION)
      return;
    const confirmed = await watchCommitTransaction();
    if (!confirmed) {
      timeout.current = setTimeout(() => {
        startPollingWatchCommitTransaction();
      }, 20000);
    }
  }, [registrationStep, watchCommitTransaction]);

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
        const block = await web3Provider.getBlock('latest');
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
    isTesting,
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
    step: registrationStep,
  };
}
