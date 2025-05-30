import { useCallback } from 'react';
import { useMMKVBoolean } from 'react-native-mmkv';
import { useAccountAddress } from '@/state/wallets/walletsStore';

export default function useOpenPositionCards() {
  const accountAddress = useAccountAddress();
  const [isPositionCardsOpen, setIsPositionCardsOpen] = useMMKVBoolean('positions-open-' + accountAddress);

  const toggleOpenPositionCards = useCallback(() => setIsPositionCardsOpen(prev => !prev), [setIsPositionCardsOpen]);

  return {
    isPositionCardsOpen,
    toggleOpenPositionCards,
  };
}
