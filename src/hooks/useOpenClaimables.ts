import { useCallback } from 'react';
import { useMMKVBoolean } from 'react-native-mmkv';
import { useAccountAddress } from '@/state/wallets/walletsStore';

export default function useOpenClaimables() {
  const accountAddress = useAccountAddress();
  const [isClaimablesOpen, setIsClaimablesOpen] = useMMKVBoolean('claimables-open-' + accountAddress);

  const toggleOpenClaimables = useCallback(() => setIsClaimablesOpen(prev => !prev), [setIsClaimablesOpen]);

  return {
    isClaimablesOpen,
    toggleOpenClaimables,
  };
}
