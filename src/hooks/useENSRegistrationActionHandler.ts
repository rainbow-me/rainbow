import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';
import { Image } from 'react-native-image-crop-picker';
import { useRecoilValue } from 'recoil';
import { avatarMetadataAtom } from '../components/ens-registration/RegistrationAvatar/RegistrationAvatar';
import { coverMetadataAtom } from '../components/ens-registration/RegistrationCover/RegistrationCover';
import { ENSActionParameters, ENSRapActionType } from '@/raps/common';
import usePendingTransactions from './usePendingTransactions';
import { useAccountSettings, useENSRegistration, useWalletENSAvatar, useWallets } from '.';
import { PendingTransaction, Records, RegistrationParameters } from '@/entities';
import { fetchResolver } from '@/handlers/ens';
import { saveNameFromLabelhash } from '@/handlers/localstorage/ens';
import { uploadImage } from '@/handlers/pinata';
import { getProvider } from '@/handlers/web3';
import { ENS_DOMAIN, generateSalt, getRentPrice, REGISTRATION_STEPS } from '@/helpers/ens';
import { loadWallet } from '@/model/wallet';
import { timeUnits } from '@/references';
import Routes from '@/navigation/routesNames';
import { labelhash } from '@/utils';
import { getNextNonce } from '@/state/nonces';
import { Hex } from 'viem';
import { executeENSRap } from '@/raps/actions/ens';
import store from '@/redux/store';
import { performanceTracking, Screens, TimeToSignOperation } from '@/state/performance/performance';
import { noop } from 'lodash';
import { logger, RainbowError } from '@/logger';
import { ChainId } from '@/state/backendNetworks/types';
import { IS_IOS } from '@/env';

// Generic type for action functions
type ActionFunction<P extends any[] = [], R = void> = (...params: P) => Promise<R>;

// Define action types using the generic ActionFunction
export type ActionTypes = {
  [REGISTRATION_STEPS.COMMIT]: ActionFunction<[callback?: () => void]>;
  [REGISTRATION_STEPS.REGISTER]: ActionFunction<[callback?: () => void]>;
  [REGISTRATION_STEPS.RENEW]: ActionFunction<[callback?: () => void]>;
  [REGISTRATION_STEPS.EDIT]: ActionFunction<[callback?: () => void]>;
  [REGISTRATION_STEPS.SET_NAME]: ActionFunction<[callback?: () => void]>;
  [REGISTRATION_STEPS.TRANSFER]: ActionFunction<
    [
      params: {
        clearRecords: boolean;
        records: any;
        name: string;
        setAddress: boolean;
        toAddress: string;
        transferControl: boolean;
        wallet?: any;
      },
      callback?: () => void,
    ],
    { nonce: number | undefined } | undefined
  >;
  [REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION]: ActionFunction<[accentColor: string]>;
  [REGISTRATION_STEPS.WAIT_ENS_COMMITMENT]: ActionFunction;
};

// Generic helper type to extract parameters from a function type
type ParamsOf<T> = T extends (...args: infer P) => any ? P : never;

// StepParams type derived from ActionTypes
type StepParams = {
  [K in keyof ActionTypes]: ParamsOf<ActionTypes[K]>[0] extends object ? ParamsOf<ActionTypes[K]>[0] : Record<string, never>;
};

// Generic hook type
type UseENSRegistrationActionHandler = <T extends keyof StepParams>(params: {
  step: T;
  sendReverseRecord?: boolean;
  yearsDuration?: number;
}) => {
  action: ActionTypes[T];
};

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

const useENSRegistrationActionHandler: UseENSRegistrationActionHandler = ({ step, sendReverseRecord = false, yearsDuration = 1 }) => {
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
      provider = getProvider({ chainId: ChainId.mainnet });
      provider.on('block', updateAvatars);
    })();
    return () => {
      provider?.off('block', updateAvatars);
    };
  }, [updateWalletENSAvatars]);

  // actions
  const commitAction: ActionTypes[typeof REGISTRATION_STEPS.COMMIT] = useCallback(
    async (callback = noop) => {
      updateAvatarsOnNextBlock.current = true;

      const provider = getProvider({ chainId: ChainId.mainnet });
      const wallet = await loadWallet({
        showErrorIfNotLoaded: false,
        provider,
      });
      if (!wallet) {
        return;
      }
      const salt = generateSalt();

      const [nonce, rentPrice] = await Promise.all([
        getNextNonce({ chainId: ChainId.mainnet, address: accountAddress }),
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
        callback();
      });
    },
    [registrationParameters, duration, accountAddress, isHardwareWallet, goBack]
  );

  const speedUpCommitAction: ActionTypes[typeof REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION] = useCallback(
    async (accentColor: string) => {
      const commitTransactionHash = registrationParameters?.commitTransactionHash;

      const tx = getPendingTransactionByHash(commitTransactionHash || '');
      if (commitTransactionHash && tx) {
        if (IS_IOS) {
          navigate(Routes.SPEED_UP_AND_CANCEL_SHEET, {
            accentColor,
            tx: tx as PendingTransaction,
            type: 'speed_up',
          });
        } else {
          navigate(Routes.SPEED_UP_AND_CANCEL_BOTTOM_SHEET, {
            accentColor,
            tx: tx as PendingTransaction,
            type: 'speed_up',
          });
        }
      }
    },
    [getPendingTransactionByHash, navigate, registrationParameters?.commitTransactionHash]
  );

  const registerAction: ActionTypes[typeof REGISTRATION_STEPS.REGISTER] = useCallback(
    async (callback = noop) => {
      const { name, duration } = registrationParameters as RegistrationParameters;

      const provider = getProvider({ chainId: ChainId.mainnet });
      const wallet = await loadWallet({
        showErrorIfNotLoaded: false,
        provider,
      });
      if (!wallet) {
        return;
      }

      const [nonce, rentPrice, changedRecords] = await Promise.all([
        getNextNonce({ chainId: ChainId.mainnet, address: accountAddress }),
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

  const renewAction: ActionTypes[typeof REGISTRATION_STEPS.RENEW] = useCallback(
    async (callback = noop) => {
      const { name } = registrationParameters as RegistrationParameters;

      const provider = getProvider({ chainId: ChainId.mainnet });
      const wallet = await loadWallet({
        showErrorIfNotLoaded: false,
        provider,
      });
      if (!wallet) {
        return;
      }

      const nonce = await getNextNonce({ chainId: ChainId.mainnet, address: accountAddress });
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

  const setNameAction: ActionTypes[typeof REGISTRATION_STEPS.SET_NAME] = useCallback(
    async (callback = noop) => {
      const { name } = registrationParameters as RegistrationParameters;

      const provider = getProvider({ chainId: ChainId.mainnet });
      const wallet = await loadWallet({
        showErrorIfNotLoaded: false,
        provider,
      });
      if (!wallet) {
        return;
      }

      const nonce = await getNextNonce({ chainId: ChainId.mainnet, address: accountAddress });

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

  const setRecordsAction: ActionTypes[typeof REGISTRATION_STEPS.EDIT] = useCallback(
    async (callback = noop) => {
      const provider = getProvider({ chainId: ChainId.mainnet });
      const wallet = await loadWallet({
        showErrorIfNotLoaded: false,
        provider,
      });
      if (!wallet) {
        return;
      }

      const [nonce, changedRecords, resolver] = await Promise.all([
        getNextNonce({ chainId: ChainId.mainnet, address: accountAddress }),
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

  const transferAction: ActionTypes[typeof REGISTRATION_STEPS.TRANSFER] = useCallback(
    async ({ clearRecords, records, name, setAddress, toAddress, transferControl, wallet: walletOverride }, callback = noop) => {
      let wallet = walletOverride;
      if (!wallet) {
        const provider = getProvider({ chainId: ChainId.mainnet });
        wallet = await loadWallet({
          showErrorIfNotLoaded: false,
          provider,
        });
      }
      if (!wallet) {
        return;
      }

      const nonce = await getNextNonce({ chainId: ChainId.mainnet, address: accountAddress });

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

      const { nonce: newNonce } = await performanceTracking.getState().executeFn({
        fn: executeENSRap,
        screen: Screens.SEND_ENS,
        operation: TimeToSignOperation.BroadcastTransaction,
      })(wallet, ENSRapActionType.transferENS, transferEnsParameters, callback);

      return { nonce: newNonce };
    },
    [accountAddress, registrationParameters]
  );

  const actions: ActionTypes = {
    [REGISTRATION_STEPS.COMMIT]: commitAction,
    [REGISTRATION_STEPS.EDIT]: setRecordsAction,
    [REGISTRATION_STEPS.REGISTER]: registerAction,
    [REGISTRATION_STEPS.RENEW]: renewAction,
    [REGISTRATION_STEPS.SET_NAME]: setNameAction,
    [REGISTRATION_STEPS.TRANSFER]: transferAction,
    [REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION]: speedUpCommitAction,
    [REGISTRATION_STEPS.WAIT_ENS_COMMITMENT]: () => Promise.resolve(),
  };

  return {
    action: actions[step] as ActionTypes[typeof step],
  };
};

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
        logger.error(new RainbowError('[useENSRegistrationActionHandler]: Failed to upload image.'), {
          error,
        });
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

export default useENSRegistrationActionHandler;
