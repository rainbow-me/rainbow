import { useCallback } from 'react';
import { useMMKVBoolean } from 'react-native-mmkv';

export default function useOpenInvestmentCards() {
  const [isInvestmentCardsOpen, setIsInvestmentCardsOpen] = useMMKVBoolean(
    'investments-open'
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
