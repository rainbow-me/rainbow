import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setOpenInvestmentCards } from '../redux/openStateSettings';

export default function useOpenInvestmentCards() {
  const dispatch = useDispatch();
  const isInvestmentCardsOpen = useSelector(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'openStateSettings' does not exist on typ... Remove this comment to see the full error message
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
