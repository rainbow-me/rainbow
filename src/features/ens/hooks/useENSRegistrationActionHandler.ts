import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

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
import type { EnsAction } from '../types/transactions';
import { useENSRegistration } from './useENSRegistration';

/**
 * Submits the current registration step or opens speed-up for its pending commitment.
 */
export function useENSRegistrationActionHandler({
  step,
  sendReverseRecord = false,
  yearsDuration = 1,
}: {
  step: REGISTRATION_STEPS;
  sendReverseRecord?: boolean;
  yearsDuration?: number;
}) {
  const { navigate, goBack } = useNavigation();
  const { getPendingTransactionByHash } = usePendingTransactions();
  const isHardwareWallet = useIsHardwareWallet();
  const accountAddress = useAccountAddress();
  const { registrationParameters, changedRecords } = useENSRegistration();

  const duration = yearsDuration * timeUnits.secs.year;

  const updateAvatarsOnNextBlock = useRef(false);
  useEffect(() => {
    const provider = getProvider({ chainId: ChainId.mainnet });

    const updateAvatars = () => {
      if (updateAvatarsOnNextBlock.current) {
        refreshWalletInfo();
        updateAvatarsOnNextBlock.current = false;
      }
    };

    provider.on('block', updateAvatars);
    return () => {
      provider.off('block', updateAvatars);
    };
  }, []);

  const submit = useCallback(
    async (onSubmitted?: () => void) => {
      if (step === REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION || step === REGISTRATION_STEPS.WAIT_ENS_COMMITMENT) return;
      if (!registrationParameters) throw new Error('No active ENS registration');

      const name = registrationParameters.name;
      const commitment = registrationParameters.commitment;

      const provider = getProvider({ chainId: ChainId.mainnet });
      const wallet = await loadWallet({ provider });
      if (!wallet) return;

      const prepareAction = async (): Promise<EnsAction> => {
        switch (step) {
          case REGISTRATION_STEPS.COMMIT:
            return { type: 'commit', name, commitment: await createEnsCommitment(accountAddress, duration) };

          case REGISTRATION_STEPS.REGISTER:
            if (!commitment) throw new Error('Registration requires a saved commitment');
            return { type: 'register', name, commitment, records: changedRecords, setReverseRecord: sendReverseRecord };

          case REGISTRATION_STEPS.EDIT:
            return { type: 'records', name, records: changedRecords, setReverseRecord: sendReverseRecord };

          case REGISTRATION_STEPS.RENEW:
            return { type: 'renew', name, duration };

          case REGISTRATION_STEPS.SET_NAME:
            return { type: 'primary', name };
        }
      };

      const [nonce, action] = await Promise.all([getNextNonce({ chainId: ChainId.mainnet, address: accountAddress }), prepareAction()]);

      await executeEnsTransactions(wallet, action, nonce, () => {
        if (step === REGISTRATION_STEPS.COMMIT && isHardwareWallet) goBack();
        onSubmitted?.();
      });

      if (step === REGISTRATION_STEPS.COMMIT || step === REGISTRATION_STEPS.REGISTER || step === REGISTRATION_STEPS.EDIT) {
        updateAvatarsOnNextBlock.current = true;
      }
    },
    [accountAddress, registrationParameters, changedRecords, sendReverseRecord, step, duration, isHardwareWallet, goBack]
  );

  const speedUpCommit = useCallback(
    (accentColor: string) => {
      const hash = registrationParameters?.commitTransactionHash;
      const transaction = hash ? getPendingTransactionByHash(hash) : undefined;
      if (!transaction) return;

      const route = Platform.OS === 'ios' ? Routes.SPEED_UP_AND_CANCEL_SHEET : Routes.SPEED_UP_AND_CANCEL_BOTTOM_SHEET;
      navigate(route, { accentColor, tx: transaction, type: 'speed_up' });
    },
    [getPendingTransactionByHash, navigate, registrationParameters?.commitTransactionHash]
  );

  return { submit, speedUpCommit };
}
