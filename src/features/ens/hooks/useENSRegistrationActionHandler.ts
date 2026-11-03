import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { type StaticJsonRpcProvider } from '@ethersproject/providers';
import { noop } from 'lodash';

import { type PendingTransaction } from '@/entities/transactions';
import { REGISTRATION_STEPS } from '@/features/ens/types/registration';
import { ChainId } from '@/features/network/types/backendNetworks';
import { loadWallet } from '@/features/wallet/data/loadWallet';
import { getProvider } from '@/handlers/web3';
import usePendingTransactions from '@/hooks/usePendingTransactions';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import timeUnits from '@/references/time-units.json';
import { getNextNonce } from '@/state/nonces';
import { refreshWalletInfo, useAccountAddress, useIsHardwareWallet } from '@/state/wallets/walletsStore';

import { executeEnsTransactions } from '../data/executeTransactions';
import { createEnsCommitment } from '../data/registration';
import { useENSRegistration } from './useENSRegistration';

type RegistrationAction = (onSubmitted?: () => void) => Promise<void>;

export type ActionTypes = {
  [REGISTRATION_STEPS.COMMIT]: RegistrationAction;
  [REGISTRATION_STEPS.REGISTER]: RegistrationAction;
  [REGISTRATION_STEPS.RENEW]: RegistrationAction;
  [REGISTRATION_STEPS.EDIT]: RegistrationAction;
  [REGISTRATION_STEPS.SET_NAME]: RegistrationAction;
  [REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION]: (accentColor: string) => Promise<void>;
  [REGISTRATION_STEPS.WAIT_ENS_COMMITMENT]: () => Promise<void>;
};

export function useENSRegistrationActionHandler<Step extends keyof ActionTypes>({
  step,
  sendReverseRecord = false,
  yearsDuration = 1,
}: {
  step: Step;
  sendReverseRecord?: boolean;
  yearsDuration?: number;
}): { action: ActionTypes[Step] } {
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
      const [nonce, commitment] = await Promise.all([
        getNextNonce({ chainId: ChainId.mainnet, address: accountAddress }),
        createEnsCommitment(accountAddress, duration),
      ]);
      await executeEnsTransactions(wallet, { type: 'commit', name: registrationParameters.name, commitment }, nonce, () => {
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
      const { name, commitment } = registrationParameters;
      if (!commitment) throw new Error('Registration requires a saved commitment');

      const provider = getProvider({ chainId: ChainId.mainnet });
      const wallet = await loadWallet({
        provider,
      });
      if (!wallet) {
        return;
      }

      const nonce = await getNextNonce({ chainId: ChainId.mainnet, address: accountAddress });

      await executeEnsTransactions(
        wallet,
        { type: 'register', name, commitment, records: changedRecords, setReverseRecord: sendReverseRecord },
        nonce,
        callback
      );

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
      await executeEnsTransactions(wallet, { type: 'renew', name, duration }, nonce, callback);
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

      await executeEnsTransactions(wallet, { type: 'primary', name }, nonce, callback);
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

      const nonce = await getNextNonce({ chainId: ChainId.mainnet, address: accountAddress });

      await executeEnsTransactions(
        wallet,
        { type: 'records', name: registrationParameters.name, records: changedRecords, setReverseRecord: sendReverseRecord },
        nonce,
        callback
      );

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
    action: actions[step],
  };
}
