import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { type StaticJsonRpcProvider } from '@ethersproject/providers';
import { noop } from 'lodash';
import { getAddress } from 'viem';

import { type PendingTransaction } from '@/entities/transactions';
import { ChainId } from '@/features/network/types/backendNetworks';
import { loadWallet } from '@/features/wallet/data/loadWallet';
import { getProvider } from '@/handlers/web3';
import usePendingTransactions from '@/hooks/usePendingTransactions';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import store from '@/redux/store';
import timeUnits from '@/references/time-units.json';
import { getNextNonce } from '@/state/nonces';
import { refreshWalletInfo, useAccountAddress, useIsHardwareWallet } from '@/state/wallets/walletsStore';

import { executeENSRap } from '../raps/actions';
import { ENSRapActionType, type ENSActionParameters } from '../raps/common';
import { type RegistrationParameters } from '../types/registration';
import { ENS_DOMAIN, generateSalt, getRentPrice, REGISTRATION_STEPS } from '../utils/helpers';
import { useENSRegistration } from './useENSRegistration';

// Generic type for action functions
type ActionFunction<P extends any[] = [], R = void> = (...params: P) => Promise<R>;

// Define action types using the generic ActionFunction
export type ActionTypes = {
  [REGISTRATION_STEPS.COMMIT]: ActionFunction<[callback?: () => void]>;
  [REGISTRATION_STEPS.REGISTER]: ActionFunction<[callback?: () => void]>;
  [REGISTRATION_STEPS.RENEW]: ActionFunction<[callback?: () => void]>;
  [REGISTRATION_STEPS.EDIT]: ActionFunction<[callback?: () => void]>;
  [REGISTRATION_STEPS.SET_NAME]: ActionFunction<[callback?: () => void]>;
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

export const useENSRegistrationActionHandler: UseENSRegistrationActionHandler = ({
  step,
  sendReverseRecord = false,
  yearsDuration = 1,
}) => {
  const { navigate, goBack } = useNavigation();
  const { getPendingTransactionByHash } = usePendingTransactions();
  const isHardwareWallet = useIsHardwareWallet();
  const accountAddress = useAccountAddress();
  const { registrationParameters, changedRecords } = useENSRegistration();

  const duration = yearsDuration * timeUnits.secs.year;

  const updateAvatarsOnNextBlock = useRef(false);
  useEffect(() => {
    let provider: StaticJsonRpcProvider;

    const updateAvatars = () => {
      if (updateAvatarsOnNextBlock.current) {
        refreshWalletInfo();
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
  }, []);

  // actions
  const commitAction: ActionTypes[typeof REGISTRATION_STEPS.COMMIT] = useCallback(
    async (callback = noop) => {
      if (!registrationParameters) throw new Error('No active ENS registration');
      updateAvatarsOnNextBlock.current = true;

      const provider = getProvider({ chainId: ChainId.mainnet });
      const wallet = await loadWallet({
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

      const commitEnsRegistrationParameters: ENSActionParameters = {
        ...formatENSActionParams(registrationParameters),
        duration,
        nonce,
        ownerAddress: accountAddress,
        records: changedRecords,
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
    [registrationParameters, changedRecords, duration, accountAddress, isHardwareWallet, goBack]
  );

  const speedUpCommitAction: ActionTypes[typeof REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION] = useCallback(
    async (accentColor: string) => {
      const commitTransactionHash = registrationParameters?.commitTransactionHash;

      const tx = getPendingTransactionByHash(commitTransactionHash || '');
      if (commitTransactionHash && tx) {
        if (Platform.OS === 'ios') {
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
      if (!registrationParameters) throw new Error('No active ENS registration');
      const { name, duration, salt } = registrationParameters;
      if (!duration || !salt) throw new Error('Registration requires a saved commitment');

      const provider = getProvider({ chainId: ChainId.mainnet });
      const wallet = await loadWallet({
        provider,
      });
      if (!wallet) {
        return;
      }

      const [nonce, rentPrice] = await Promise.all([
        getNextNonce({ chainId: ChainId.mainnet, address: accountAddress }),
        getRentPrice(name.replace(ENS_DOMAIN, ''), duration),
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
    [accountAddress, registrationParameters, changedRecords, sendReverseRecord]
  );

  const renewAction: ActionTypes[typeof REGISTRATION_STEPS.RENEW] = useCallback(
    async (callback = noop) => {
      if (!registrationParameters) throw new Error('No active ENS registration');
      const { name } = registrationParameters;

      const provider = getProvider({ chainId: ChainId.mainnet });
      const wallet = await loadWallet({
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
      if (!registrationParameters) throw new Error('No active ENS registration');
      const { name } = registrationParameters;

      const provider = getProvider({ chainId: ChainId.mainnet });
      const wallet = await loadWallet({
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
      if (!registrationParameters) throw new Error('No active ENS registration');
      const provider = getProvider({ chainId: ChainId.mainnet });
      const wallet = await loadWallet({
        provider,
      });
      if (!wallet) {
        return;
      }

      const [nonce, resolver] = await Promise.all([
        getNextNonce({ chainId: ChainId.mainnet, address: accountAddress }),
        getProvider({ chainId: ChainId.mainnet }).getResolver(registrationParameters.name),
      ]);

      if (!resolver) throw new Error('ENS name has no resolver');

      const setRecordsEnsRegistrationParameters: ENSActionParameters = {
        ...formatENSActionParams(registrationParameters),
        nonce,
        ownerAddress: accountAddress,
        records: changedRecords,
        resolverAddress: getAddress(resolver.address),
        setReverseRecord: sendReverseRecord,
      };

      await executeENSRap(wallet, ENSRapActionType.setRecordsENS, setRecordsEnsRegistrationParameters, callback);

      updateAvatarsOnNextBlock.current = true;
    },
    [accountAddress, registrationParameters, changedRecords, sendReverseRecord]
  );

  const actions: ActionTypes = {
    [REGISTRATION_STEPS.COMMIT]: commitAction,
    [REGISTRATION_STEPS.EDIT]: setRecordsAction,
    [REGISTRATION_STEPS.REGISTER]: registerAction,
    [REGISTRATION_STEPS.RENEW]: renewAction,
    [REGISTRATION_STEPS.SET_NAME]: setNameAction,
    [REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION]: speedUpCommitAction,
    [REGISTRATION_STEPS.WAIT_ENS_COMMITMENT]: () => Promise.resolve(),
  };

  return {
    action: actions[step] as ActionTypes[typeof step],
  };
};
