import { useCallback } from 'react';
import haptics from '@/utils/haptics';
import { RevokeStatus } from '../types';
import { revokeDelegation } from './revokeDelegation';

const REVOKE_SUCCESS_DELAY_MS = 2000;

type DelegationToRevoke = {
  chainId: number;
  contractAddress?: string;
};

export function useRevokeMutation({
  currentDelegation,
  accountAddress,
  isLastDelegation,
  goBack,
  onSuccess,
  setRevokeStatus,
  setCurrentIndex,
}: {
  currentDelegation: DelegationToRevoke;
  accountAddress: string;
  isLastDelegation: boolean;
  goBack: () => void;
  onSuccess?: () => void;
  setRevokeStatus: (s: RevokeStatus) => void;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
}): { revoke: () => void } {
  const revoke = useCallback(async () => {
    if (!currentDelegation || !accountAddress) {
      goBack();
      return;
    }

    setRevokeStatus('revoking');

    try {
      await revokeDelegation(currentDelegation.chainId, accountAddress);

      haptics.notificationSuccess();
      setRevokeStatus('success');

      setTimeout(() => {
        if (isLastDelegation) {
          onSuccess?.();
          goBack();
        } else {
          setCurrentIndex(prev => prev + 1);
          setRevokeStatus('notReady');
        }
      }, REVOKE_SUCCESS_DELAY_MS);
    } catch {
      haptics.notificationError();
      setRevokeStatus('recoverableError');
    }
  }, [currentDelegation, accountAddress, isLastDelegation, goBack, onSuccess, setRevokeStatus, setCurrentIndex]);

  return { revoke };
}
