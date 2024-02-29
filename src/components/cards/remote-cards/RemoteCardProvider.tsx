import { noop } from 'lodash';
import React, { PropsWithChildren, createContext } from 'react';
import Routes from '@/navigation/routesNames';
import { TrimmedCard, TrimmedCards, cardCollectionQueryKey, useCardCollectionQuery } from '@/resources/cards/cardCollectionQuery';
import * as ls from '@/storage';
import { queryClient } from '@/react-query';

type RoutesWithIndex = typeof Routes & { [key: string]: string };

type CardProviderProps = {
  initialState?: TrimmedCards;
};

type CardContextProps = {
  cards: TrimmedCards;
  dismissCard: (cardId: string) => void;
  getCardsForPlacement: (placement: string) => TrimmedCard[];
};

export const RemoteCardContext = createContext<CardContextProps>({
  cards: {},
  dismissCard: noop,
  getCardsForPlacement: () => [],
});

export const RemoteCardProvider: React.FC<PropsWithChildren<CardProviderProps>> = ({ children }) => {
  const { data: cards = {} } = useCardCollectionQuery();

  const dismissCard = (cardId: string) => {
    ls.cards.set([cardId], true);
    queryClient.setQueryData(cardCollectionQueryKey, (prev: TrimmedCards | undefined) => {
      if (!prev) return {};
      const { [cardId]: _, ...rest } = prev;
      return rest;
    });
  };

  const getCardsForPlacement = (placement: string) => {
    if (!cards) return [];
    return Object.values(cards)
      .filter(card => card.placement && (Routes as RoutesWithIndex)[card.placement.toString()] === placement)
      .sort((a, b) => {
        if (a.index === b.index) return 0;
        if (a.index === undefined || a.index === null) return 1;
        if (b.index === undefined || b.index === null) return -1;

        return a.index - b.index;
      });
  };

  return <RemoteCardContext.Provider value={{ cards, dismissCard, getCardsForPlacement }}>{children}</RemoteCardContext.Provider>;
};

export const useRemoteCardContext = () => React.useContext(RemoteCardContext);
