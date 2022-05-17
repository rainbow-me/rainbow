import { useNavigation } from '@react-navigation/core';
import { useCallback, useMemo } from 'react';
import { Image } from 'react-native-image-crop-picker';
import { useDispatch } from 'react-redux';
import { useRecoilValue } from 'recoil';
import { avatarMetadataAtom } from '../components/ens-registration/RegistrationAvatar/RegistrationAvatar';
import { coverMetadataAtom } from '../components/ens-registration/RegistrationCover/RegistrationCover';
import { ENSActionParameters, RapActionTypes } from '../raps/common';
import useTransactions from './useTransactions';
import { useAccountSettings, useCurrentNonce, useENSRegistration } from '.';
import { Records, RegistrationParameters } from '@rainbow-me/entities';
import { fetchResolver } from '@rainbow-me/handlers/ens';
import { uploadImage } from '@rainbow-me/handlers/pinata';
import { getProviderForNetwork } from '@rainbow-me/handlers/web3';
import {
  ENS_DOMAIN,
  generateSalt,
  getRentPrice,
  REGISTRATION_STEPS,
} from '@rainbow-me/helpers/ens';
import { loadWallet } from '@rainbow-me/model/wallet';
import { executeRap } from '@rainbow-me/raps';
import { saveCommitRegistrationParameters } from '@rainbow-me/redux/ensRegistration';
import { timeUnits } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import { logger } from '@rainbow-me/utils';

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
    step: registrationStep,
  }: {
    yearsDuration: number;
    sendReverseRecord: boolean;
    step: keyof typeof REGISTRATION_STEPS;
  } = {} as any
) {
  const dispatch = useDispatch();
  const { accountAddress, network } = useAccountSettings();
  const getNextNonce = useCurrentNonce(accountAddress, network);
  const { registrationParameters } = useENSRegistration();
  const { navigate } = useNavigation();
  const { getTransactionByHash } = useTransactions();

  const avatarMetadata = useRecoilValue(avatarMetadataAtom);
  const coverMetadata = useRecoilValue(coverMetadataAtom);

  const duration = yearsDuration * timeUnits.secs.year;

  // actions
  const commitAction = useCallback(
    async (callback: () => void) => {
      const wallet = await loadWallet();
      if (!wallet) {
        return;
      }
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
    [getNextNonce, registrationParameters, duration, accountAddress]
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
      const tx = getTransactionByHash(commitTransactionHash || '');
      commitTransactionHash &&
        tx &&
        navigate(Routes.SPEED_UP_AND_CANCEL_SHEET, {
          accentColor,
          onSendTransactionCallback: saveCommitTransactionHash,
          tx,
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
      console.log('🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫 registerAction');
      const {
        name,
        duration,
      } = registrationParameters as RegistrationParameters;

      console.log('🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫 about to loadWallet');
      const provider = await getProviderForNetwork();
      let wallet;
      try {
        wallet = await loadWallet(undefined, true, provider);
      } catch (e) {
        console.log('LOAD WALLET ERRROR', e);
      }
      console.log('🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫 loadWallet', wallet);
      if (!wallet) {
        return;
      }
      console.log('🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫 about to Promise.all name', name);
      console.log(
        '🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫 about to Promise.all duration',
        duration
      );
      console.log(
        '🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫 about to Promise.all registrationParameters',
        registrationParameters
      );

      let nonce;
      let rentPrice;
      let changedRecords;

      try {
        const results = await Promise.all([
          getNextNonce(),
          getRentPrice(name?.replace(ENS_DOMAIN, ''), duration),
          uploadRecordImages(registrationParameters.changedRecords, {
            avatar: avatarMetadata,
            cover: coverMetadata,
          }),
        ]);
        nonce = results[0];
        rentPrice = results[1];
        changedRecords = results[2];
      } catch (e) {
        console.log('🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫errorr', e);
      }
      console.log(
        '🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫 about to registerEnsRegistrationParameters nonce',
        nonce
      );
      console.log(
        '🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫 about to registerEnsRegistrationParameters norentPricence',
        rentPrice
      );
      console.log(
        '🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫 about to registerEnsRegistrationParameters nonce',
        changedRecords
      );
      console.log(
        '🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫 about to registerEnsRegistrationParameters'
      );
      const registerEnsRegistrationParameters: ENSActionParameters = {
        ...formatENSActionParams(registrationParameters),
        duration,
        nonce,
        ownerAddress: accountAddress,
        records: changedRecords,
        rentPrice: rentPrice?.toString(),
        setReverseRecord: sendReverseRecord,
      };
      console.log('🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫 about to executeRap');

      try {
        await executeRap(
          wallet,
          RapActionTypes.registerENS,
          registerEnsRegistrationParameters,
          callback
        );
      } catch (e) {
        console.log('🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫  executeRap error', e);
      }
      console.log('🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫 about to executeRap out');
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

  const renewAction = useCallback(
    async (callback: () => void) => {
      const {
        name,
        duration,
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
        ...formatENSActionParams(registrationParameters),
        duration,
        nonce,
        rentPrice: rentPrice.toString(),
      };

      await executeRap(
        wallet,
        RapActionTypes.renewENS,
        registerEnsRegistrationParameters,
        callback
      );
    },
    [getNextNonce, registrationParameters]
  );

  const setNameAction = useCallback(
    async (callback: () => void) => {
      const { name } = registrationParameters as RegistrationParameters;

      const wallet = await loadWallet();
      if (!wallet) {
        return;
      }

      const nonce = await getNextNonce();

      const registerEnsRegistrationParameters: ENSActionParameters = {
        ...formatENSActionParams(registrationParameters),
        name,
        nonce,
        ownerAddress: accountAddress,
      };

      await executeRap(
        wallet,
        RapActionTypes.setNameENS,
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

  const actions = useMemo(
    () => ({
      [REGISTRATION_STEPS.COMMIT]: commitAction,
      [REGISTRATION_STEPS.EDIT]: setRecordsAction,
      [REGISTRATION_STEPS.REGISTER]: registerAction,
      [REGISTRATION_STEPS.RENEW]: renewAction,
      [REGISTRATION_STEPS.SET_NAME]: setNameAction,
      [REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION]: speedUpCommitAction,
      [REGISTRATION_STEPS.WAIT_ENS_COMMITMENT]: () => null,
    }),
    [
      commitAction,
      registerAction,
      renewAction,
      setNameAction,
      setRecordsAction,
      speedUpCommitAction,
    ]
  );

  return {
    action: actions[registrationStep],
  };
}

async function uploadRecordImages(
  records: Partial<Records> | undefined,
  imageMetadata: { avatar?: Image; cover?: Image }
) {
  const uploadRecordImage = async (key: 'avatar' | 'cover') => {
    if (
      (records?.[key]?.startsWith('~') || records?.[key]?.startsWith('file')) &&
      imageMetadata[key]
    ) {
      try {
        const { url } = await uploadImage({
          filename: imageMetadata[key]?.filename || '',
          mime: imageMetadata[key]?.mime || '',
          path: imageMetadata[key]?.path || '',
        });
        return url;
      } catch (error) {
        logger.sentry('[uploadRecordImages] Failed to upload image.', error);
        return undefined;
      }
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
