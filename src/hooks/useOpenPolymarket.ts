import { useCallback } from 'react';
import { useMMKVBoolean } from 'react-native-mmkv';
import { useAccountAddress } from '@/state/wallets/walletsStore';

export default function useOpenPolymarket() {
  const accountAddress = useAccountAddress();
  const [isPolymarketOpen, setIsPolymarketOpen] = useMMKVBoolean('polymarket-open-' + accountAddress);

  const toggleOpenPolymarket = useCallback(() => setIsPolymarketOpen(prev => !prev), [setIsPolymarketOpen]);

  return {
    isPolymarketOpen,
    toggleOpenPolymarket,
  };
}
