import { useCallback } from 'react';
import { useMMKVBoolean } from 'react-native-mmkv';
import useAccountSettings from './useAccountSettings';

export default function useOpenPositionCards() {
  const { accountAddress } = useAccountSettings();
  const [isPositionCardsOpen, setIsPositionCardsOpen] = useMMKVBoolean('positions-open-' + accountAddress);

  const toggleOpenPositionCards = useCallback(() => setIsPositionCardsOpen(prev => !prev), [setIsPositionCardsOpen]);

  return {
    isPositionCardsOpen,
    toggleOpenPositionCards,
  };
}
