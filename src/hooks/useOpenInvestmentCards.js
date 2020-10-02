import { useCallback } from 'react';
import {
  pushOpenInvestmentCard as rawPushOpenInvestmentCard,
  setOpenInvestmentCards as rawSetOpenInvestmentCards,
} from '../redux/openStateSettings';
import { useDispatch, useSelector } from '@rainbow-me/react-redux';

export default function useOpenInvestmentCards() {
  const dispatch = useDispatch();
  const openInvestmentCards = useSelector(
    ({ openStateSettings: { openInvestmentCards } }) => openInvestmentCards
  );

  const pushOpenInvestmentCard = useCallback(
    data => dispatch(rawPushOpenInvestmentCard(data)),
    [dispatch]
  );

  const setOpenInvestmentCards = useCallback(
    data => dispatch(rawSetOpenInvestmentCards(data)),
    [dispatch]
  );

  return {
    openInvestmentCards,
    pushOpenInvestmentCard,
    setOpenInvestmentCards,
  };
}
