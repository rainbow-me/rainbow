import { noop, pick } from 'lodash';
import React, { PropsWithChildren, createContext, useState } from 'react';
import { Card } from '@/graphql/__generated__/arc';
import Routes from '@/navigation/routesNames';
import { IS_TESTING } from 'react-native-dotenv';
import {
  CardCollectionResult,
  useCardCollectionQuery,
} from '@/resources/cards/cardCollectionQuery';
import * as ls from '@/storage';
import { REMOTE_CARDS, useExperimentalFlag } from '@/config';
import { useRemoteConfig } from '@/model/remoteConfig';

const TRIMMED_CARD_KEYS = [
  'cardKey',
  'placement',
  'index',
  'backgroundColor',
  'padding',
  'imageRadius',
  'subtitle',
  'subtitleColor',
  'title',
  'titleColor',
  'description',
  'descriptionColor',
  'items',
  'primaryButton',
] as const;

type RoutesWithIndex = typeof Routes & { [key: string]: string };

export type TrimmedCard = Pick<Card, typeof TRIMMED_CARD_KEYS[number]> & {
  sys: Pick<Card['sys'], 'id'>;
  imageCollection: {
    items: {
      url: string;
    }[];
  };
};

type CardProviderProps = {
  initialState?: Record<keyof TrimmedCard['cardKey'], TrimmedCard>;
};

type CardContextProps = {
  cards: Record<string, TrimmedCard>;
  setCards: React.Dispatch<React.SetStateAction<Record<string, TrimmedCard>>>;
  dismissCard: (cardId: string) => void;
  getCardsForPlacement: (placement: string) => TrimmedCard[];
};

export const RemoteCardContext = createContext<CardContextProps>({
  cards: {},
  setCards: noop,
  dismissCard: noop,
  getCardsForPlacement: () => [],
});

export const RemoteCardProvider: React.FC<
  PropsWithChildren<CardProviderProps>
> = ({ children }) => {
  const config = useRemoteConfig();

  const [cards, setCards] = useState<Record<string, TrimmedCard>>({});
  const enabled =
    useExperimentalFlag(REMOTE_CARDS) || config.remote_cards_enabled;

  useCardCollectionQuery(
    {},
    {
      enabled: enabled && !IS_TESTING,
      refetchInterval: 60_000,
      onSuccess: (data: CardCollectionResult) => {
        if (!data?.cardCollection?.items?.length) return;

        const newCards = data.cardCollection.items.reduce((acc, card) => {
          if (!card) return acc;

          const hasDismissed = ls.cards.get([card.sys.id]);
          if (hasDismissed) return acc;

          const newCard: TrimmedCard = {
            ...pick(card, ...TRIMMED_CARD_KEYS),
            sys: pick(card.sys, 'id'),
            imageCollection: {
              items: (card.imageCollection?.items || []).map(item => ({
                url: item?.url ?? '',
              })),
            },
          };
          return {
            ...acc,
            [card.sys.id]: newCard,
          };
        }, {} as Record<keyof TrimmedCard['cardKey'], Card>);

        if (!Object.values(newCards).length) return;
        setCards(newCards);
      },
    }
  );

  const dismissCard = (cardId: string) => {
    ls.cards.set([cardId], true);
    setCards(prev => {
      const { [cardId]: _, ...rest } = prev;
      return rest;
    });
  };

  const getCardsForPlacement = (placement: string) => {
    return (Object.values(cards) as TrimmedCard[])
      .filter(
        card =>
          card.placement &&
          (Routes as RoutesWithIndex)[card.placement.toString()] === placement
      )
      .sort((a, b) => {
        if (a.index === b.index) return 0;
        if (a.index === undefined || a.index === null) return 1;
        if (b.index === undefined || b.index === null) return -1;

        return a.index - b.index;
      });
  };

  return (
    <RemoteCardContext.Provider
      value={{ cards, setCards, dismissCard, getCardsForPlacement }}
    >
      {children}
    </RemoteCardContext.Provider>
  );
};

export const useRemoteCardContext = () => React.useContext(RemoteCardContext);
