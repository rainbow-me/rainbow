import { useCallback } from 'react';
import { useMMKVBoolean } from 'react-native-mmkv';
import useAccountSettings from './useAccountSettings';

export default function useOpenInvestmentCards() {
  const { accountAddress } = useAccountSettings();
  const [isInvestmentCardsOpen, setIsInvestmentCardsOpen] = useMMKVBoolean(
    'investments-open-' + accountAddress
  );

  const toggleOpenInvestmentCards = useCallback(
    () => setIsInvestmentCardsOpen(prev => !prev),
    [setIsInvestmentCardsOpen]
  );

  return {
    isInvestmentCardsOpen,
    toggleOpenInvestmentCards,
  };
}
