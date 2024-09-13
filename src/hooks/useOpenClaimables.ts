import { useCallback } from 'react';
import { useMMKVBoolean } from 'react-native-mmkv';
import useAccountSettings from './useAccountSettings';

export default function useOpenClaimables() {
  const { accountAddress } = useAccountSettings();
  const [isClaimablesOpen, setIsClaimablesOpen] = useMMKVBoolean('claimables-open-' + accountAddress);

  const toggleOpenClaimables = useCallback(() => setIsClaimablesOpen(prev => !prev), [setIsClaimablesOpen]);

  return {
    isClaimablesOpen,
    toggleOpenClaimables,
  };
}
