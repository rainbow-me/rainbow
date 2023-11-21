import { noop, pick } from 'lodash';
import React, { PropsWithChildren, createContext, useState } from 'react';
import { Card } from '@/graphql/__generated__/arc';
import {
  CardCollectionResult,
  useCardCollectionQuery,
} from '@/resources/cards/cardCollectionQuery';
import * as ls from '@/storage';
import { REMOTE_CARDS, useExperimentalFlag } from '@/config';

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

type TrimmedCard = Pick<Card, typeof TRIMMED_CARD_KEYS[number]> & {
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
  cards: Record<keyof TrimmedCard['cardKey'], TrimmedCard>;
  setCards: React.Dispatch<
    React.SetStateAction<Record<keyof TrimmedCard['cardKey'], TrimmedCard>>
  >;
  dismissCard: (cardKey: keyof TrimmedCard['cardKey']) => void;
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
  const [cards, setCards] = useState<
    Record<keyof TrimmedCard['cardKey'], TrimmedCard>
  >({});
  const enabled = useExperimentalFlag(REMOTE_CARDS);

  useCardCollectionQuery(
    {},
    {
      enabled,
      refetchInterval: 60_000,
      onSuccess: (data: CardCollectionResult) => {
        console.log({ data });
        if (!data?.cardCollection?.items.length) return;

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

        if (!newCards) return;

        setCards(newCards);
      },
    }
  );

  const dismissCard = async (cardKey: keyof TrimmedCard['cardKey']) => {
    ls.cards.set([cardKey], true);
    setCards(prev => {
      const { [cardKey]: _, ...rest } = prev;
      return rest;
    });
  };

  const getCardsForPlacement = (placement: string) => {
    return (Object.values(cards) as TrimmedCard[])
      .filter(card => card.placement === placement)
      .sort((a, b) => {
        if (a.index === b.index) return 0;
        if (!a.index || a.index === undefined) return 1;
        if (!b.index || b.index === undefined) return -1;

        return a.index - b.index;
      });
  };

  console.log(cards);

  return (
    <RemoteCardContext.Provider
      value={{ cards, setCards, dismissCard, getCardsForPlacement }}
    >
      {children}
    </RemoteCardContext.Provider>
  );
};

export const useRemoteCardContext = () => React.useContext(RemoteCardContext);
