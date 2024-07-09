import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Image } from 'react-native-image-crop-picker';
import { useRecoilValue } from 'recoil';
import { avatarMetadataAtom } from '../components/ens-registration/RegistrationAvatar/RegistrationAvatar';
import { coverMetadataAtom } from '../components/ens-registration/RegistrationCover/RegistrationCover';
import { ENSActionParameters, ENSRapActionType } from '@/raps/common';
import usePendingTransactions from './usePendingTransactions';
import { useAccountSettings, useENSRegistration, useWalletENSAvatar, useWallets } from '.';
import { Records, RegistrationParameters } from '@/entities';
import { fetchResolver } from '@/handlers/ens';
import { saveNameFromLabelhash } from '@/handlers/localstorage/ens';
import { uploadImage } from '@/handlers/pinata';
import { getProviderForNetwork } from '@/handlers/web3';
import { ENS_DOMAIN, generateSalt, getRentPrice, REGISTRATION_STEPS } from '@/helpers/ens';
import { loadWallet } from '@/model/wallet';
import { timeUnits } from '@/references';
import Routes from '@/navigation/routesNames';
import { labelhash, logger } from '@/utils';
import { getNextNonce } from '@/state/nonces';
import { Network } from '@/networks/types';
import { Hex } from 'viem';
import { executeENSRap } from '@/raps/actions/ens';
import store from '@/redux/store';

const NOOP = () => null;

const formatENSActionParams = (registrationParameters: RegistrationParameters): ENSActionParameters => {
  const { selectedGasFee, gasFeeParamsBySpeed } = store.getState().gas;

  return {
    duration: registrationParameters?.duration,
    mode: registrationParameters?.mode,
    name: registrationParameters?.name,
    ownerAddress: registrationParameters?.ownerAddress,
    records: registrationParameters?.records,
    rentPrice: registrationParameters?.rentPrice,
    salt: registrationParameters?.salt,
    setReverseRecord: registrationParameters?.setReverseRecord,
    gasFeeParamsBySpeed,
    selectedGasFee,
  };
};

export default function useENSRegistrationActionHandler(
  {
    sendReverseRecord = false,
    yearsDuration = 1,
    step: registrationStep,
  }: {
    yearsDuration?: number;
    sendReverseRecord?: boolean;
    step: keyof typeof REGISTRATION_STEPS;
  } = {} as any
) {
  const { accountAddress } = useAccountSettings();
  const { registrationParameters } = useENSRegistration();
  const { navigate, goBack } = useNavigation();
  const { getPendingTransactionByHash } = usePendingTransactions();
  const { updateWalletENSAvatars } = useWalletENSAvatar();
  const { isHardwareWallet } = useWallets();

  const avatarMetadata = useRecoilValue(avatarMetadataAtom);
  const coverMetadata = useRecoilValue(coverMetadataAtom);

  const duration = yearsDuration * timeUnits.secs.year;

  const updateAvatarsOnNextBlock = useRef(false);
  useEffect(() => {
    let provider: StaticJsonRpcProvider;

    const updateAvatars = () => {
      if (updateAvatarsOnNextBlock.current) {
        updateWalletENSAvatars();
        updateAvatarsOnNextBlock.current = false;
      }
    };

    (() => {
      provider = getProviderForNetwork();
      provider.on('block', updateAvatars);
    })();
    return () => {
      provider?.off('block', updateAvatars);
    };
  }, [updateWalletENSAvatars]);

  // actions
  const commitAction = useCallback(
    async (callback: () => void = NOOP) => {
      updateAvatarsOnNextBlock.current = true;

      const provider = getProviderForNetwork();
      const wallet = await loadWallet(undefined, false, provider);
      if (!wallet) {
        return;
      }
      const salt = generateSalt();

      const [nonce, rentPrice] = await Promise.all([
        getNextNonce({ network: Network.mainnet, address: accountAddress }),
        getRentPrice(registrationParameters.name.replace(ENS_DOMAIN, ''), duration),
      ]);

      const hash = labelhash(registrationParameters.name.replace(ENS_DOMAIN, ''));
      await saveNameFromLabelhash(hash, registrationParameters.name);

      const commitEnsRegistrationParameters: ENSActionParameters = {
        ...formatENSActionParams(registrationParameters),
        duration,
        nonce,
        ownerAddress: accountAddress,
        records: registrationParameters.changedRecords,
        rentPrice: rentPrice.toString(),
        salt,
      };

      await executeENSRap(wallet, ENSRapActionType.commitENS, commitEnsRegistrationParameters, () => {
        if (isHardwareWallet) {
          goBack();
        }
        callback;
      });
    },
    [registrationParameters, duration, accountAddress, isHardwareWallet, goBack]
  );

  const speedUpCommitAction = useCallback(
    async (accentColor: string) => {
      // we want to speed up the last commit tx sent
      const commitTransactionHash = registrationParameters?.commitTransactionHash;

      const tx = getPendingTransactionByHash(commitTransactionHash || '');
      commitTransactionHash &&
        tx &&
        navigate(ios ? Routes.SPEED_UP_AND_CANCEL_SHEET : Routes.SPEED_UP_AND_CANCEL_BOTTOM_SHEET, {
          accentColor,
          tx,
          type: 'speed_up',
        });
    },
    [getPendingTransactionByHash, navigate, registrationParameters?.commitTransactionHash]
  );

  const registerAction = useCallback(
    async (callback: () => void = NOOP) => {
      const { name, duration } = registrationParameters as RegistrationParameters;

      const provider = getProviderForNetwork();
      const wallet = await loadWallet(undefined, false, provider);
      if (!wallet) {
        return;
      }

      const [nonce, rentPrice, changedRecords] = await Promise.all([
        getNextNonce({ network: Network.mainnet, address: accountAddress }),
        getRentPrice(name.replace(ENS_DOMAIN, ''), duration),
        uploadRecordImages(registrationParameters.changedRecords, {
          avatar: avatarMetadata,
          header: coverMetadata,
        }),
      ]);

      const registerEnsRegistrationParameters: ENSActionParameters = {
        ...formatENSActionParams(registrationParameters),
        duration,
        nonce,
        ownerAddress: accountAddress,
        records: changedRecords,
        rentPrice: rentPrice.toString(),
        setReverseRecord: sendReverseRecord,
      };

      await executeENSRap(wallet, ENSRapActionType.registerENS, registerEnsRegistrationParameters, callback);

      updateAvatarsOnNextBlock.current = true;
    },
    [accountAddress, avatarMetadata, coverMetadata, registrationParameters, sendReverseRecord]
  );

  const renewAction = useCallback(
    async (callback: () => void = NOOP) => {
      const { name } = registrationParameters as RegistrationParameters;

      const provider = getProviderForNetwork();
      const wallet = await loadWallet(undefined, false, provider);
      if (!wallet) {
        return;
      }

      const nonce = await getNextNonce({ network: Network.mainnet, address: accountAddress });
      const rentPrice = await getRentPrice(name.replace(ENS_DOMAIN, ''), duration);

      const registerEnsRegistrationParameters: ENSActionParameters = {
        ...formatENSActionParams(registrationParameters),
        duration,
        nonce,
        rentPrice: rentPrice.toString(),
      };

      await executeENSRap(wallet, ENSRapActionType.renewENS, registerEnsRegistrationParameters, callback);
    },
    [accountAddress, duration, registrationParameters]
  );

  const setNameAction = useCallback(
    async (callback: () => void = NOOP) => {
      const { name } = registrationParameters as RegistrationParameters;

      const provider = getProviderForNetwork();
      const wallet = await loadWallet(undefined, false, provider);
      if (!wallet) {
        return;
      }

      const nonce = await getNextNonce({ network: Network.mainnet, address: accountAddress });

      const registerEnsRegistrationParameters: ENSActionParameters = {
        ...formatENSActionParams(registrationParameters),
        name,
        nonce,
        ownerAddress: accountAddress,
      };

      await executeENSRap(wallet, ENSRapActionType.setNameENS, registerEnsRegistrationParameters, callback);
    },
    [accountAddress, registrationParameters]
  );

  const setRecordsAction = useCallback(
    async (callback: () => void = NOOP) => {
      const provider = getProviderForNetwork();
      const wallet = await loadWallet(undefined, false, provider);
      if (!wallet) {
        return;
      }

      const [nonce, changedRecords, resolver] = await Promise.all([
        getNextNonce({ network: Network.mainnet, address: accountAddress }),
        uploadRecordImages(registrationParameters.changedRecords, {
          avatar: avatarMetadata,
          header: coverMetadata,
        }),
        fetchResolver(registrationParameters.name),
      ]);

      const setRecordsEnsRegistrationParameters: ENSActionParameters = {
        ...formatENSActionParams(registrationParameters),
        nonce,
        ownerAddress: accountAddress,
        records: changedRecords,
        resolverAddress: resolver?.address as Hex,
        setReverseRecord: sendReverseRecord,
      };

      await executeENSRap(wallet, ENSRapActionType.setRecordsENS, setRecordsEnsRegistrationParameters, callback);

      updateAvatarsOnNextBlock.current = true;
    },
    [accountAddress, avatarMetadata, coverMetadata, registrationParameters, sendReverseRecord]
  );

  const transferAction = useCallback(
    async (
      callback: () => void = NOOP,
      { clearRecords, records, name, setAddress, toAddress, transferControl, wallet: walletOverride }: any
    ) => {
      let wallet = walletOverride;
      if (!wallet) {
        const provider = getProviderForNetwork();
        wallet = await loadWallet(undefined, false, provider);
      }
      if (!wallet) {
        return;
      }

      const nonce = await getNextNonce({ network: Network.mainnet, address: accountAddress });

      const transferEnsParameters: ENSActionParameters = {
        ...formatENSActionParams({
          ...registrationParameters,
          records: records ?? registrationParameters.records,
        }),
        clearRecords,
        name,
        nonce,
        ownerAddress: accountAddress,
        setAddress,
        toAddress,
        transferControl,
      };

      const { nonce: newNonce } = await executeENSRap(wallet, ENSRapActionType.transferENS, transferEnsParameters, callback);

      return { nonce: newNonce };
    },
    [accountAddress, registrationParameters]
  );

  const actions = useMemo(
    () => ({
      [REGISTRATION_STEPS.COMMIT]: commitAction,
      [REGISTRATION_STEPS.EDIT]: setRecordsAction,
      [REGISTRATION_STEPS.REGISTER]: registerAction,
      [REGISTRATION_STEPS.RENEW]: renewAction,
      [REGISTRATION_STEPS.SET_NAME]: setNameAction,
      [REGISTRATION_STEPS.TRANSFER]: transferAction,
      [REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION]: speedUpCommitAction,
      [REGISTRATION_STEPS.WAIT_ENS_COMMITMENT]: () => null,
    }),
    [commitAction, registerAction, renewAction, setNameAction, setRecordsAction, speedUpCommitAction, transferAction]
  );

  return {
    action: actions[registrationStep] as (...args: any) => void,
  };
}

async function uploadRecordImages(records: Partial<Records> | undefined, imageMetadata: { avatar?: Image; header?: Image }) {
  const uploadRecordImage = async (key: 'avatar' | 'header') => {
    if ((records?.[key]?.startsWith('~') || records?.[key]?.startsWith('file')) && imageMetadata[key]) {
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

  const [avatar, header] = await Promise.all([uploadRecordImage('avatar'), uploadRecordImage('header')]);

  return {
    ...records,
    avatar,
    header,
  };
}
