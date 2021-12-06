import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setOpenInvestmentCards } from '../redux/openStateSettings';

export default function useOpenInvestmentCards() {
  const dispatch = useDispatch();
  const isInvestmentCardsOpen = useSelector(
    ({ openStateSettings: { openInvestmentCards } }) => openInvestmentCards
  );

  const toggleOpenInvestmentCards = useCallback(
    () => dispatch(setOpenInvestmentCards(!isInvestmentCardsOpen)),
    [dispatch, isInvestmentCardsOpen]
  );

  return {
    isInvestmentCardsOpen,
    toggleOpenInvestmentCards,
  };
}
