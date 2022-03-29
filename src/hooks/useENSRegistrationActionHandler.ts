import { useNavigation } from '@react-navigation/core';
import { differenceInSeconds } from 'date-fns';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { IS_TESTING } from 'react-native-dotenv';
import { Image } from 'react-native-image-crop-picker';
import { useDispatch } from 'react-redux';
import { useRecoilValue } from 'recoil';
import { avatarMetadataAtom } from '../components/ens-registration/RegistrationAvatar/RegistrationAvatar';
import { coverMetadataAtom } from '../components/ens-registration/RegistrationCover/RegistrationCover';
import {
  ENSActionParameters,
  getENSRapEstimationByType,
  RapActionTypes,
} from '../raps/common';
import useTransactions from './useTransactions';
import { useAccountSettings, useCurrentNonce, useENSRegistration } from '.';
import { Records, RegistrationParameters } from '@rainbow-me/entities';
import { fetchResolver } from '@rainbow-me/handlers/ens';
import { uploadImage } from '@rainbow-me/handlers/pinata';
import { isHardHat, web3Provider } from '@rainbow-me/handlers/web3';
import {
  ENS_DOMAIN,
  generateSalt,
  getRentPrice,
  REGISTRATION_STEPS,
} from '@rainbow-me/helpers/ens';
import { loadWallet } from '@rainbow-me/model/wallet';
import { executeRap } from '@rainbow-me/raps';
import {
  saveCommitRegistrationParameters,
  updateTransactionRegistrationParameters,
} from '@rainbow-me/redux/ensRegistration';
import { timeUnits } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';

// add waiting buffer
const ENS_SECONDS_WAIT = 60;

const getBlockMsTimestamp = (block: { timestamp: number }) =>
  block.timestamp * 1000;

const formatENSActionParams = (
  registrationParameters: RegistrationParameters
): ENSActionParameters => {
  return {
    duration: registrationParameters?.duration,
    name: registrationParameters?.name,
    ownerAddress: registrationParameters?.ownerAddress,
    records: registrationParameters?.records,
    rentPrice: registrationParameters?.rentPrice,
    salt: registrationParameters?.salt,
    setReverseRecord: registrationParameters?.setReverseRecord,
  };
};

export default function useENSRegistrationActionHandler(
  {
    sendReverseRecord,
    yearsDuration,
  }: {
    yearsDuration: number;
    sendReverseRecord: boolean;
  } = {} as any
) {
  const dispatch = useDispatch();
  const { accountAddress, network } = useAccountSettings();
  const getNextNonce = useCurrentNonce(accountAddress, network);
  const { registrationParameters, mode } = useENSRegistration();
  const { navigate } = useNavigation();
  const { getTransactionByHash } = useTransactions();
  const [stepGasLimit, setStepGasLimit] = useState<string | null>(null);

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

  const [readyToRegister, setReadyToRegister] = useState<boolean>(isTesting);
  // flag to wait 10 secs before we get the tx block, to be able to simulate not confirmed tx when testing
  const shouldLoopForConfirmation = useRef(isTesting);
  const avatarMetadata = useRecoilValue(avatarMetadataAtom);
  const coverMetadata = useRecoilValue(coverMetadataAtom);

  const commitAction = useCallback(
    async (callback: () => void) => {
      const wallet = await loadWallet();
      if (!wallet) {
        return;
      }
      const duration = yearsDuration * timeUnits.secs.year;
      const salt = generateSalt();

      const [nonce, rentPrice] = await Promise.all([
        getNextNonce(),
        getRentPrice(
          registrationParameters.name.replace(ENS_DOMAIN, ''),
          duration
        ),
      ]);

      const commitEnsRegistrationParameters: ENSActionParameters = {
        ...formatENSActionParams(registrationParameters),
        duration,
        nonce,
        ownerAddress: accountAddress,
        records: registrationParameters.changedRecords,
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
    [registrationParameters, getNextNonce, yearsDuration, accountAddress]
  );

  const speedUpCommitAction = useCallback(
    async (accentColor: string) => {
      // we want to speed up the last commit tx sent
      const commitTransactionHash =
        registrationParameters?.commitTransactionHash;
      const saveCommitTransactionHash = (hash: string) => {
        dispatch(
          saveCommitRegistrationParameters(accountAddress, {
            commitTransactionHash: hash,
          })
        );
      };
      commitTransactionHash &&
        navigate(Routes.SPEED_UP_AND_CANCEL_SHEET, {
          accentColor,
          onSendTransactionCallback: saveCommitTransactionHash,
          tx: getTransactionByHash(commitTransactionHash),
          type: 'speed_up',
        });
    },
    [
      accountAddress,
      dispatch,
      getTransactionByHash,
      navigate,
      registrationParameters?.commitTransactionHash,
    ]
  );

  const registerAction = useCallback(
    async (callback: () => void) => {
      const {
        name,
        duration,
      } = registrationParameters as RegistrationParameters;

      const wallet = await loadWallet();
      if (!wallet) {
        return;
      }

      const [nonce, rentPrice, changedRecords] = await Promise.all([
        getNextNonce(),
        getRentPrice(name.replace(ENS_DOMAIN, ''), duration),
        uploadRecordImages(registrationParameters.changedRecords, {
          avatar: avatarMetadata,
          cover: coverMetadata,
        }),
      ]);

      const registerEnsRegistrationParameters: ENSActionParameters = {
        ...formatENSActionParams(registrationParameters),
        nonce,
        ownerAddress: accountAddress,
        records: changedRecords,
        rentPrice: rentPrice.toString(),
        setReverseRecord: sendReverseRecord,
      };

      await executeRap(
        wallet,
        RapActionTypes.registerENS,
        registerEnsRegistrationParameters,
        callback
      );
    },
    [
      accountAddress,
      avatarMetadata,
      coverMetadata,
      getNextNonce,
      registrationParameters,
      sendReverseRecord,
    ]
  );

  const editAction = useCallback(
    async (callback: () => void) => {
      const wallet = await loadWallet();
      if (!wallet) {
        return;
      }

      const [nonce, changedRecords, resolver] = await Promise.all([
        getNextNonce(),
        uploadRecordImages(registrationParameters.changedRecords, {
          avatar: avatarMetadata,
          cover: coverMetadata,
        }),
        fetchResolver(registrationParameters.name),
      ]);

      const setRecordsEnsRegistrationParameters: ENSActionParameters = {
        ...formatENSActionParams(registrationParameters),
        nonce,
        ownerAddress: accountAddress,
        records: changedRecords,
        resolverAddress: resolver.address,
      };

      await executeRap(
        wallet,
        RapActionTypes.setRecordsENS,
        setRecordsEnsRegistrationParameters,
        callback
      );
    },
    [
      accountAddress,
      avatarMetadata,
      coverMetadata,
      getNextNonce,
      registrationParameters,
    ]
  );

  const commitEstimateGasLimit = useCallback(async () => {
    const salt = generateSalt();
    const duration = yearsDuration * timeUnits.secs.year;
    const rentPrice = await getRentPrice(
      registrationParameters.name.replace(ENS_DOMAIN, ''),
      duration
    );
    const gasLimit = await getENSRapEstimationByType(RapActionTypes.commitENS, {
      ...formatENSActionParams(registrationParameters),
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
        ...formatENSActionParams(registrationParameters),
        duration: yearsDuration * timeUnits.secs.year,
        ownerAddress: accountAddress,
        setReverseRecord: sendReverseRecord,
      }
    );
    return gasLimit;
  }, [
    accountAddress,
    registrationParameters,
    sendReverseRecord,
    yearsDuration,
  ]);

  const setRecordsEstimateGasLimit = useCallback(async () => {
    const gasLimit = await getENSRapEstimationByType(
      RapActionTypes.setRecordsENS,
      {
        ...formatENSActionParams(registrationParameters),
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
    // or current block is not 60 secs ahead of COMMIT tx block
    if (secondsSinceCommitConfirmed < ENS_SECONDS_WAIT || !readyToRegister)
      return REGISTRATION_STEPS.WAIT_ENS_COMMITMENT;
    return REGISTRATION_STEPS.REGISTER;
  }, [
    mode,
    registrationParameters.commitTransactionConfirmedAt,
    registrationParameters.commitTransactionHash,
    secondsSinceCommitConfirmed,
    readyToRegister,
  ]);

  const actions = useMemo(
    () => ({
      [REGISTRATION_STEPS.COMMIT]: commitAction,
      [REGISTRATION_STEPS.EDIT]: editAction,
      [REGISTRATION_STEPS.REGISTER]: registerAction,
      [REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION]: speedUpCommitAction,
      [REGISTRATION_STEPS.WAIT_ENS_COMMITMENT]: () => null,
    }),
    [commitAction, registerAction, editAction, speedUpCommitAction]
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
      if (!shouldLoopForConfirmation.current && blockTimestamp) {
        const now = Date.now();
        const msBlockTimestamp = blockTimestamp * 1000;
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
    } catch (e) {
      //
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
      timeout.current = setTimeout(
        () => startPollingWatchCommitTransaction(),
        10000
      );
    }
  }, [registrationStep, watchCommitTransaction]);

  useEffect(() => {
    const estimateGasLimit = async () => {
      const estimate = estimateGasLimitActions[registrationStep];
      const gasLimit = (await estimate?.()) || null;
      setStepGasLimit(gasLimit);
    };
    estimateGasLimit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrationStep, sendReverseRecord]);

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

  useEffect(() => {
    // we need to check from blocks if the time has passed or not
    const checkRegisterBlockTimestamp = async () => {
      try {
        const block = await web3Provider.getBlock('latest');
        const msBlockTimestamp = block?.timestamp * 1000;
        const secs = differenceInSeconds(
          msBlockTimestamp,
          registrationParameters?.commitTransactionConfirmedAt ||
            msBlockTimestamp
        );
        if (secs > ENS_SECONDS_WAIT) setReadyToRegister(true);
      } catch (e) {
        //
      }
    };
    if (secondsSinceCommitConfirmed >= ENS_SECONDS_WAIT) {
      checkRegisterBlockTimestamp();
    }
  }, [
    isTesting,
    registrationParameters?.commitTransactionConfirmedAt,
    registrationStep,
    secondsSinceCommitConfirmed,
  ]);

  useEffect(() => () => timeout.current && clearTimeout(timeout.current), []);

  return {
    action: actions[registrationStep],
    step: registrationStep,
    stepGasLimit,
  };
}

async function uploadRecordImages(
  records: Partial<Records> | undefined,
  imageMetadata: { avatar?: Image; cover?: Image }
) {
  const uploadRecordImage = async (key: 'avatar' | 'cover') => {
    if (records?.[key]?.startsWith('~') && imageMetadata[key]) {
      const { url } = await uploadImage({
        filename: imageMetadata[key]?.filename || '',
        mime: imageMetadata[key]?.mime || '',
        path: imageMetadata[key]?.path || '',
      });
      return url;
    }
    return records?.[key];
  };

  const [avatar, cover] = await Promise.all([
    uploadRecordImage('avatar'),
    uploadRecordImage('cover'),
  ]);

  return {
    ...records,
    avatar,
    cover,
  };
}
